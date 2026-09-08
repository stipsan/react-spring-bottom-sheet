//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import { useActorRef } from '@xstate/react'
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { fromPromise } from 'xstate'
import {
  useAriaHider,
  useFocusTrap,
  useLayoutEffect,
  useReady,
  useReducedMotion,
  useScrollLock,
  useSnapPoints,
  useSpring,
  useSpringInterpolations,
} from './hooks'
import { overlayMachine } from './machines/overlay'
import type { OverlayEvent, SnapSource } from './machines/overlay'
import type {
  defaultSnapProps,
  MutableRef,
  Props,
  RefHandles,
  ResizeSource,
  SnapPointProps,
  SpringConfig,
} from './types'
import { rubberbandIfOutOfBounds } from './utils'

const { tension, friction } = config.default

type SpringUpdate = {
  y?: number
  ready?: number
  maxHeight?: number
  minSnap?: number
  maxSnap?: number
  immediate?: boolean
  config?: Partial<SpringConfig>
}

export const BottomSheet = React.forwardRef<
  RefHandles,
  {
    initialState: 'OPEN' | 'CLOSED'
    lastSnapRef: MutableRef<number | null>
  } & Props
>(function BottomSheetInternal(
  {
    children,
    sibling,
    className,
    footer,
    header,
    open: _open,
    initialState,
    lastSnapRef,
    initialFocusRef,
    onDismiss,
    maxHeight: controlledMaxHeight,
    defaultSnap: getDefaultSnap = _defaultSnap,
    snapPoints: getSnapPoints = _snapPoints,
    blocking = true,
    scrollerRef,
    scrollLocking = true,
    style,
    springConfig,
    onSpringStart,
    onSpringCancel,
    onSpringEnd,
    reserveScrollBarGap = blocking,
    expandOnContentDrag = false,
    ...props
  },
  forwardRef
) {
  // Before any animations can start we need to measure a few things, like the viewport and the dimensions of content, and header + footer if they exist
  const { ready, registerReady } = useReady()

  // Controls the drag handler, used by spring operations that happen outside the render loop in React
  const canDragRef = useRef(false)

  // This way apps don't have to remember to wrap their callbacks in useCallback to avoid breaking the sheet
  const onSpringStartRef = useRef(onSpringStart)
  const onSpringCancelRef = useRef(onSpringCancel)
  const onSpringEndRef = useRef(onSpringEnd)
  const springConfigRef = useRef(springConfig)
  useEffect(() => {
    onSpringStartRef.current = onSpringStart
    onSpringCancelRef.current = onSpringCancel
    onSpringEndRef.current = onSpringEnd
    springConfigRef.current = springConfig
  }, [onSpringCancel, onSpringStart, onSpringEnd, springConfig])

  // Behold, the engine of it all!
  const [spring, api] = useSpring()

  const defaultScrollerRef = useRef<HTMLDivElement>(null)
  const scrollRef = scrollerRef ?? defaultScrollerRef
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Keeps track of the current height, or the height transitioning to
  const heightRef = useRef(0)
  const resizeSourceRef = useRef<ResizeSource | undefined>(undefined)
  const preventScrollingRef = useRef(false)

  const prefersReducedMotion = useReducedMotion()

  // "Plugins" huhuhu
  const scrollLockRef = useScrollLock({
    targetRef: scrollRef,
    enabled: ready && scrollLocking,
    reserveScrollBarGap,
  })
  const ariaHiderRef = useAriaHider({
    targetRef: containerRef,
    enabled: ready && blocking,
  })
  const focusTrapRef = useFocusTrap({
    targetRef: containerRef,
    fallbackRef: overlayRef,
    initialFocusRef: initialFocusRef || undefined,
    enabled: ready && blocking && initialFocusRef !== false,
  })

  const { minSnap, maxSnap, maxHeight, findSnap } = useSnapPoints({
    contentRef,
    controlledMaxHeight,
    footerEnabled: !!footer,
    footerRef,
    getSnapPoints,
    headerEnabled: header !== false,
    headerRef,
    heightRef,
    lastSnapRef,
    ready,
    registerReady,
    resizeSourceRef,
  })

  // Setup refs that are used in cases where full control is needed over when a side effect is executed
  const maxHeightRef = useRef(maxHeight)
  const minSnapRef = useRef(minSnap)
  const maxSnapRef = useRef(maxSnap)
  const findSnapRef = useRef(findSnap)
  const defaultSnapRef = useRef(0)
  // Sync the refs with current state, giving the spring full control over when to respond to changes
  useLayoutEffect(() => {
    maxHeightRef.current = maxHeight
    maxSnapRef.current = maxSnap
    minSnapRef.current = minSnap
    findSnapRef.current = findSnap
    defaultSnapRef.current = findSnap(getDefaultSnap)
  }, [findSnap, getDefaultSnap, maxHeight, maxSnap, minSnap])

  // Starts a spring transition and resolves when it settles (or gets interrupted)
  const asyncSet = useCallback(
    ({ config: { velocity = 1, ...userConfig } = {}, ...opts }: SpringUpdate) =>
      Promise.all(
        api.start({
          ...opts,
          config: {
            velocity,
            ...userConfig,
            // @see https://springs.pomb.us
            mass: 1,
            // "stiffness"
            tension,
            // "damping"
            friction: Math.max(
              friction,
              friction + (friction - friction * velocity)
            ),
            // When duration is set the spring physics above are ignored in favor of a fixed length tween
            duration: 115,
            ...springConfigRef.current,
          },
        })
      ),
    [api]
  )

  // Every implementation reads from refs, so the machine only needs to be wired up once
  const machine = useMemo(
    () =>
      overlayMachine.provide({
        actions: {
          onOpenCancel: () => onSpringCancelRef.current?.({ type: 'OPEN' }),
          onSnapCancel: ({ context }) =>
            onSpringCancelRef.current?.({
              type: 'SNAP',
              source: context.snapSource,
            }),
          onCloseCancel: () => onSpringCancelRef.current?.({ type: 'CLOSE' }),
          onResizeCancel: () =>
            onSpringCancelRef.current?.({
              type: 'RESIZE',
              source: resizeSourceRef.current,
            }),
          onOpenEnd: () => onSpringEndRef.current?.({ type: 'OPEN' }),
          onSnapEnd: ({ context }) =>
            onSpringEndRef.current?.({
              type: 'SNAP',
              source: context.snapSource,
            }),
          onResizeEnd: () =>
            onSpringEndRef.current?.({
              type: 'RESIZE',
              source: resizeSourceRef.current,
            }),
        },
        actors: {
          onSnapStart: fromPromise<void, { snapSource?: SnapSource }>(
            async ({ input }) => {
              await onSpringStartRef.current?.({
                type: 'SNAP',
                source: input.snapSource || 'custom',
              })
            }
          ),
          onOpenStart: fromPromise(async () => {
            await onSpringStartRef.current?.({ type: 'OPEN' })
          }),
          onCloseStart: fromPromise(async () => {
            await onSpringStartRef.current?.({ type: 'CLOSE' })
          }),
          onResizeStart: fromPromise(async () => {
            await onSpringStartRef.current?.({
              type: 'RESIZE',
              source: resizeSourceRef.current,
            })
          }),
          onSnapEnd: fromPromise<void, { snapSource?: SnapSource }>(
            async ({ input }) => {
              await onSpringEndRef.current?.({
                type: 'SNAP',
                source: input.snapSource,
              })
            }
          ),
          onOpenEnd: fromPromise(async () => {
            await onSpringEndRef.current?.({ type: 'OPEN' })
          }),
          onCloseEnd: fromPromise(async () => {
            await onSpringEndRef.current?.({ type: 'CLOSE' })
          }),
          onResizeEnd: fromPromise(async () => {
            await onSpringEndRef.current?.({
              type: 'RESIZE',
              source: resizeSourceRef.current,
            })
          }),
          renderVisuallyHidden: fromPromise(async () => {
            await asyncSet({
              y: defaultSnapRef.current,
              ready: 0,
              maxHeight: maxHeightRef.current,
              maxSnap: maxSnapRef.current,
              // Using defaultSnapRef instead of minSnapRef to avoid animating `height` on open
              minSnap: defaultSnapRef.current,
              immediate: true,
            })
          }),
          activate: fromPromise(async () => {
            canDragRef.current = true
            await Promise.all([
              scrollLockRef.current.activate(),
              focusTrapRef.current.activate(),
              ariaHiderRef.current.activate(),
            ])
          }),
          deactivate: fromPromise(async () => {
            scrollLockRef.current.deactivate()
            focusTrapRef.current.deactivate()
            ariaHiderRef.current.deactivate()
            canDragRef.current = false
          }),
          openImmediately: fromPromise(async () => {
            heightRef.current = defaultSnapRef.current
            await asyncSet({
              y: defaultSnapRef.current,
              ready: 1,
              maxHeight: maxHeightRef.current,
              maxSnap: maxSnapRef.current,
              // Using defaultSnapRef instead of minSnapRef to avoid animating `height` on open
              minSnap: defaultSnapRef.current,
              immediate: true,
            })
          }),
          openSmoothly: fromPromise(async () => {
            await asyncSet({
              y: 0,
              ready: 1,
              maxHeight: maxHeightRef.current,
              maxSnap: maxSnapRef.current,
              // Using defaultSnapRef instead of minSnapRef to avoid animating `height` on open
              minSnap: defaultSnapRef.current,
              immediate: true,
            })

            heightRef.current = defaultSnapRef.current

            await asyncSet({
              y: defaultSnapRef.current,
              ready: 1,
              maxHeight: maxHeightRef.current,
              maxSnap: maxSnapRef.current,
              // Using defaultSnapRef instead of minSnapRef to avoid animating `height` on open
              minSnap: defaultSnapRef.current,
              immediate: prefersReducedMotion.current,
            })
          }),
          snapSmoothly: fromPromise<void, { y: number; velocity: number }>(
            async ({ input }) => {
              const snap = findSnapRef.current(input.y)
              heightRef.current = snap
              lastSnapRef.current = snap
              await asyncSet({
                y: snap,
                ready: 1,
                maxHeight: maxHeightRef.current,
                maxSnap: maxSnapRef.current,
                minSnap: minSnapRef.current,
                immediate: prefersReducedMotion.current,
                config: { velocity: input.velocity },
              })
            }
          ),
          resizeSmoothly: fromPromise(async () => {
            const snap = findSnapRef.current(heightRef.current)
            heightRef.current = snap
            lastSnapRef.current = snap
            await asyncSet({
              y: snap,
              ready: 1,
              maxHeight: maxHeightRef.current,
              maxSnap: maxSnapRef.current,
              minSnap: minSnapRef.current,
              immediate:
                resizeSourceRef.current === 'element'
                  ? prefersReducedMotion.current
                  : true,
            })
          }),
          closeSmoothly: fromPromise(async () => {
            // Avoid animating the height property on close and stay within FLIP bounds by upping the minSnap
            asyncSet({
              minSnap: heightRef.current,
              immediate: true,
            })

            heightRef.current = 0

            await asyncSet({
              y: 0,
              maxHeight: maxHeightRef.current,
              maxSnap: maxSnapRef.current,
              immediate: prefersReducedMotion.current,
            })

            await asyncSet({ ready: 0, immediate: true })
          }),
        },
      }),
    [
      ariaHiderRef,
      asyncSet,
      focusTrapRef,
      lastSnapRef,
      prefersReducedMotion,
      scrollLockRef,
    ]
  )
  const actorRef = useActorRef(machine, { input: { initialState } })
  const send = useCallback(
    (event: OverlayEvent) => actorRef.send(event),
    [actorRef]
  )

  // Machine transitions only affect the data-rsbs-state attribute, so they are applied straight to the DOM
  // instead of re-rendering React (and the sheet contents) on every step of an animation sequence
  useLayoutEffect(() => {
    const root = containerRef.current
    if (!root) return

    const sub = actorRef.subscribe((snapshot) => {
      root.setAttribute('data-rsbs-state', publicState(snapshot))
    })
    return () => sub.unsubscribe()
  }, [actorRef])

  useEffect(() => {
    if (!ready) return

    send({ type: _open ? 'OPEN' : 'CLOSE' })
  }, [_open, send, ready])

  useLayoutEffect(() => {
    // Adjust the height whenever the snap points are changed due to resize events
    if (maxHeight || maxSnap || minSnap) {
      send({ type: 'RESIZE' })
    }
  }, [maxHeight, maxSnap, minSnap, send])

  useEffect(
    () => () => {
      // Ensure effects are cleaned up on unmount, in case they're not cleaned up otherwise
      scrollLockRef.current.deactivate()
      focusTrapRef.current.deactivate()
      ariaHiderRef.current.deactivate()
    },
    [ariaHiderRef, focusTrapRef, scrollLockRef]
  )

  useImperativeHandle(
    forwardRef,
    () => ({
      snapTo: (numberOrCallback, { velocity = 1, source = 'custom' } = {}) => {
        send({
          type: 'SNAP',
          payload: {
            y: findSnapRef.current(numberOrCallback),
            velocity,
            source,
          },
        })
      },
      get height() {
        return heightRef.current
      },
      get scrollElement() {
        return scrollRef.current
      },
    }),
    [send, scrollRef]
  )

  useEffect(() => {
    const elem = scrollRef.current
    if (!elem || !expandOnContentDrag) return

    const preventScrolling = (e: Event) => {
      if (preventScrollingRef.current) {
        e.preventDefault()
      }
    }

    const preventSafariOverscroll = (e: Event) => {
      if (elem.scrollTop < 0) {
        requestAnimationFrame(() => {
          elem.style.overflow = 'hidden'
          elem.scrollTop = 0
          elem.style.removeProperty('overflow')
        })
        e.preventDefault()
      }
    }

    elem.addEventListener('touchmove', preventScrolling, { passive: false })
    elem.addEventListener('touchstart', preventSafariOverscroll, {
      passive: false,
    })

    return () => {
      elem.removeEventListener('touchmove', preventScrolling)
      elem.removeEventListener('touchstart', preventSafariOverscroll)
    }
  }, [expandOnContentDrag, scrollRef])

  const handleDrag = ({
    args: [{ closeOnTap = false, isContentDragging = false } = {}] = [],
    cancel,
    direction: [, direction],
    down,
    first,
    last,
    memo = spring.y.get(),
    movement: [, _my],
    tap,
    velocity: [, velocity],
  }) => {
    const my = _my * -1

    // Cancel the drag operation if the canDrag state changed
    if (!canDragRef.current) {
      cancel()
      return memo
    }

    if (onDismiss && closeOnTap && tap) {
      cancel()
      // Runs onDismiss in a timeout to avoid tap events on the backdrop from triggering click events on elements underneath
      setTimeout(() => onDismiss(), 0)
      return memo
    }

    // Filter out taps
    if (tap) {
      return memo
    }

    const rawY = memo + my
    const predictedDistance = my * velocity
    const predictedY = Math.max(
      minSnapRef.current,
      Math.min(maxSnapRef.current, rawY + predictedDistance * 2)
    )

    if (
      !down &&
      onDismiss &&
      direction > 0 &&
      rawY + predictedDistance < minSnapRef.current / 2
    ) {
      cancel()
      onDismiss()
      return memo
    }

    let newY = down
      ? // @TODO figure out a better way to deal with rubberband overshooting if min and max have the same value
        !onDismiss && minSnapRef.current === maxSnapRef.current
        ? rawY < minSnapRef.current
          ? rubberbandIfOutOfBounds(
              rawY,
              minSnapRef.current,
              maxSnapRef.current * 2,
              0.55
            )
          : rubberbandIfOutOfBounds(
              rawY,
              minSnapRef.current / 2,
              maxSnapRef.current,
              0.55
            )
        : rubberbandIfOutOfBounds(
            rawY,
            onDismiss ? 0 : minSnapRef.current,
            maxSnapRef.current,
            0.55
          )
      : predictedY

    if (expandOnContentDrag && isContentDragging) {
      if (newY >= maxSnapRef.current) {
        newY = maxSnapRef.current
      }

      if (memo === maxSnapRef.current && scrollRef.current.scrollTop > 0) {
        newY = maxSnapRef.current
      }

      preventScrollingRef.current = newY < maxSnapRef.current
    } else {
      preventScrollingRef.current = false
    }

    if (first) {
      send({ type: 'DRAG' })
    }

    if (last) {
      send({
        type: 'SNAP',
        payload: {
          y: newY,
          velocity: velocity > 0.05 ? velocity : 1,
          source: 'dragging',
        },
      })

      return memo
    }

    api.start({
      y: newY,
      ready: 1,
      maxHeight: maxHeightRef.current,
      maxSnap: maxSnapRef.current,
      minSnap: minSnapRef.current,
      immediate: true,
    })

    return memo
  }

  const bind = useDrag(handleDrag, {
    filterTaps: true,
  })

  if (Number.isNaN(maxSnapRef.current)) {
    throw new TypeError('maxSnapRef is NaN!!')
  }
  if (Number.isNaN(minSnapRef.current)) {
    throw new TypeError('minSnapRef is NaN!!')
  }

  const interpolations = useSpringInterpolations({ spring })

  return (
    <animated.div
      {...props}
      data-rsbs-root
      data-rsbs-state={publicState(actorRef.getSnapshot())}
      data-rsbs-is-blocking={blocking}
      data-rsbs-is-dismissable={!!onDismiss}
      data-rsbs-has-header={!!header}
      data-rsbs-has-footer={!!footer}
      className={className}
      ref={containerRef}
      style={{
        // spread in the interpolations yeees
        ...interpolations,
        // but allow overriding them/disabling them
        ...style,
        // Not overridable as the "focus lock with opacity 0" trick rely on it
        opacity: spring.ready,
      }}
    >
      {sibling}
      {blocking && (
        <div
          // This component needs to be placed outside bottom-sheet, as bottom-sheet uses transform and thus creates a new context
          // that clips this element to the container, not allowing it to cover the full page.
          key="backdrop"
          data-rsbs-backdrop
          {...bind({ closeOnTap: true })}
        />
      )}
      {/* A dialog handling Escape is the expected pattern; the rule assumes a static element */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        key="overlay"
        aria-modal={blocking}
        role="dialog"
        data-rsbs-overlay
        tabIndex={-1}
        ref={overlayRef}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            // Always stop propagation, to avoid weirdness for bottom sheets inside other bottom sheets
            event.stopPropagation()
            if (onDismiss) onDismiss()
          }
        }}
      >
        {header !== false && (
          <div key="header" data-rsbs-header ref={headerRef} {...bind()}>
            {header}
          </div>
        )}
        <div
          key="scroll"
          data-rsbs-scroll
          ref={scrollRef}
          {...(expandOnContentDrag ? bind({ isContentDragging: true }) : {})}
        >
          <div data-rsbs-content ref={contentRef}>
            {children}
          </div>
        </div>
        {footer && (
          <div key="footer" ref={footerRef} data-rsbs-footer {...bind()}>
            {footer}
          </div>
        )}
      </div>
    </animated.div>
  )
})

// Used for the data attribute, list over states available to CSS selectors
const publicStates = [
  'closed',
  'opening',
  'open',
  'closing',
  'dragging',
  'snapping',
  'resizing',
] as const

function publicState(snapshot: { matches: (state: string) => boolean }) {
  return publicStates.find((state) => snapshot.matches(state)) ?? ''
}

// Default prop values that are callbacks, and it's nice to save some memory and reuse their instances since they're pure
function _defaultSnap({ snapPoints, lastSnap }: defaultSnapProps) {
  return lastSnap ?? Math.min(...snapPoints)
}
function _snapPoints({ minHeight }: SnapPointProps) {
  return minHeight
}

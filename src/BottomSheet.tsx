//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import { useBottomSheetMachine } from '@bottom-sheet/react-hooks'
import {
  type BottomSheetEvent,
  computeSnapPointBounds,
} from '@bottom-sheet/state-machine'
import { animated } from '@react-spring/web'
import { rubberbandIfOutOfBounds, useDrag } from '@use-gesture/react'
import { useMachine } from '@xstate/react'
import React, {
  Fragment,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'

import {
  useAriaHider,
  useDimensions,
  useFocusTrap,
  useLayoutEffect,
  useReady,
  useReducedMotion,
  useScrollLock,
  useSpring,
  useSpringInterpolations,
} from './hooks'
import { overlayMachine } from './machines/overlay'
import type { Props, RefHandles, ResizeSource } from './types'

// @TODO implement AbortController to deal with race conditions

// List over events that if present in StateMachine.state.nextEvents means we can handle drag gestures
type EventType = Pick<BottomSheetEvent, 'type'>['type']
const CAN_DRAG_EVENTS: Readonly<EventType[]> = [
  'DRAG',
  'TRANSITION_DRAG',
  'DRAGGED',
] as const
function canDrag(event: any): boolean {
  return CAN_DRAG_EVENTS.includes(event)
}

// @TODO rename to SpringBottomSheet and allow userland to import it directly, for those who want maximum control and minimal bundlesize
export const BottomSheet = React.forwardRef<
  RefHandles,
  {
    initialState: 'OPEN' | 'CLOSED'
    lastSnapRef: React.MutableRefObject<number | null>
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
    initialHeight,
    snapPoints,
    blocking = true,
    scrollLocking = true,
    style,
    onSpringStart,
    onSpringCancel,
    onSpringEnd,
    reserveScrollBarGap = blocking,
    expandOnContentDrag = false,
    unstable__debug = false,
    ...props
  },
  forwardRef
) {
  // @TODO: migrating everything to the new hooks
  const { dispatch, state, getTransientSnapshot } = useBottomSheetMachine({
    initialHeight,
    snapPoints,
    // unstable__requestAnimationFrame: true,
  })
  useEffect(() => {
    console.debug(
      'useBottomSheetMachine.getTransientSnapshot',
      getTransientSnapshot()
    )
  }, [getTransientSnapshot])

  // Before any animations can start we need to measure a few things, like the viewport and the dimensions of content, and header + footer if they exist
  // @TODO make ready its own state perhaps, before open or closed
  const { ready, registerReady } = useReady()

  // This way apps don't have to remember to wrap their callbacks in useCallback to avoid breaking the sheet
  const onSpringStartRef = useRef(onSpringStart)
  const onSpringCancelRef = useRef(onSpringCancel)
  const onSpringEndRef = useRef(onSpringEnd)
  useEffect(() => {
    onSpringStartRef.current = onSpringStart
    onSpringCancelRef.current = onSpringCancel
    onSpringEndRef.current = onSpringEnd
  }, [onSpringCancel, onSpringStart, onSpringEnd])

  // @TODO const [styles, api] = useSpring()
  const [springStyles, springApi] = useSpring({ getTransientSnapshot })

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Keeps track of the current height, or the height transitioning to
  const heightRef = useRef(0)
  const resizeSourceRef = useRef<ResizeSource>()
  const preventScrollingRef = useRef(false)

  const prefersReducedMotion = useReducedMotion()

  // "Plugins" huhuhu
  const scrollLockRef = useScrollLock({
    targetRef: scrollRef,
    enabled: state.matches('open') && ready && scrollLocking,
    reserveScrollBarGap,
  })
  const ariaHiderRef = useAriaHider({
    targetRef: containerRef,
    enabled: state.matches('open') && ready && blocking,
  })
  const focusTrapRef = useFocusTrap({
    targetRef: containerRef,
    fallbackRef: overlayRef,
    initialFocusRef: initialFocusRef || undefined,
    enabled:
      state.matches('open') && ready && blocking && initialFocusRef !== false,
  })

  useDimensions({
    dispatch,
    state,
    contentRef,
    controlledMaxHeight,
    footerEnabled: !!footer,
    footerRef,
    headerEnabled: header !== false,
    headerRef,
    registerReady,
    resizeSourceRef,
  })

  // Setup refs that are used in cases where full control is needed over when a side effect is executed
  const maxHeightRef = useRef(state.context.maxHeight)
  const minSnapRef = useRef(Math.min(...state.context.snapPoints))
  const maxSnapRef = useRef(Math.max(...state.context.snapPoints))
  // Sync the refs with current state, giving the spring full control over when to respond to changes
  useLayoutEffect(() => {
    maxHeightRef.current = state.context.maxHeight
    minSnapRef.current = Math.min(...state.context.snapPoints)
    maxSnapRef.current = Math.max(...state.context.snapPoints)
  }, [state.context.maxHeight, state.context.snapPoints])

  // New utility for using events safely
  // @TODO stop using asyncSet
  /*
  const asyncSet = useCallback<typeof springApi>(
    // @ts-expect-error
    ({ onRest, config: { velocity = 1, ...config } = {}, ...opts }) =>
      new Promise((resolve) =>
        springApi({
          ...opts,
          config: {
            velocity,
            ...config,
            // @see https://springs.pomb.us
            mass: 1,
            // "stiffness"
            tension,
            // "damping"
            friction: Math.max(
              friction,
              friction + (friction - friction * velocity)
            ),
          },
          onRest: (...args) => {
            resolve(...args)
            onRest?.(...args)
          },
        })
      ),
    [springApi]
  )
  //*/

  // @TODO deprecate this state machine in favor of the new one
  useMachine(overlayMachine, {
    context: { initialState },
    services: {
      renderVisuallyHidden: useCallback(
        async (context, event) => {
          await asyncSet({
            y: state.context.height,
            maxHeight: maxHeightRef.current,
            maxSnap: maxSnapRef.current,
            // Using height instead of minSnapRef to avoid animating `height` on open
            minSnap: state.context.height,
            immediate: true,
          })
        },
        [state.context.height]
      ),
      activate: useCallback(
        async (context, event) => {
          await Promise.all([
            scrollLockRef.current.activate(),
            focusTrapRef.current.activate(),
            ariaHiderRef.current.activate(),
          ])
        },
        [ariaHiderRef, focusTrapRef, scrollLockRef]
      ),
      deactivate: useCallback(async () => {
        scrollLockRef.current.deactivate()
        focusTrapRef.current.deactivate()
        ariaHiderRef.current.deactivate()
      }, [ariaHiderRef, focusTrapRef, scrollLockRef]),
      openImmediately: useCallback(async () => {
        heightRef.current = state.context.height
        await asyncSet({
          y: state.context.height,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          // Using height instead of minSnapRef to avoid animating `height` on open
          minSnap: state.context.height,
          immediate: true,
        })
      }, [state.context.height]),
      openSmoothly: useCallback(async () => {
        await asyncSet({
          y: 0,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          // Using height instead of minSnapRef to avoid animating `height` on open
          minSnap: state.context.height,
          immediate: true,
        })

        heightRef.current = state.context.height

        await asyncSet({
          y: state.context.height,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          // Using height instead of minSnapRef to avoid animating `height` on open
          minSnap: state.context.height,
          immediate: prefersReducedMotion.current,
        })
      }, [prefersReducedMotion, state.context.height]),
      snapSmoothly: useCallback(
        async (context, event) => {
          const [snap] = computeSnapPointBounds(
            context.y,
            state.context.snapPoints as [number, ...number[]]
          )
          heightRef.current = snap
          lastSnapRef.current = snap
          await asyncSet({
            y: snap,
            maxHeight: maxHeightRef.current,
            maxSnap: maxSnapRef.current,
            minSnap: minSnapRef.current,
            immediate: prefersReducedMotion.current,
            config: { velocity: context.velocity },
          })
        },
        [lastSnapRef, prefersReducedMotion, state.context.snapPoints]
      ),
      resizeSmoothly: useCallback(async () => {
        const [snap] = computeSnapPointBounds(
          heightRef.current,
          state.context.snapPoints as [number, ...number[]]
        )
        heightRef.current = snap
        lastSnapRef.current = snap
        await asyncSet({
          y: snap,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          minSnap: minSnapRef.current,
          immediate:
            resizeSourceRef.current === 'element'
              ? prefersReducedMotion.current
              : true,
        })
      }, [lastSnapRef, prefersReducedMotion, state.context.snapPoints]),
      closeSmoothly: useCallback(
        async (context, event) => {
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

          await asyncSet({ immediate: true })
        },
        [prefersReducedMotion]
      ),
    },
  })

  useEffect(() => {
    // onSpringStart OPEN
    if (state.matches('open.opening.waiting') && ready) {
      // @TODO: fire AUTOFOCUS event here when we need to animate a soft keyboard focus
      dispatch({ type: 'TRANSITION_OPEN' })
    }

    if (state.matches('open.opening.transition')) {
      springApi.start({
        maxHeight: state.context.maxHeight,
        maxSnap: state.context.snapPoints.at(-1),
        minSnap: state.context.snapPoints[0],
        height: state.context.height,
        onRest: () => dispatch({ type: 'OPENED' }),
      })
    }

    if (state.matches('open.dragging.transition')) {
      springApi.start({
        maxHeight: state.context.maxHeight,
        maxSnap: state.context.snapPoints.at(-1),
        minSnap: state.context.snapPoints[0],
        height: state.context.height,
        onRest: () => dispatch({ type: 'DRAGGED' }),
      })
    }
  }, [dispatch, ready, springApi, state])

  useEffect(() => {
    if (_open) {
      dispatch({ type: 'OPEN' })
    } else {
      dispatch({ type: 'CLOSE' })
    }
  }, [_open, dispatch])
  useLayoutEffect(() => {
    const maxSnap = Math.max(...state.context.snapPoints)
    const minSnap = Math.min(...state.context.snapPoints)
    // Adjust the height whenever the snap points are changed due to resize events
    if (state.context.maxHeight || maxSnap || minSnap) {
      dispatch({ type: 'RESIZE', payload: { height: state.context.height } })
    }
  }, [
    state.context.maxHeight,
    state.context.snapPoints,
    state.context.height,
    dispatch,
  ])
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
        // @TODO consider using refs for this
        console.log('TODO, send velocity and source', { velocity, source })
        dispatch({
          type: 'SNAP',
          payload: {
            height: computeSnapPointBounds(
              typeof numberOrCallback === 'function'
                ? numberOrCallback({
                    maxHeight: state.context.maxHeight,
                    headerHeight: state.context.headerHeight,
                    contentHeight: state.context.contentHeight,
                    footerHeight: state.context.footerHeight,
                    maxContent: state.context.maxContent,
                    minContent: state.context.minContent,
                    snapPoints: state.context.snapPoints,
                    lastHeight: state.context.lastHeight,
                    height: state.context.height,
                  })
                : numberOrCallback,
              state.context.snapPoints as [number, ...number[]]
            )[0],
            // source,
            // velocity,
          },
        })
      },
      get height() {
        return heightRef.current
      },
    }),
    [
      dispatch,
      state.context.contentHeight,
      state.context.footerHeight,
      state.context.headerHeight,
      state.context.height,
      state.context.lastHeight,
      state.context.maxContent,
      state.context.maxHeight,
      state.context.minContent,
      state.context.snapPoints,
    ]
  )

  useEffect(() => {
    const elem = scrollRef.current

    const preventScrolling = (e) => {
      if (preventScrollingRef.current) {
        e.preventDefault()
      }
    }

    const preventSafariOverscroll = (e) => {
      if (elem.scrollTop < 0) {
        requestAnimationFrame(() => {
          elem.style.overflow = 'hidden'
          elem.scrollTop = 0
          elem.style.removeProperty('overflow')
        })
        e.preventDefault()
      }
    }

    if (expandOnContentDrag) {
      elem.addEventListener('scroll', preventScrolling)
      elem.addEventListener('touchmove', preventScrolling)
      elem.addEventListener('touchstart', preventSafariOverscroll)
    }
    return () => {
      elem.removeEventListener('scroll', preventScrolling)
      elem.removeEventListener('touchmove', preventScrolling)
      elem.removeEventListener('touchstart', preventSafariOverscroll)
    }
  }, [expandOnContentDrag, scrollRef])

  const bind = useDrag(
    ({
      args: [{ closeOnTap = false, isContentDragging = false } = {}] = [],
      cancel,
      direction: [, direction],
      down,
      last,
      memo = springStyles.height.get(),
      movement: [, _my],
      tap,
      velocity,
    }) => {
      try {
        console.group('useDrag')
        console.warn('start', { last })

        // Cancel the drag operation if the canDrag state changed
        if (!getTransientSnapshot().nextEvents.some(canDrag)) {
          console.debug('Cancelling drag', getTransientSnapshot().nextEvents)
          cancel()
          return memo
        }

        if (onDismiss && closeOnTap && tap) {
          console.debug('Closing on tap')
          cancel()
          // Runs onDismiss in a timeout to avoid tap events on the backdrop from triggering click events on elements underneath
          setTimeout(() => onDismiss(), 0)
          return memo
        }

        // Filter out taps
        if (tap) {
          console.debug('Filter out tap')
          return memo
        }

        const my = _my * -1
        const rawY = memo + my
        const predictedDistance = my * velocity[1]
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
          console.debug('closing on swipe')
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

        if (getTransientSnapshot().can('DRAG')) {
          dispatch({ type: 'DRAG' })
        }

        if (last) {
          console.debug('Last')
          console.log('TRANSITION_DRAG,', { newY })

          dispatch({
            type: 'TRANSITION_DRAG',
            payload: {
              height: newY,
              //@ts-expect-error due to extra props
              velocity: velocity[1] > 0.05 ? velocity[1] : 1,
              source: 'dragging',
            },
          })
          springApi.start({
            height: newY,
            maxHeight: maxHeightRef.current,
            maxSnap: maxSnapRef.current,
            minSnap: minSnapRef.current,
            onRest: () => dispatch({ type: 'DRAGGED' }),
          })

          return memo
        }

        springApi.set({
          height: newY,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          minSnap: minSnapRef.current,
        })

        return memo
      } finally {
        console.groupEnd()
      }
    },
    {
      filterTaps: true,
    }
  )

  if (Number.isNaN(maxSnapRef.current)) {
    throw new TypeError('maxSnapRef is NaN!!')
  }
  if (Number.isNaN(minSnapRef.current)) {
    throw new TypeError('minSnapRef is NaN!!')
  }

  const interpolations = useSpringInterpolations({ spring: springStyles })

  return (
    <animated.div
      {...props}
      data-rsbs-root
      data-rsbs-is-blocking={blocking || undefined}
      data-rsbs-is-dismissable={!!onDismiss || undefined}
      data-rsbs-has-header={!!header || undefined}
      data-rsbs-has-footer={!!footer || undefined}
      data-rsbs-open={state.matches('open') || undefined}
      data-rsbs-opening={state.matches('open.opening') || undefined}
      data-rsbs-waiting={state.matches('open.opening.waiting') || undefined}
      data-rsbs-autofocusing={
        state.matches('open.opening.autofocusing') || undefined
      }
      data-rsbs-dragging={state.matches('open.dragging') || undefined}
      data-rsbs-snapping={state.matches('open.snapping') || undefined}
      data-rsbs-resizing={state.matches('open.resizing') || undefined}
      data-rsbs-closing={state.matches('open.closing') || undefined}
      data-rsbs-closed={state.matches('closed') || undefined}
      className={className}
      ref={containerRef}
      style={{
        // spread in the interpolations yeees
        ...interpolations,
        // but allow overriding them/disabling them
        // @TODO: flip order, allow overriding interpolations by using a callback
        ...style,
      }}
    >
      {unstable__debug && (
        <div
          key="debug"
          data-rsbs-debug
          style={{
            position: 'fixed',
            top: 10,
            right: 10,
            overflow: 'auto',
            width: '33vw',
            maxHeight: 'calc(100vh - 20px)',
            zIndex: 99999999,
            background: 'hsla(0,0%,10%,0.95)',
            color: 'hsla(0,0%,100%,0.75)',
            padding: '0.2rem 0.4rem',
            borderRadius: '0.2rem',
            fontSize: '0.8rem',
            resize: 'vertical',
          }}
        >
          <div>Bottom Sheet Debugger</div>
          <hr style={{ opacity: 0.6 }} />
          <details open>
            <summary>State Machine ({state.toStrings().at(-1)})</summary>
            <details>
              <summary>
                context:{' '}
                {`{"height": ${JSON.stringify(state.context.height)}, ...}`}
              </summary>
              <pre>{JSON.stringify(state.context, null, 2)}</pre>
            </details>
            <details>
              <summary>nextEvents</summary>
              <pre>{JSON.stringify(state.nextEvents, null, 2)}</pre>
            </details>
          </details>
          <hr style={{ opacity: 0.6 }} />
          <details>
            <summary>
              Spring: {`{`}"height": "
              <animated.span>
                {springStyles.height.to((height) => Math.round(height))}
              </animated.span>
              ", ...{`}`}
            </summary>
            <pre>
              {`{`}
              <br />
              &nbsp;&nbsp;height:{' '}
              <animated.span>{springStyles.height}</animated.span>
              <br />
              &nbsp;&nbsp;maxHeight:{' '}
              <animated.span>{springStyles.maxHeight}</animated.span>
              <br />
              &nbsp;&nbsp;maxSnap:{' '}
              <animated.span>{springStyles.maxSnap}</animated.span>
              <br />
              &nbsp;&nbsp;minSnap:{' '}
              <animated.span>{springStyles.minSnap}</animated.span>
              <br />
              &nbsp;&nbsp;bufferSnap:{' '}
              <animated.span>{springStyles.bufferSnap}</animated.span>
              <br />
              &nbsp;&nbsp;debug__predictedHeight:{' '}
              <animated.span>
                {springStyles.debug__predictedHeight}
              </animated.span>
              <br />
              &nbsp;&nbsp;debug__predictedSnapPoint:{' '}
              <animated.span>
                {springStyles.debug__predictedSnapPoint}
              </animated.span>
              <br />
              {`}`}
            </pre>
          </details>
          <hr style={{ opacity: 0.6 }} />
          <details>
            <summary>CSS Variables</summary>
            <pre>
              {`{`}
              <br />
              {Object.keys(interpolations).map((key) => (
                <Fragment key={key}>
                  &nbsp;&nbsp;{key}:{' '}
                  <animated.span>{interpolations[key]}</animated.span>
                  <br />
                </Fragment>
              ))}
              {`}`}
            </pre>
          </details>
        </div>
      )}
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
      <div
        key="overlay"
        aria-modal="true"
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

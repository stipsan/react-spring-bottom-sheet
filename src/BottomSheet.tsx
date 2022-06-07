//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import { useBottomSheetMachine } from '@bottom-sheet/react-hooks'
import { computeSnapPointBounds } from '@bottom-sheet/state-machine'
import { animated, config } from '@react-spring/web'
import { useMachine } from '@xstate/react'
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { rubberbandIfOutOfBounds, useDrag } from 'react-use-gesture'

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
import { debugging } from './utils'

const { tension, friction } = config.default

// @TODO implement AbortController to deal with race conditions

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
    ...props
  },
  forwardRef
) {
  // @TODO: migrating everything to the new hooks
  const { dispatch, state, getTransientSnapshot } = useBottomSheetMachine({
    initialHeight,
    snapPoints,
    unstable__requestAnimationFrame: true,
  })
  useEffect(() => {
    console.debug(
      'useBottomSheetMachine.getTransientSnapshot',
      getTransientSnapshot
    )
  }, [getTransientSnapshot])

  // Before any animations can start we need to measure a few things, like the viewport and the dimensions of content, and header + footer if they exist
  // @TODO make ready its own state perhaps, before open or closed
  const { ready, registerReady } = useReady()

  // Controls the drag handler, used by spring operations that happen outside the render loop in React
  const canDragRef = useRef(false)

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
  const [springStyles, springApi] = useSpring()

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
  // @TODO deprecate this state machine in favor of the new one
  useMachine(overlayMachine, {
    devTools: debugging,
    actions: {
      onOpenCancel: useCallback(
        () => onSpringCancelRef.current?.({ type: 'OPEN' }),
        []
      ),
      onSnapCancel: useCallback(
        (context) =>
          onSpringCancelRef.current?.({
            type: 'SNAP',
            source: context.snapSource,
          }),
        []
      ),
      onCloseCancel: useCallback(
        () => onSpringCancelRef.current?.({ type: 'CLOSE' }),
        []
      ),
      onResizeCancel: useCallback(
        () =>
          onSpringCancelRef.current?.({
            type: 'RESIZE',
            source: resizeSourceRef.current,
          }),
        []
      ),
      onOpenEnd: useCallback(
        () => onSpringEndRef.current?.({ type: 'OPEN' }),
        []
      ),
      onSnapEnd: useCallback(
        (context, event) =>
          onSpringEndRef.current?.({
            type: 'SNAP',
            source: context.snapSource,
          }),
        []
      ),
      onResizeEnd: useCallback(
        () =>
          onSpringEndRef.current?.({
            type: 'RESIZE',
            source: resizeSourceRef.current,
          }),
        []
      ),
    },
    context: { initialState },
    services: {
      onSnapStart: useCallback(
        async (context, event) =>
          onSpringStartRef.current?.({
            type: 'SNAP',
            source: event.payload.source || 'custom',
          }),
        []
      ),
      onOpenStart: useCallback(
        async () => onSpringStartRef.current?.({ type: 'OPEN' }),
        []
      ),
      onCloseStart: useCallback(
        async () => onSpringStartRef.current?.({ type: 'CLOSE' }),
        []
      ),
      onResizeStart: useCallback(
        async () =>
          onSpringStartRef.current?.({
            type: 'RESIZE',
            source: resizeSourceRef.current,
          }),
        []
      ),
      onSnapEnd: useCallback(
        async (context, event) =>
          onSpringEndRef.current?.({
            type: 'SNAP',
            source: context.snapSource,
          }),
        []
      ),
      onOpenEnd: useCallback(
        async () => onSpringEndRef.current?.({ type: 'OPEN' }),
        []
      ),
      onCloseEnd: useCallback(
        async () => onSpringEndRef.current?.({ type: 'CLOSE' }),
        []
      ),
      onResizeEnd: useCallback(
        async () =>
          onSpringEndRef.current?.({
            type: 'RESIZE',
            source: resizeSourceRef.current,
          }),
        []
      ),
      renderVisuallyHidden: useCallback(
        async (context, event) => {
          await asyncSet({
            y: state.context.height,
            ready: 0,
            maxHeight: maxHeightRef.current,
            maxSnap: maxSnapRef.current,
            // Using height instead of minSnapRef to avoid animating `height` on open
            minSnap: state.context.height,
            immediate: true,
          })
        },
        [asyncSet, state.context.height]
      ),
      activate: useCallback(
        async (context, event) => {
          canDragRef.current = true
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
        canDragRef.current = false
      }, [ariaHiderRef, focusTrapRef, scrollLockRef]),
      openImmediately: useCallback(async () => {
        heightRef.current = state.context.height
        await asyncSet({
          y: state.context.height,
          ready: 1,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          // Using height instead of minSnapRef to avoid animating `height` on open
          minSnap: state.context.height,
          immediate: true,
        })
      }, [asyncSet, state.context.height]),
      openSmoothly: useCallback(async () => {
        await asyncSet({
          y: 0,
          ready: 1,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          // Using height instead of minSnapRef to avoid animating `height` on open
          minSnap: state.context.height,
          immediate: true,
        })

        heightRef.current = state.context.height

        await asyncSet({
          y: state.context.height,
          ready: 1,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          // Using height instead of minSnapRef to avoid animating `height` on open
          minSnap: state.context.height,
          immediate: prefersReducedMotion.current,
        })
      }, [asyncSet, prefersReducedMotion, state.context.height]),
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
            ready: 1,
            maxHeight: maxHeightRef.current,
            maxSnap: maxSnapRef.current,
            minSnap: minSnapRef.current,
            immediate: prefersReducedMotion.current,
            config: { velocity: context.velocity },
          })
        },
        [asyncSet, lastSnapRef, prefersReducedMotion, state.context.snapPoints]
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
          ready: 1,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          minSnap: minSnapRef.current,
          immediate:
            resizeSourceRef.current === 'element'
              ? prefersReducedMotion.current
              : true,
        })
      }, [
        asyncSet,
        lastSnapRef,
        prefersReducedMotion,
        state.context.snapPoints,
      ]),
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

          await asyncSet({ ready: 0, immediate: true })
        },
        [asyncSet, prefersReducedMotion]
      ),
    },
  })

  useEffect(() => {
    if (state.matches('open.opening.waiting') && ready) {
      // @TODO: fire AUTOFOCUS event here when we need to animate a soft keyboard focus
      dispatch({ type: 'READY' })
    }
  }, [dispatch, ready, state])

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

  const handleDrag = ({
    args: [{ closeOnTap = false, isContentDragging = false } = {}] = [],
    cancel,
    direction: [, direction],
    down,
    first,
    last,
    memo = getTransientSnapshot().context.height,
    movement: [, _my],
    tap,
    velocity,
  }) => {
    const my = _my * -1

    // Cancel the drag operation if the canDrag state changed
    if (!canDragRef.current) {
      console.log('handleDrag cancelled dragging because canDragRef is false')
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
      dispatch({ type: 'DRAG' })
    }

    if (last) {
      send('SNAP', {
        payload: {
          y: newY,
          velocity: velocity > 0.05 ? velocity : 1,
          source: 'dragging',
        },
      })

      return memo
    }

    // @TODO too many rerenders
    //send('DRAG', { y: newY, velocity })
    //*
    springApi({
      y: newY,
      ready: 1,
      maxHeight: maxHeightRef.current,
      maxSnap: maxSnapRef.current,
      minSnap: minSnapRef.current,
      immediate: true,
      config: { velocity },
    })
    // */

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
            {JSON.stringify(state.value)}
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

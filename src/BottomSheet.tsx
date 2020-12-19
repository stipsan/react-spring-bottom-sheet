//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import React, { useEffect, useImperativeHandle, useRef } from 'react'
import { animated } from 'react-spring'
import { rubberbandIfOutOfBounds, useDrag } from 'react-use-gesture'
import {
  useAriaHider,
  useFocusTrap,
  useReady,
  useReducedMotion,
  useScrollLock,
  useSnapPoints,
  useSpring,
  useSpringInterpolations,
} from './hooks'
import type {
  defaultSnapProps,
  Props,
  RefHandles,
  SnapPointProps,
} from './types'

export const BottomSheet = React.forwardRef<
  RefHandles,
  {
    defaultOpen: boolean
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
    defaultOpen,
    lastSnapRef,
    initialFocusRef,
    onDismiss,
    maxHeight: controlledMaxHeight,
    defaultSnap: getDefaultSnap = _defaultSnap,
    snapPoints: getSnapPoints = _snapPoints,
    blocking = true,
    scrollLocking = true,
    style,
    onSpringStart,
    onSpringCancel,
    onSpringEnd,
    reserveScrollBarGap = blocking,
    ...props
  },
  forwardRef
) {
  // Just to aid my ADHD brain here and keep track, short names are sweet for public APIs
  // but confusing as heck when transitioning between touch gestures and spring animations
  const on = _open
  const off = !_open
  // Keep track of the initial states, to detect if the bottom sheet should animate or use immediate
  const startOnRef = useRef(defaultOpen)
  // Before any animations can start we need to measure a few things, like the viewport and the dimensions of content, and header + footer if they exist
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

  // Behold, the engine of it all!
  const [spring, set] = useSpring()

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Keeps track of the current height, or the height transitioning to
  const heightRef = useRef(0)

  const prefersReducedMotion = useReducedMotion()

  // "Plugins" huhuhu
  const scrollLockRef = useScrollLock({
    targetRef: contentRef,
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
    initialFocusRef,
    enabled: ready && blocking,
  })

  const { minSnap, maxSnap, maxHeight, findSnap } = useSnapPoints({
    contentContainerRef,
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
  })

  // Setup refs that are used in cases where full control is needed over when a side effect is executed
  const maxHeightRef = useRef(maxHeight)
  const minSnapRef = useRef(minSnap)
  const maxSnapRef = useRef(maxSnap)
  const findSnapRef = useRef(findSnap)
  const defaultSnapRef = useRef(0)
  // Sync the refs with current state, giving the spring full control over when to respond to changes
  useEffect(() => {
    maxHeightRef.current = maxHeight
    maxSnapRef.current = maxSnap
    minSnapRef.current = minSnap
    findSnapRef.current = findSnap
    defaultSnapRef.current = findSnap(getDefaultSnap)
  }, [findSnap, getDefaultSnap, maxHeight, maxSnap, minSnap])

  // Adjust the height whenever the snap points are changed due to resize events
  const springOnResize = useRef(false)
  useEffect(() => {
    if (springOnResize.current) {
      set({
        // @ts-expect-error
        to: async (next) => {
          console.group('RESIZE')

          onSpringStartRef.current?.({ type: 'RESIZE' })

          const snap = findSnapRef.current(heightRef.current)
          heightRef.current = snap
          lastSnapRef.current = snap

          await next({
            y: snap,
            maxHeight,
            maxSnap,
            minSnap,
            immediate: prefersReducedMotion.current,
          })

          onSpringEndRef.current?.({ type: 'RESIZE' })

          console.groupEnd()
        },
      })
    }
  }, [lastSnapRef, maxHeight, maxSnap, minSnap, prefersReducedMotion, set])
  useImperativeHandle(
    forwardRef,
    () => ({
      snapTo: (numberOrCallback) => {
        if (off) return

        // @TODO refactor to setState and useEffect hooks to easier track cancel events

        const snap = findSnap(numberOrCallback)
        lastSnapRef.current = snap
        heightRef.current = snap
        set({
          y: snap,
          immediate: prefersReducedMotion.current,
        })
      },
    }),
    [findSnap, lastSnapRef, off, prefersReducedMotion, set]
  )

  // Handle closed to open transition
  useEffect(() => {
    if (!ready || off) return

    let cancelled = false
    const cleanup = () => {
      scrollLockRef.current.deactivate()
      focusTrapRef.current.deactivate()
      ariaHiderRef.current.deactivate()
      canDragRef.current = false
    }
    const maybeCancel = () => {
      if (cancelled) {
        cleanup()
        onSpringCancelRef.current?.({ type: 'OPEN' })

        console.groupEnd()
      }
      return cancelled
    }

    set({
      // until we got better typing, hopefully in react-spring v9
      // @ts-expect-error
      to: async (next) => {
        console.group('OPEN')
        springOnResize.current = false

        if (maybeCancel()) return

        await onSpringStartRef.current?.({ type: 'OPEN' })

        if (maybeCancel()) return

        if (startOnRef.current) {
          console.log('immediate open')

          heightRef.current = defaultSnapRef.current
          await next({
            y: defaultSnapRef.current,
            ready: 1,
            maxHeight: maxHeightRef.current,
            maxSnap: maxSnapRef.current,
            // Using defaultSnapRef instead of minSnapRef to avoid animating `height` on open
            minSnap: defaultSnapRef.current,
            immediate: true,
          })

          if (maybeCancel()) return

          canDragRef.current = true
          await Promise.all([
            scrollLockRef.current.activate(),
            focusTrapRef.current.activate(),
            ariaHiderRef.current.activate(),
          ])

          if (maybeCancel()) return
        } else {
          console.log('animate open')
          await next({
            y: defaultSnapRef.current,
            ready: 0,
            maxHeight: maxHeightRef.current,
            maxSnap: maxSnapRef.current,
            // Using defaultSnapRef instead of minSnapRef to avoid animating `height` on open
            minSnap: defaultSnapRef.current,
            immediate: true,
          })

          if (maybeCancel()) return

          canDragRef.current = true
          await Promise.all([
            scrollLockRef.current.activate(),
            focusTrapRef.current.activate(),
            ariaHiderRef.current.activate(),
          ])

          if (maybeCancel()) return

          await next({
            y: 0,
            ready: 1,
            maxHeight: maxHeightRef.current,
            maxSnap: maxSnapRef.current,
            // Using defaultSnapRef instead of minSnapRef to avoid animating `height` on open
            minSnap: defaultSnapRef.current,
            immediate: true,
          })

          if (maybeCancel()) return

          heightRef.current = defaultSnapRef.current
          springOnResize.current = true
          await next({
            y: defaultSnapRef.current,
            ready: 1,
            maxHeight: maxHeightRef.current,
            maxSnap: maxSnapRef.current,
            // Using defaultSnapRef instead of minSnapRef to avoid animating `height` on open
            minSnap: defaultSnapRef.current,
            immediate: prefersReducedMotion.current,
          })
        }

        if (maybeCancel()) return

        onSpringEndRef.current?.({ type: 'OPEN' })

        if (!cancelled) {
          console.groupEnd()
        }
      },
    })

    return () => {
      startOnRef.current = false
      // Start signalling to the async flow that we have to abort
      cancelled = true
      // And proceed to optimistic cleanup
      cleanup()
    }
  }, [
    ariaHiderRef,
    focusTrapRef,
    off,
    prefersReducedMotion,
    ready,
    scrollLockRef,
    set,
  ])

  // Handle open to closed animations
  useEffect(() => {
    if (!ready || on) return

    let cancelled = false
    const maybeCancel = () => {
      if (cancelled) {
        onSpringCancelRef.current?.({ type: 'CLOSE' })

        console.groupEnd()
      }
      return cancelled
    }

    set({
      // @ts-expect-error
      to: async (next) => {
        springOnResize.current = false
        console.group('CLOSE')
        if (maybeCancel()) return

        canDragRef.current = false
        await onSpringStartRef.current?.({ type: 'CLOSE' })

        if (maybeCancel()) return

        // Edge case for already closed
        if (heightRef.current === 0) {
          onSpringEndRef.current?.({ type: 'CLOSE' })
          return
        }

        // Avoid animating the height property on close and stay within FLIP bounds by upping the minSnap
        next({
          minSnap: heightRef.current,
          immediate: true,
        })

        heightRef.current = 0

        await next({
          y: 0,
          maxHeight: maxHeightRef.current,
          maxSnap: maxSnapRef.current,
          immediate: prefersReducedMotion.current,
        })
        if (maybeCancel()) return

        await next({ ready: 0, immediate: true })

        if (maybeCancel()) return

        await onSpringEndRef.current?.({ type: 'CLOSE' })

        if (!cancelled) {
          springOnResize.current = true
          console.groupEnd()
        }
      },
    })

    return () => {
      // Set to false so the async flow can detect if it got cancelled
      cancelled = true
    }
  }, [on, prefersReducedMotion, ready, set])

  const handleDrag = ({
    args: [{ closeOnTap = false } = {}] = [],
    cancel,
    direction: [, direction],
    down,
    first,
    last,
    memo = spring.y.getValue() as number,
    movement: [, _my],
    tap,
    velocity,
  }) => {
    const my = _my * -1

    // Cancel the drag operation if the canDrag state changed
    if (!canDragRef.current) {
      console.log('handleDrag cancelled dragging because canDragRef is false')
      springOnResize.current = true
      cancel()
      return memo
    }

    if (onDismiss && closeOnTap && tap) {
      cancel()
      onDismiss()
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
        !onDismiss &&
        rawY < minSnapRef.current &&
        minSnapRef.current === maxSnapRef.current
        ? rubberbandIfOutOfBounds(
            rawY,
            minSnapRef.current,
            maxSnapRef.current * 2,
            0.55
          )
        : rubberbandIfOutOfBounds(rawY, 0, maxSnapRef.current, 0.55)
      : predictedY

    if (first) {
      springOnResize.current = false
    }

    if (last) {
      // Restrict y to a valid snap point
      newY = findSnapRef.current(newY)
      heightRef.current = newY
      lastSnapRef.current = newY
      springOnResize.current = true
    }

    set({
      y: newY,
      ready: 1,
      maxHeight: maxHeightRef.current,
      maxSnap: maxSnapRef.current,
      minSnap: minSnapRef.current,
      immediate: prefersReducedMotion.current || down,
      config: { velocity },
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
        // @TODO the line below only fails on TS <4
        // @ts-ignore
        opacity: spring.ready,
        // Allows interactions on the rest of the page before the close transition is finished
        pointerEvents: !ready || off ? 'none' : undefined,
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
            <div data-rsbs-header-padding>{header}</div>
          </div>
        )}
        <div key="content" data-rsbs-content ref={contentRef}>
          <div
            ref={contentContainerRef}
            // The overflow hidden is for the resize observer to get dimensions including margins and paddings
            style={{ overflow: 'hidden' }}
          >
            <div data-rsbs-content-padding>{children}</div>
          </div>
        </div>
        {footer && (
          <div key="footer" ref={footerRef} data-rsbs-footer {...bind()}>
            <div data-rsbs-footer-padding>{footer}</div>
          </div>
        )}
      </div>
      <div key="antigap" data-rsbs-antigap />
    </animated.div>
  )
})

// Default prop values that are callbacks, and it's nice to save some memory and reuse their instances since they're pure
function _defaultSnap({ snapPoints, lastSnap }: defaultSnapProps) {
  return lastSnap ?? Math.min(...snapPoints)
}
function _snapPoints({ minHeight }: SnapPointProps) {
  return minHeight
}

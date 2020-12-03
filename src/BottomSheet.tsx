//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import React, { useEffect, useImperativeHandle, useRef } from 'react'
import { animated } from 'react-spring'
import { useDrag } from 'react-use-gesture'
import {
  useAriaHider,
  useFocusTrap,
  useReady,
  useReducedMotion,
  useScrollLock,
  useSnapPoints,
  useSnapResponder,
  useSpring,
} from './hooks'
import type {
  defaultSnapProps,
  Props,
  RefHandles,
  SnapPointProps,
} from './types'
import { clamp } from './utils'

// @TODO retire this constant and implement true rubberbanding
// How many pixels above the viewport height the user is allowed to drag the bottom sheet
const MAX_OVERFLOW = 120

export const BottomSheet = React.forwardRef<
  RefHandles,
  {
    defaultOpen: boolean
    lastSnapRef: React.MutableRefObject<number | null>
  } & Props
>(function BottomSheetInternal(
  {
    children,
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

  const dismissable = !!onDismiss
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
  const backdropRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const draggingRef = useRef(false)
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
    getSnapPoints,
    heightRef,
    lastSnapRef,
    ready,
    contentContainerRef,
    controlledMaxHeight,
    registerReady,
    footerRef,
    headerRef,
  })

  const defaultSnapRef = useRef(0)
  useEffect(() => {
    // Wait with selectin default snap until element dimensions are measured
    if (!ready) return
    console.count('selecting default snap')

    defaultSnapRef.current = findSnap(getDefaultSnap)
  }, [findSnap, getDefaultSnap, ready])
  const { maxHeightRef, maxSnapRef, minSnapRef, updateSnap } = useSnapResponder(
    {
      draggingRef,
      maxHeight,
      minSnap,
      prefersReducedMotion,
      maxSnap,
      findSnap,
      heightRef,
      lastSnapRef,
      set,
    }
  )
  useImperativeHandle(
    forwardRef,
    () => ({
      snapTo: (numberOrCallback) => {
        if (off) return

        // @TODO refactor to setState and useEffect hooks to easier track cancel events
        set({
          y: findSnap(numberOrCallback),
          immediate: prefersReducedMotion.current,
        })
      },
    }),
    [findSnap, off, prefersReducedMotion, set]
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
        if (maybeCancel()) return

        await onSpringStartRef.current?.({ type: 'OPEN' })

        if (maybeCancel()) return

        if (startOnRef.current) {
          console.log('immediate open')

          heightRef.current = defaultSnapRef.current
          await next({
            y: defaultSnapRef.current,
            backdrop: 1,
            opacity: 1,
            immediate: true,
          })

          if (maybeCancel()) return

          await Promise.all([
            scrollLockRef.current.activate(),
            focusTrapRef.current.activate(),
            ariaHiderRef.current.activate(),
          ])

          if (maybeCancel()) return

          canDragRef.current = true
        } else {
          console.log('animate open')
          await next({
            y: defaultSnapRef.current,
            backdrop: 0,
            opacity: 0,
            immediate: true,
          })

          if (maybeCancel()) return

          await Promise.all([
            scrollLockRef.current.activate(),
            focusTrapRef.current.activate(),
            ariaHiderRef.current.activate(),
          ])

          if (maybeCancel()) return

          await next({
            y: 0,
            backdrop: 0,
            opacity: 1,
            immediate: true,
          })

          if (maybeCancel()) return

          canDragRef.current = true
          heightRef.current = defaultSnapRef.current
          await next({
            y: defaultSnapRef.current,
            backdrop: 1,
            opacity: 1,
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
        console.group('CLOSE')
        if (maybeCancel()) return

        canDragRef.current = false
        await onSpringStartRef.current?.({ type: 'CLOSE' })

        if (maybeCancel()) return

        heightRef.current = 0

        console.log('animate close')

        await next({
          y: 0,
          backdrop: 0,
          immediate: prefersReducedMotion.current,
        })
        if (maybeCancel()) return

        await next({ opacity: 0, immediate: true })

        if (maybeCancel()) return

        onSpringEndRef.current?.({ type: 'CLOSE' })

        if (!cancelled) {
          console.groupEnd()
        }
      },
    })

    return () => {
      // Set to false so the async flow can detect if it got cancelled
      cancelled = true
    }
  }, [on, prefersReducedMotion, ready, set])

  const getY = ({
    down,
    temp,
    movement,
    velocity,
  }: {
    down: boolean
    temp: number
    movement: number
    velocity: number
  }): number => {
    const rawY = temp - movement
    const predictedDistance = movement * velocity
    const predictedY = Math.max(
      minSnapRef.current,
      Math.min(maxSnapRef.current, rawY - predictedDistance * 2)
    )

    if (
      !down &&
      onDismiss &&
      rawY - predictedDistance < minSnapRef.current / 2
    ) {
      onDismiss()
      return rawY
    }

    if (down) {
      const scale = maxHeightRef.current * 0.38196601124999996

      // If dragging beyond maxSnap it should decay so the user can feel its out of bounds
      if (rawY > maxSnapRef.current) {
        const overflow =
          Math.min(rawY, maxSnapRef.current + scale / 2) - maxSnapRef.current
        const resistance = Math.min(0.5, overflow / scale) * overflow

        return maxSnapRef.current + overflow - resistance
      }

      // If onDismiss isn't defined, the user can't flick it out of view and the dragging should decay/slow down
      if (!onDismiss && rawY < minSnapRef.current) {
        const overflow =
          minSnapRef.current - Math.max(rawY, minSnapRef.current - scale / 2)
        const resistance = Math.min(0.5, overflow / scale) * overflow

        return minSnapRef.current - overflow + resistance
      }

      // apply coordinates as it's being dragged, unless it is out of bounds (in which case a decay should be applied)
      return rawY
    }

    return predictedY
  }

  const handleDrag = ({
    down,
    velocity,
    direction,
    memo = spring.y.getValue(),
    first,
    last,
    movement: [, my],
    cancel,
  }) => {
    let newY = getY({
      down: !!down,
      movement: isNaN(my) ? 0 : my,
      velocity,
      temp: memo as number,
    })

    const relativeVelocity = Math.max(1, velocity)
    console.log({ first, memo })
    if (first) {
      console.log('first ', { memo })
      draggingRef.current = true
    }

    // Cancel the drag operation if the canDrag state changed
    if (!canDragRef.current) {
      console.log('handleDrag cancelled dragging because canDragRef is false')
      draggingRef.current = false
      cancel()
      return
    }

    if (last) {
      draggingRef.current = false
      heightRef.current = newY
      console.log('last drag, calling setSnapTo with', { newY })
      // Restrict y to a valid snap point
      updateSnap()

      return memo
    }

    set({
      y: newY,
      backdrop: clamp(newY / minSnapRef.current, 0, 1),
      opacity: 1,
      immediate: prefersReducedMotion.current || down,
      config: {
        mass: relativeVelocity,
        tension: 300 * relativeVelocity,
        friction: 35 * relativeVelocity,
        velocity: direction[1] * velocity,
      },
    })

    return memo
  }

  useDrag(handleDrag, {
    domTarget: backdropRef,
    eventOptions: { capture: true },
    enabled: ready && on,
    axis: 'y',
  })
  useDrag(handleDrag, {
    domTarget: headerRef,
    eventOptions: { capture: true },
    enabled: ready && on,
    axis: 'y',
  })
  useDrag(handleDrag, {
    domTarget: footerRef,
    eventOptions: { capture: true },
    enabled: ready && on,
    axis: 'y',
  })

  // @TODO the ts-ignore comments are because the `extrapolate` param isn't in the TS defs for some reason
  const interpolateBorderRadius =
    maxHeightRef.current !== maxSnapRef.current
      ? undefined
      : // @ts-expect-error
        spring.y.interpolate({
          range: [maxHeightRef.current - 16, maxHeightRef.current],
          output: ['16px', '0px'],
          extrapolate: 'clamp',
          map: Math.round,
        })

  const interpolateHeight = spring.y.interpolate(
    (y: number) => `${clamp(y, minSnapRef.current, maxSnapRef.current)}px`
  )

  const interpolateY = spring.y.interpolate({
    range: [
      0,
      minSnapRef.current,
      maxSnapRef.current,
      maxSnapRef.current + MAX_OVERFLOW,
    ],
    output: [`${minSnapRef.current}px`, '0px', '0px', `${-MAX_OVERFLOW}px`],
  })
  const interpolateFiller = spring.y
    .interpolate({
      range: [0, maxSnapRef.current, maxSnapRef.current + MAX_OVERFLOW],
      output: [0, 0, MAX_OVERFLOW],
    })
    // Rounding up prevents subpixel gaps that can happen since we use fractions in translateY for a smooth animation
    .interpolate(Math.ceil)

  const interpolateContentOpacity = spring.y.interpolate({
    range: [
      0,
      Math.max(minSnapRef.current / 2 - 45, 0),
      Math.min(minSnapRef.current / 2 + 45, minSnapRef.current),
      minSnapRef.current,
    ],
    output: [0, 0, 1, 1],
  })

  return (
    <animated.div
      {...props}
      data-rsbs-root
      data-rsbs-is-blocking={blocking}
      data-rsbs-is-dismissable={dismissable}
      data-rsbs-has-header={!!header}
      data-rsbs-has-footer={!!footer}
      className={className}
      ref={containerRef}
      style={{
        // Fancy content fade-in effect
        ['--rsbs-content-opacity' as any]: interpolateContentOpacity,
        // Fading in the backdrop
        ['--rsbs-backdrop-opacity' as any]: spring.backdrop,
        // Scaling the antigap in the bottom
        ['--rsbs-antigap-scale-y' as any]: interpolateFiller,
        // Shifts the position of the bottom sheet, used on open and close primarily as snap point changes usually only interpolate the height
        ['--rsbs-overlay-translate-y' as any]: interpolateY,
        // Remove rounded borders when full height, it looks much better this way
        ['--rsbs-overlay-rounded' as any]: interpolateBorderRadius,
        // Animates the height state, not the most performant way but it's the safest with regards to mobile browser and focus/scrolling that could happen while animating
        ['--rsbs-overlay-h' as any]: interpolateHeight,
        ...style,
        // Not overridable as the "focus lock with opacity 0" trick rely on it
        opacity: spring.opacity,
        // Allows interactions on the rest of the page before the close transition is finished
        pointerEvents: !ready || off ? 'none' : undefined,
      }}
    >
      {blocking ? (
        <div
          // This component needs to be placed outside bottom-sheet, as bottom-sheet uses transform and thus creates a new context
          // that clips this element to the container, not allowing it to cover the full page.
          key="backdrop"
          data-rsbs-backdrop
          ref={backdropRef}
          onClickCapture={(event) => {
            if (onDismiss) {
              event.preventDefault()
              onDismiss()
            }
          }}
        />
      ) : (
        // backdropRef always needs to be set because of useDrag
        <div key="backdrop" ref={backdropRef} />
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
        {header !== false ? (
          <div key="header" data-rsbs-header ref={headerRef}>
            <div data-rsbs-header-padding>{header}</div>
          </div>
        ) : (
          // headerRef always needs to be set because of useDrag
          <div key="header" ref={headerRef} />
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
        {footer ? (
          <div key="footer" ref={footerRef} data-rsbs-footer>
            <div data-rsbs-footer-padding>{footer}</div>
          </div>
        ) : (
          // footerRef always needs to be set because of useDrag
          <div key="footer" ref={footerRef} />
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

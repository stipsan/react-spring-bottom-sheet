//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { animated, interpolate, useSpring } from 'react-spring'
import { useDrag } from 'react-use-gesture'
import {
  useAriaHider,
  useDimensions,
  useFocusTrap,
  useReducedMotion,
  useScrollLock,
  useSnapPoints,
  useViewportHeight,
} from './hooks'
import type {
  defaultSnapProps,
  Props,
  RefHandles,
  SnapPointProps,
} from './types'
import { clamp } from './utils'

// How many pixels above the viewport height the user is allowed to drag the bottom sheet
const MAX_OVERFLOW = 120
// Toggle new experimental algo for animating snap states that avoid animating the `height` property, staying in FLIP bounds
const EXPERIMENTAL_FAST_TRANSITION = false

export const BottomSheet = React.forwardRef<
  RefHandles,
  { openRef: React.RefObject<boolean> } & Props
>(function BottomSheetInternal(
  {
    children,
    className,
    footer,
    header,
    open: _open,
    openRef,
    initialFocusRef,
    onDismiss,
    maxHeight: controlledMaxHeight,
    defaultSnap: getDefaultSnap = _defaultSnap,
    snapPoints: getSnapPoints = _snapPoints,
    blocking = true,
    scrollLocking = true,
    style,
    onSpringStart = (event) => console.warn('onSpringStart', event),
    onSpringCancel = (event) => console.error('onSpringCancel', event),
    onSpringEnd = (event) => console.warn('onSpringEnd', event),
    ...props
  },
  forwardRef
) {
  // Just to aid my ADHD brain here and keep track, short names are sweet for public APIs
  // but confusing as heck when transitioning between touch gestures and spring animations
  const on = _open
  const off = !_open
  // Keep track of their initial states, to detect if the bottom sheet should animate or use immediate
  const startOnRef = useRef(openRef.current)
  const startOffRef = useRef(!openRef.current)
  // Before any animations can start we need to measure a few things, like the viewport and the dimensions of content, and header + footer if they exist
  const [ready, setReady] = useState(false)

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
  const [spring, set] = useSpring(() => ({
    from: { y: 0, opacity: 0, backdrop: 0 },
    onStart: (...args) => console.debug('onStart', ...args),
    onFrame: (...args) => console.debug('onFrame', ...args),
    onRest: (...args) => console.debug('onRest', ...args),
  }))
  // @ts-expect-error
  const { y } = spring

  // Dev convenience, consider exposing on docs page
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    // @ts-ignore
    window.set = set
  }

  // Rules:
  // useDrag and interpolate functions capture values in the scope and is refreshed when rerender
  // @TODO check if same is true for spring events as onRest and those events

  const shouldCloseRef = useRef(off)
  shouldCloseRef.current = off
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
  // The last point that the user snapped to, useful for open/closed toggling and the user defined height is remembered
  const lastSnapRef = useRef(null)

  const prefersReducedMotion = useReducedMotion()
  const maxHeight = useViewportHeight(controlledMaxHeight)

  // "Plugins" huhuhu
  const scrollLockRef = useScrollLock({
    targetRef: contentRef,
    enabled: ready && scrollLocking,
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

  const {
    contentHeight,
    minHeight,
    headerHeight,
    footerHeight,
  } = useDimensions({
    maxHeight,
    headerRef,
    contentRef: contentContainerRef,
    footerRef,
  })

  const { snapPoints, minSnap, maxSnap, toSnapPoint } = useSnapPoints({
    getSnapPoints,
    contentHeight,
    footerHeight,
    headerHeight,
    height: heightRef.current,
    minHeight,
    maxHeight,
  })

  const defaultSnapRef = useRef(0)
  useEffect(() => {
    // If we're firing before the dom is mounted then contentHeight will be 0 and we should return default values
    if (contentHeight === 0) {
      defaultSnapRef.current = 0
      return
    }

    const nextHeight = getDefaultSnap({
      height: heightRef.current,
      headerHeight,
      footerHeight,
      minHeight,
      maxHeight,
      lastSnap: lastSnapRef.current,
      snapPoints,
    })
    defaultSnapRef.current = toSnapPoint(nextHeight)
  }, [
    contentHeight,
    footerHeight,
    getDefaultSnap,
    headerHeight,
    maxHeight,
    minHeight,
    snapPoints,
    toSnapPoint,
  ])

  // Monitor if we got all dimensions ready and good to go
  useEffect(() => {
    if (!ready && maxHeight && contentHeight) {
      setReady(true)
    }
  }, [contentHeight, maxHeight, ready])

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
          console.log('open by default, no animation')

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
          console.log('starting animation')
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

        await onSpringEndRef.current?.({ type: 'OPEN' })

        console.log('async open transition done', { cancelled })
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

    if (startOffRef.current) {
      startOffRef.current = false
      return
    }

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
        if (startOffRef.current) {
          console.log('closed by default, no animation')

          await next({ y: 0, backdrop: 0, opacity: 0, immediate: true })
        } else {
          console.log('starting animation')

          await next({
            y: 0,
            backdrop: 0,
            immediate: prefersReducedMotion.current,
          })
        }
        if (maybeCancel()) return

        await onSpringEndRef.current?.({ type: 'CLOSE' })

        console.log('async close transition done', { cancelled })
        if (!cancelled) {
          console.groupEnd()
        }
      },
    })

    return () => {
      startOffRef.current = false
      // Start signalling to the async flow that we have to abort
      cancelled = true
    }
  }, [on, prefersReducedMotion, ready, set])

  useImperativeHandle(
    forwardRef,
    () => ({
      snapTo: (maybeHeightUpdater) => {
        if (shouldCloseRef.current || off) return
        let nextHeight: number
        if (typeof maybeHeightUpdater === 'function') {
          nextHeight = maybeHeightUpdater({
            footerHeight,
            headerHeight,
            height: heightRef.current,
            minHeight,
            maxHeight,
            snapPoints,
            lastSnap: lastSnapRef.current,
          })
        } else {
          nextHeight = maybeHeightUpdater
        }

        nextHeight = toSnapPoint(nextHeight)

        // @TODO refactor to setState and useEffect hooks to easier track cancel events
        set({
          // @ts-expect-error
          y: nextHeight,
          immediate: prefersReducedMotion.current,
        })
      },
    }),
    [
      footerHeight,
      headerHeight,
      maxHeight,
      minHeight,
      off,
      prefersReducedMotion,
      set,
      snapPoints,
      toSnapPoint,
    ]
  )

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
      minSnap,
      Math.min(maxSnap, rawY - predictedDistance * 2)
    )

    if (!down && onDismiss && rawY - predictedDistance < minSnap / 2) {
      onDismiss()
      return rawY
    }

    if (down) {
      const scale = maxHeight * 0.38196601124999996

      // If dragging beyond maxSnap it should decay so the user can feel its out of bounds
      if (rawY > maxSnap) {
        const overflow = Math.min(rawY, maxSnap + scale / 2) - maxSnap
        const resistance = Math.min(0.5, overflow / scale) * overflow

        return maxSnap + overflow - resistance
      }

      // If onDismiss isn't defined, the user can't flick it out of view and the dragging should decay/slow down
      if (!onDismiss && rawY < minSnap) {
        const overflow = minSnap - Math.max(rawY, minSnap - scale / 2)
        const resistance = Math.min(0.5, overflow / scale) * overflow

        return minSnap - overflow + resistance
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
    memo = y.getValue(),
    first,
    last,
    movement: [, my],
    cancel,
  }) => {
    console.log('handleDrag')
    // Cancel the drag operation if the canDrag state changed
    if (!canDragRef.current) {
      console.log('handleDrag cancelled dragging because canDragRef is false')
      draggingRef.current = false
      cancel()
      return
    }

    let newY = getY({
      down: !!down,
      movement: isNaN(my) ? 0 : my,
      velocity,
      temp: memo,
    })

    const relativeVelocity = Math.max(1, velocity)

    // Constrict y to a valid snap point
    if (last) {
      newY = toSnapPoint(newY)
      heightRef.current = newY
      lastSnapRef.current = newY
    }

    set({
      // @ts-expect-error
      y: newY,
      backdrop: clamp(newY / minSnap, 0, 1),
      opacity: 1,
      immediate: prefersReducedMotion.current || down,
      config: {
        mass: relativeVelocity,
        tension: 300 * relativeVelocity,
        friction: 35 * relativeVelocity,
        velocity: direction[1] * velocity,
      },
    })

    if (first) {
      draggingRef.current = true
    }
    if (last) {
      draggingRef.current = false
    }

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
    maxHeight !== maxSnap
      ? undefined
      : y?.interpolate({
          range: [maxHeight - 16, maxHeight],
          output: ['16px', '0px'],
          extrapolate: 'clamp',
          map: Math.round,
        })
  const interpolateHeightLegacy = y?.interpolate({
    range: [minSnap, maxSnap],
    output: [minSnap, maxSnap],
    extrapolate: 'clamp',
  })
  const interpolateHeight =
    EXPERIMENTAL_FAST_TRANSITION && interpolateHeightLegacy
      ? interpolate(
          [
            y.interpolate({
              // @TODO optimize
              range: [heightRef.current, heightRef.current],
              output: [heightRef.current, heightRef.current],
              extrapolate: 'clamp',
            }),
            interpolateHeightLegacy,
          ],
          (a, b) => (draggingRef.current ? b : a)
        )
      : interpolateHeightLegacy
  const interpolateYLegacy = y?.interpolate({
    range: [0, minSnap, maxSnap, maxSnap + MAX_OVERFLOW],
    output: [`${minSnap}px`, '0px', '0px', `${-MAX_OVERFLOW}px`],
  })
  const interpolateY =
    EXPERIMENTAL_FAST_TRANSITION && interpolateYLegacy
      ? interpolate(
          [
            y.interpolate({
              range: [
                0,
                minSnap,
                heightRef.current,
                heightRef.current + MAX_OVERFLOW,
              ],
              output: [`${minSnap}px`, '0px', '0px', `${-MAX_OVERFLOW}px`],
            }),
            interpolateYLegacy,
          ],
          (a, b) => (draggingRef.current ? b : a)
        )
      : interpolateYLegacy
  const interpolateFiller = y?.interpolate({
    range: [0, maxSnap, maxSnap + MAX_OVERFLOW],
    output: ['scaleY(0)', 'scaleY(0)', `scaleY(${MAX_OVERFLOW})`],
    map: Math.ceil,
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
        ...style,
        // @ts-expect-error
        opacity: spring.opacity,
        // Allows interactions on the rest of the page before the close transition is finished
        pointerEvents: !ready || off ? 'none' : undefined,
        // Fancy content fade-in effect
        // @ts-ignore
        ['--rsbs-content-opacity' as any]: y?.interpolate({
          range: [
            0,
            Math.max(minSnap / 2 - 45, 0),
            Math.min(minSnap / 2 + 45, minSnap),
            minSnap,
          ],
          output: [0, 0, 1, 1],
          extrapolate: 'clamp',
        }),
        // Fading in the backdrop, done here so the effect can be controlled through CSS
        // @ts-expect-error
        ['--rsbs-backdrop-opacity' as any]: spring.backdrop,
      }}
    >
      {blocking ? (
        <animated.div
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
        <div ref={backdropRef} />
      )}
      <animated.div
        key="overlay"
        aria-modal="true"
        data-rsbs-overlay
        tabIndex={-1}
        ref={overlayRef}
        style={{
          height: interpolateHeight,
          ['--rsbs-y' as any]: interpolateY,
          ['--rsbs-rounded' as any]: interpolateBorderRadius,
        }}
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
          <div ref={headerRef} />
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
          <div ref={footerRef} />
        )}
      </animated.div>
      <animated.div
        key="antigap"
        data-rsbs-antigap
        style={{ transform: interpolateFiller }}
      />
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

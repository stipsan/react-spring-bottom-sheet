//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import { createFocusTrap } from 'focus-trap'
import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { animated, interpolate, useSpring } from 'react-spring'
import { useDrag } from 'react-use-gesture'
import {
  useDimensions,
  useReducedMotion,
  useSnapPoints,
  useViewportHeight,
} from './hooks'
import type {
  initialSnapPointArg,
  setSnapPoint,
  SharedProps,
  SnapPointArg,
} from './types'
import { clamp, createAriaHider, createScrollLocker, isNumber } from './utils'

type BottomSheetProps = {
  /** Handler that is called after the close transition has ended. Use this to know when it's safe to unmount hte bottom sheet. */
  onCloseTransitionEnd?: () => void
} & SharedProps

// How many pixels above the viewport height the user is allowed to drag the bottom sheet
const MAX_OVERFLOW = 120
// Toggle new experimental algo for animating snap states that avoid animating the `height` property, staying in FLIP bounds
const EXPERIMENTAL_FAST_TRANSITION = false

export const BottomSheet = React.forwardRef(
  (
    {
      children,
      className,
      footer,
      header,
      open: _open,
      initialFocusRef,
      onDismiss,
      initialSnapPoint: _getInitialSnapPoint = defaultSnap,
      snapPoints: getSnapPoints = defaultSnapShots,
      blocking = true,
      scrollLocking = true,
      style,
      ...props
    }: BottomSheetProps,
    forwardRef: React.Ref<HTMLDivElement>
  ) => {
    // Just to aid my ADHD brain here and keep track, short names are sweet for public APIs
    // but confusing as heck when transitioning between touch gestures and spring animations
    const on = _open
    const off = !_open
    const dismissable = !!onDismiss

    // Behold, the engine of it all!
    const [spring, set] = useSpring(() => ({
      from: { y: 0, opacity: 0, backdrop: 0 },
    }))
    // @ts-expect-error
    const { y } = spring

    // Dev convenience, consider exposing on docs page
    if (
      process.env.NODE_ENV !== 'production' &&
      typeof window !== 'undefined'
    ) {
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
    const viewportHeight = useViewportHeight()

    // "Plugins" huhuhu
    const scrollLockRef = useRef<ReturnType<typeof createScrollLocker>>()
    const focusTrapRef = useRef<
      {
        activate: () => Promise<any>
      } & Pick<ReturnType<typeof createFocusTrap>, 'deactivate'>
    >()
    const ariaHiderRef = useRef<ReturnType<typeof createAriaHider>>()

    useEffect(() => {
      const content = contentRef.current
      if (scrollLocking && content) {
        scrollLockRef.current = createScrollLocker(content)
      }
    }, [on, scrollLocking])

    const {
      contentHeight,
      minHeight,
      headerHeight,
      footerHeight,
    } = useDimensions({
      viewportHeight,
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
      minHeight: minHeight,
      viewportHeight,
    })

    const initialHeight = useMemo(() => {
      // If we're firing before the dom is mounted then contentHeight will be 0 and we should return default values
      if (contentHeight === 0) {
        return 0
      }

      const nextHeight = _getInitialSnapPoint({
        height: heightRef.current,
        headerHeight,
        footerHeight,
        minHeight: minHeight,
        viewportHeight,
        lastSnap: lastSnapRef.current,
        snapPoints,
      })
      return toSnapPoint(nextHeight)
    }, [
      _getInitialSnapPoint,
      contentHeight,
      footerHeight,
      headerHeight,
      minHeight,
      snapPoints,
      toSnapPoint,
      viewportHeight,
    ])

    // @TODO move these to custom hooks
    useEffect(() => {
      const container = containerRef.current
      const overlay = overlayRef.current
      console.log({
        requestedOpen: on,
        blocking,
        container,
        overlay,
        initialFocusRef,
      })
      if (on && blocking && container && overlay) {
        const trap = createFocusTrap(container, {
          onActivate:
            process.env.NODE_ENV !== 'production'
              ? () => {
                  console.log('focus activate')
                }
              : undefined,
          // If initialFocusRef is manually specified we don't want the first tabbable element to receive focus if initialFocusRef can't be found
          initialFocus: initialFocusRef
            ? () => initialFocusRef?.current || overlay
            : undefined,
          fallbackFocus: overlay,
          escapeDeactivates: false,
          clickOutsideDeactivates: false,
        })
        focusTrapRef.current = {
          activate: async () => {
            await trap.activate()
            return new Promise((resolve) =>
              requestAnimationFrame(() => resolve(void 1))
            )
          },
          deactivate: () => trap.deactivate(),
        }
        ariaHiderRef.current = createAriaHider(container)

        return () => {
          focusTrapRef.current.deactivate()
          focusTrapRef.current = null
        }
      }
    }, [on, blocking, initialFocusRef])

    // Handle closed to open transition
    useEffect(() => {
      if (!on) return

      set({
        // @ts-expect-error
        to: async (next, cancel) => {
          await next({
            y: initialHeight,
            backdrop: 0,
            opacity: 0,
            immediate: true,
          })
          await Promise.all([
            scrollLockRef.current?.activate(),
            focusTrapRef.current?.activate(),
            ariaHiderRef.current?.activate(),
          ])
          await next({
            y: 0,
            backdrop: 0,
            opacity: 1,
            immediate: true,
          })
          heightRef.current = initialHeight
          await next({
            y: initialHeight,
            backdrop: 1,
            opacity: 1,
            immediate: prefersReducedMotion.current,
          })
        },
      })
    }, [initialHeight, prefersReducedMotion, on, set])

    // Handle open to closed animations
    useEffect(() => {
      if (on) return

      heightRef.current = 0
      set({
        // @ts-expect-error
        y: 0,
        backdrop: 0,
        immediate: prefersReducedMotion.current,
      })
    }, [prefersReducedMotion, on, set])

    useImperativeHandle<{}, { setSnapPoint: setSnapPoint }>(forwardRef, () => ({
      setSnapPoint: (maybeHeightUpdater) => {
        if (shouldCloseRef.current || off) return
        let nextHeight: number
        if (typeof maybeHeightUpdater === 'function') {
          nextHeight = maybeHeightUpdater({
            footerHeight,
            headerHeight,
            height: heightRef.current,
            minHeight: minHeight,
            viewportHeight,
            snapPoints,
            lastSnap: lastSnapRef.current,
          })
        } else {
          nextHeight = maybeHeightUpdater
        }

        if (process.env.NODE_ENV !== 'production' && !isNumber(nextHeight)) {
          console.error(
            'setSnapPoint expects valid numbers, instead it got: ',
            nextHeight
          )
          return
        }

        nextHeight = toSnapPoint(nextHeight)

        set({
          // @ts-expect-error
          y: nextHeight,
          immediate: prefersReducedMotion.current,
        })
      },
    }))

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
        const scale = viewportHeight * 0.38196601124999996

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
    }) => {
      // Prevent a drag from accidentally stop a close transition due to calling set()
      if (shouldCloseRef.current) {
        draggingRef.current = false
        return memo
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
      enabled: on,
      axis: 'y',
    })
    useDrag(handleDrag, {
      domTarget: headerRef,
      eventOptions: { capture: true },
      enabled: on,
      axis: 'y',
    })
    useDrag(handleDrag, {
      domTarget: footerRef,
      eventOptions: { capture: true },
      enabled: on,
      axis: 'y',
    })

    // @TODO the ts-ignore comments are because the `extrapolate` param isn't in the TS defs for some reason
    const interpolateBorderRadius =
      viewportHeight !== maxSnap
        ? undefined
        : y?.interpolate({
            range: [viewportHeight - 16, viewportHeight],
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
          pointerEvents: off ? 'none' : undefined,
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
          // Support both our own ref and any forwarded ref
          ref={(node) => {
            overlayRef.current = node
            if (forwardRef) {
              if (typeof forwardRef === 'function') {
                forwardRef(node)
              } else {
                // @ts-expect-error FIXME: Remove when this gets fixed https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065
                forwardRef.current = node
              }
            }
          }}
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
  }
)

function defaultSnap({ snapPoints, lastSnap }: initialSnapPointArg) {
  return lastSnap ?? Math.min(...snapPoints)
}
function defaultSnapShots({ minHeight }: SnapPointArg) {
  return minHeight
}

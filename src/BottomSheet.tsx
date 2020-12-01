//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import { createFocusTrap } from 'focus-trap'
import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { animated, useSpring } from 'react-spring'
import { useDrag } from 'react-use-gesture'
import {
  useDimensions,
  useReducedMotion,
  useSnapPoints,
  useViewportHeight,
} from './hooks'
import type { setSnapPoint, SharedProps } from './types'
import { clamp, createAriaHider, createScrollLocker, isNumber } from './utils'

type BottomSheetProps = {
  /** Handler that is called after the close transition has ended. Use this to know when it's safe to unmount hte bottom sheet. */
  onCloseTransitionEnd?: () => void
} & SharedProps

// How many pixels above the viewport height the user is allowed to drag the bottom sheet
const MAX_OVERFLOW = 120

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
      initialSnapPoint: _getInitialSnapPoint = ({ snapPoints }) =>
        Math.min(...snapPoints),
      snapPoints: getSnapPoints = ({ maxHeight }) => [maxHeight],
      blocking = true,
      scrollLocking = true,
      style,
      tabIndex,
      ...props
    }: BottomSheetProps,
    forwardRef: React.Ref<HTMLDivElement>
  ) => {
    // Just to aid my ADHD brain here and keep track, short names are sweet for public APIs
    // but confusing as heck when transitioning between touch gestures and spring animations
    const requestedOpen = _open
    const requestedClose = !_open

    // Rules:
    // useDrag and interpolate functions capture values in the scope and is refreshed when rerender
    // @TODO check if same is true for spring events as onRest and those events

    const shouldCloseRef = useRef(requestedClose)
    shouldCloseRef.current = requestedClose
    const containerRef = useRef<HTMLDivElement>(null)
    const backdropRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const contentContainerRef = useRef<HTMLDivElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const footerRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement | null>(null)
    const heightRef = useRef(0)

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

    console.log('render', tabIndex, scrollLockRef.current?.activate)

    useEffect(() => {
      const content = contentRef.current
      if (scrollLocking && content) {
        scrollLockRef.current = createScrollLocker(content)
      }
    }, [requestedOpen, scrollLocking])

    // Drag interaction states
    const [spring, set] = useSpring(() => ({
      from: { y: 0, opacity: 0, backdrop: 0, contentOpacity: 0 },
    }))
    // @ts-expect-error
    const { y } = spring

    const {
      contentHeight,
      maxHeight,
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
      currentHeight: heightRef.current,
      maxHeight,
      viewportHeight,
    })

    const initialHeight = useMemo(() => {
      // If we're firing before the dom is mounted then contentHeight will be 0 and we should return default values
      if (contentHeight === 0) {
        return 0
      }

      const nextHeight = _getInitialSnapPoint({
        currentHeight: heightRef.current,
        headerHeight,
        footerHeight,
        maxHeight,
        viewportHeight,
        snapPoints,
      })
      return toSnapPoint(nextHeight)
    }, [
      _getInitialSnapPoint,
      contentHeight,
      footerHeight,
      headerHeight,
      maxHeight,
      snapPoints,
      toSnapPoint,
      viewportHeight,
    ])

    // @TODO move these to custom hooks
    useEffect(() => {
      const container = containerRef.current
      const overlay = overlayRef.current

      if (requestedOpen && blocking && container && overlay) {
        const trap = createFocusTrap(container, {
          onActivate: () => {
            console.log('focus activate')
          },
          // If initialFocusRef is manually specified we don't want the first tabbable element to receive focus if initialFocusRef can't be found
          initialFocus: initialFocusRef ? overlay : undefined,
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
    }, [requestedOpen, blocking, initialFocusRef])

    useEffect(() => {
      if (!requestedOpen) return

      set({
        // @ts-expect-error
        to: async (next, cancel) => {
          console.log('animate', tabIndex)
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
          console.log('again')
          await next({
            y: 0,
            backdrop: 0,
            opacity: 1,
            immediate: true,
          })
          heightRef.current = initialHeight
          console.log('ready to transition')
          await next({
            y: initialHeight,
            backdrop: 1,
            opacity: 1,
            contentOpacity: 1,
            immediate: prefersReducedMotion.current,
          })
        },
      })
      return () => {
        console.log('cancel opening!!')
      }
    }, [initialHeight, prefersReducedMotion, requestedOpen, set, tabIndex])

    useEffect(() => {
      if (requestedOpen) return

      heightRef.current = 0
      set({
        // @ts-expect-error
        y: 0,
        backdrop: 0,
        contentOpacity: 0,
        immediate: prefersReducedMotion.current,
      })
    }, [prefersReducedMotion, requestedOpen, set])

    useImperativeHandle<{}, { setSnapPoint: setSnapPoint }>(forwardRef, () => ({
      setSnapPoint: (maybeHeightUpdater) => {
        if (shouldCloseRef.current || requestedClose) return
        let nextHeight: number
        if (typeof maybeHeightUpdater === 'function') {
          nextHeight = maybeHeightUpdater({
            footerHeight,
            headerHeight,
            currentHeight: heightRef.current,
            maxHeight,
            viewportHeight,
            snapPoints,
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

        heightRef.current = nextHeight
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
      if (shouldCloseRef.current) return memo

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
        console.log('dragging')
      }
      console.log('dragging', tabIndex)

      return memo
    }
    ///*
    useDrag(handleDrag, {
      domTarget: backdropRef,
      eventOptions: { capture: true },
      enabled: requestedOpen,
      axis: 'y',
    })
    useDrag(handleDrag, {
      domTarget: headerRef,
      eventOptions: { capture: true },
      enabled: requestedOpen,
      axis: 'y',
    })
    useDrag(handleDrag, {
      domTarget: footerRef,
      eventOptions: { capture: true },
      enabled: requestedOpen,
      axis: 'y',
    })
    //*/

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
    const interpolateHeight = y?.interpolate({
      range: [minSnap, maxSnap],
      output: [minSnap, maxSnap],
      extrapolate: 'clamp',
    })
    const interpolateY = y?.interpolate({
      range: [0, minSnap, maxSnap, maxSnap + MAX_OVERFLOW],
      output: [`${minSnap}px`, '0px', '0px', `${-MAX_OVERFLOW}px`],
    })
    const interpolateFiller = y?.interpolate({
      range: [0, maxSnap, maxSnap + MAX_OVERFLOW],
      output: ['scaleY(0)', 'scaleY(0)', `scaleY(${MAX_OVERFLOW})`],
      map: Math.ceil,
    })
    if (
      process.env.NODE_ENV !== 'production' &&
      typeof window !== 'undefined'
    ) {
      // @ts-ignore
      window.set = set
    }
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
          ...style,
          // @ts-expect-error
          opacity: spring.opacity,
          // Allows interactions on the rest of the page before the close transition is finished
          pointerEvents: requestedClose ? 'none' : undefined,
          // Fancy content fade-in effect
          ['--rsbs-content-opacity' as any]: spring.contentOpacity?.interpolate(
            {
              range: [0, 0.8, 1],
              output: [0, 0, 1],
            }
          ),
        }}
      >
        {blocking ? (
          <animated.div
            key="backdrop"
            ref={backdropRef}
            data-rsbs-backdrop
            // This component needs to be placed outside bottom-sheet, as bottom-sheet uses transform and thus creates a new context
            // that clips this element to the container, not allowing it to cover the full page.
            style={{
              // @ts-expect-error
              opacity: spring.backdrop,
            }}
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

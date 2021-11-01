//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import Portal from '@reach/portal'
import React, { useCallback, useEffect, useRef } from 'react'
import { animated, useSpring, config, to } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { FocusScope } from '@react-aria/focus'
import { useMaxHeight } from './hooks/useMaxHeight'
import { useLayoutEffect } from './hooks/useLayoutEffect'
import {
  useContentHeight,
  useFooterHeight,
  useHeaderHeight,
} from './hooks/useResizeObserver'
import useMachine from './hooks/useMachine'
import type { Props, RefHandles, SpringConfigMode, SpringState } from './types'
import {
  debugging,
  clamp,
  defaultInitialHeight,
  defaultSnapPoints,
} from './utils'

// @TODO implement AbortController to deal with race conditions

// @TODO rename to SpringBottomSheet and allow userland to import it directly, for those who want maximum control and minimal bundlesize
export const BottomSheet = React.forwardRef<
  RefHandles,
  {
    initialState: 'OPEN' | 'CLOSED'
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
    initialFocusRef,
    onDismiss,
    maxHeight: maxHeightProp,
    defaultSnap: getDefaultSnap = defaultInitialHeight,
    snapPoints: getSnapPoints = defaultSnapPoints,
    blocking = true,
    scrollLocking = true,
    style,
    onSpringStart,
    onSpringCancel,
    onSpringEnd,
    onClosed,
    reserveScrollBarGap = blocking,
    expandOnContentDrag = false,
    UNSTABLE_springConfig,
    ...props
  },
  forwardRef
) {
  // This way apps don't have to remember to wrap their callbacks in useCallback to avoid breaking the sheet
  const onSpringStartRef = useRef(onSpringStart)
  const onSpringCancelRef = useRef(onSpringCancel)
  const onSpringEndRef = useRef(onSpringEnd)
  useEffect(() => {
    onSpringStartRef.current = onSpringStart
    onSpringCancelRef.current = onSpringCancel
    onSpringEndRef.current = onSpringEnd
  }, [onSpringCancel, onSpringStart, onSpringEnd])

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  /* NEW STUFF START */
  const snapPointsRef = useRef(getSnapPoints)
  useEffect(() => {
    snapPointsRef.current = getSnapPoints
  }, [getSnapPoints])
  const initialHeightRef = useRef(getDefaultSnap)
  useEffect(() => {
    initialHeightRef.current = getDefaultSnap
  }, [getDefaultSnap])

  const [
    {
      backdropOpacity,
      contentOpacity,
      height,
      maxHeight,
      maxSnap,
      minSnap,
      mode,
      y,
    },
    springRef,
  ] = useSpring<SpringState>(() => {
    console.count('DEBUG window.useSpring')
    return {
      mode: 'closed',
      height: 0,
      y: 0,
      maxHeight: 0,
      maxSnap: 0,
      minSnap: 0,
      backdropOpacity: 0,
      contentOpacity: 0,
      // ref: springRef,
    }
  })
  const springConfig = useCallback(
    ({ mode, velocity }: { mode: SpringConfigMode; velocity?: number }) => {
      // Set the default preset first
      switch (mode) {
        case 'opening':
          springRef.start({
            config: config.stiff,
          })
          break
        case 'resizing':
          springRef.start({
            config: config.slow,
          })
          break
        case 'snapping':
          springRef.start({
            config: config.gentle,
          })
          break
        default:
          springRef.start({ config: config.default })
          break
      }
      // Granular configs per key done in second pass
      springRef.start({
        config: (key) => {
          switch (key) {
            case 'backdropOpacity':
            case 'contentOpacity':
              return {
                clamp:
                  mode === 'autofocusing' ||
                  mode === 'opening' ||
                  mode === 'closing',
              }
            case 'y':
              return { clamp: mode === 'closing' }
            default:
              return {}
          }
        },
      })

      if (UNSTABLE_springConfig) {
        springRef.start({ config: UNSTABLE_springConfig({ mode, velocity }) })
      }
    },
    [UNSTABLE_springConfig, springRef]
  )
  const springConfigRef = useRef(springConfig)
  useEffect(() => {
    springConfigRef.current = springConfig
  }, [springConfig])
  const [debugDragSpring, debugDragApi] = useSpring(() => ({
    mode: mode.get(),
    closeOnTap: false,
    isContentDragging: false,
    first: false,
    last: false,
    canceled: false,
    velocity: 0,
    direction: 0,
    movement: 0,
    tap: false,
    down: false,
    swipe: 0,
    offset: 0,
  }))
  const dragSpringDebug = to(
    [
      debugDragSpring.mode,
      debugDragSpring.closeOnTap,
      debugDragSpring.isContentDragging,
      debugDragSpring.first,
      debugDragSpring.last,
      debugDragSpring.canceled,
      debugDragSpring.velocity,
      debugDragSpring.direction,
      debugDragSpring.movement,
      debugDragSpring.tap,
      debugDragSpring.down,
      debugDragSpring.swipe,
      debugDragSpring.offset,
    ],
    (
      mode,
      closeOnTap,
      isContentDragging,
      first,
      last,
      canceled,
      velocity,
      direction,
      movement,
      tap,
      down,
      swipe,
      offset
    ) => {
      console.debug('DEBUG spring interpolate', mode, {
        closeOnTap,
        isContentDragging,
        mode,
        first,
        last,
        canceled,
        velocity,
        direction,
        movement,
        tap,
        down,
        swipe,
        offset,
      })

      return `
      closeOnTap: ${closeOnTap},
      isContentDragging: ${isContentDragging},
      first: ${first},
      last: ${last},
      canceled: ${canceled},
      velocity: ${velocity},
      direction: ${direction},
      movement: ${movement},
      tap: ${tap},
      down: ${down},
      swipe: ${swipe},
      offset: ${offset}
      `
    }
  )
  const springClampedHeight = to(
    [height, minSnap, maxSnap],
    (height, minSnap, maxSnap) => {
      console.debug('interpolateHeight', clamp(height, minSnap, maxSnap), {
        height,
        minSnap,
        maxSnap,
      })
      return clamp(height, minSnap, maxSnap)
    }
  )
  const springHeight = springClampedHeight.to((height) => `${height}px`)
  const springY = to([y, springClampedHeight], (y, height) => {
    console.debug('interpolateY', `${height - y}px`, { y, height })
    return `${height - y}px`
  })
  /*
  const springYToMinSnap = to(
    [spring.y, spring.minSnap],
    (y, minSnap) => y / minSnap
  ).to({ range: [0.5, 1], output: [0, 1], extrapolate: 'clamp' })
  // */
  const springContentOpacity = contentOpacity
  /*
  const springContentOpacity = spring.contentOpacity.to({
    range: [0.5, 0.9],
    output: [0, 1],
    extrapolate: 'clamp',
  })
  //*/
  const springBackdropOpacity = backdropOpacity
  const springFiller = to([y, springClampedHeight], (y, height) => {
    if (y >= height) {
      return Math.ceil(y - height)
    }
    return 0
  })
  const springBorderRadius = to([y, maxHeight], (y, maxHeight) => {
    return `${Math.round(clamp(maxHeight - y, 0, 16))}px`
  })
  const springDebug = to(
    [
      mode,
      height,
      y,
      maxHeight,
      maxSnap,
      minSnap,
      springBackdropOpacity,
      springContentOpacity,
      springBorderRadius,
      springFiller,
    ],
    (
      mode,
      height,
      y,
      maxHeight,
      maxSnap,
      minSnap,
      backdropOpacity,
      contentOpacity,
      borderRadius,
      springFiller
    ) => {
      console.assert(backdropOpacity >= 0 && backdropOpacity <= 1, {
        reason: 'backdropOpacity is incorrect',
        backdropOpacity,
      })
      console.assert(contentOpacity >= 0 && contentOpacity <= 1, {
        reason: 'contentOpacity is incorrect',
        contentOpacity,
      })

      console.debug('DEBUG interpolate', mode, {
        height,
        y,
        maxHeight,
        maxSnap,
        minSnap,
        backdropOpacity,
        contentOpacity,
        borderRadius,
        springFiller,
      })

      return `
      mode: ${mode},
      height: ${height}, 
      y: ${y}, 
      maxHeight: ${maxHeight}, 
      maxSnap: ${maxSnap}, 
      minSnap: ${minSnap}, 
      springBackdropOpacity: ${backdropOpacity}, 
      springContentOpacity: ${contentOpacity},
      springBorderRadius: ${borderRadius},
      springFiller: ${springFiller}`
    }
  )

  useEffect(() => {
    if (debugging) {
      console.count('DEBUG window.springRef')
      // @ts-expect-error
      window.springRef = springRef

      console.debug('DEBUG', { springRef })
    }
  }, [springRef])
  const { send } = useMachine({
    debugging,
    snapPointsRef,
    initialHeightRef,
    springRef,
    springConfigRef,
    headerRef,
    contentRef,
    footerRef,
    onClosed,
  })
  useMaxHeight(maxHeightProp, send)
  useHeaderHeight(header !== false ? headerRef : undefined, send)
  useContentHeight(contentRef, send)
  useFooterHeight(footer ? footerRef : undefined, send)

  useLayoutEffect(() => {
    if (_open) {
      send('OPEN')
    } else {
      send('CLOSE')
    }
  }, [_open, send])

  const startYFromDrag = (y: number) =>
    springRef.start({ y: y * -1, height: y * -1, immediate: true })

  const bind = useDrag(
    ({
      args: [{ closeOnTap = false, isContentDragging = false } = {}] = [],
      cancel,
      canceled,
      direction: [, direction],
      down,
      first,
      last,
      memo = height.get(),
      movement: [, movement],
      tap,
      // momentum of the gesture per axis (in px/ms)
      velocity: [, velocity],
      swipe: [, swipe],
      offset: [, offset],
      locked,
      dragging,
      type,
    }) => {
      try {
        // Start by ensuring we don't listen to drag events if we're not supposed to be visible
        if (['closed', 'autofocusing'].includes(mode.get())) {
          console.error(
            `handleDrag cancelled because ${mode.get()} isn't a supported mode`
          )
          cancel()
          return memo
        }

        // Then check if we should  respond to a tap on the backdrop, possibly
        if (onDismiss && closeOnTap && tap) {
          cancel()
          // Runs onDismiss in a timeout to avoid tap events on the backdrop from triggering click events on elements underneath
          setTimeout(() => onDismiss(), 0)
          return memo
        }

        // @TODO do we need to keep filtering them out?
        // Filter out taps silently before we do anything at all
        if (tap) {
          return
        }

        if (first) {
          send('DRAG')
          mode.start('dragging')
        }

        if (last) {
          if (onDismiss) {
            const maybeY =
              direction > 0
                ? offset + velocity * 100
                : direction < 0
                ? offset - velocity * 100
                : offset
            console.log('DEBUG shouldClose', maybeY, minSnap.get() / -2)
            if (maybeY >= minSnap.get() / -2) {
              cancel()
              // Runs onDismiss in a timeout to avoid tap events on the backdrop from triggering click events on elements underneath
              setTimeout(() => onDismiss(), 0)
              return
            }
          }
          send({
            type: 'DRAG_SNAP',
            y: offset * -1,
            velocity,
            swipe,
            direction,
          })

          /*
        sendLegacy('SNAP', {
          payload: {
            y: newY,
            velocity: velocity > 0.05 ? velocity : 1,
            source: 'dragging',
          },
        })
        // */

          return
        }

        if (mode.get() === 'dragging') {
          startYFromDrag(offset)
        }

        // @TODO too many rerenders
        //send('DRAG', { y: newY, velocity })
        //*
        /*
    setLegacy({
      y: newY,
      ready: 1,
      maxHeight: maxHeightRef.current,
      maxSnap: maxSnapRef.current,
      minSnap: minSnapRef.current,
      immediate: true,
      config: { velocity },
    })
    // */
        // */
      } finally {
        debugDragApi.start({
          closeOnTap,
          isContentDragging,
          mode: mode.get(),
          first,
          last,
          canceled,
          velocity,
          direction,
          movement,
          tap,
          down,
          swipe,
          offset,
          immediate: true,
        })
      }
    },
    {
      filterTaps: true,
      from: () => [0, y.get() * -1],
    }
  )

  return (
    <>
      <Portal>
        <animated.div
          style={{ position: 'fixed', top: 30, left: 10, whiteSpace: 'pre' }}
        >
          {springDebug}
        </animated.div>
        <animated.div
          style={{
            position: 'fixed',
            top: 10,
            right: 10,
            whiteSpace: 'pre',
            textAlign: 'right',
          }}
        >
          {dragSpringDebug}
        </animated.div>
      </Portal>
      <FocusScope contain restoreFocus>
        <animated.div
          {...props}
          data-rsbs-root
          data-rsbs-mode={mode}
          data-rsbs-is-blocking={blocking}
          data-rsbs-is-dismissable={!!onDismiss}
          data-rsbs-has-header={!!header}
          data-rsbs-has-footer={!!footer}
          className={className}
          ref={containerRef}
          style={{
            // Fancy content fade-in effect
            ['--rsbs-content-opacity' as any]: springContentOpacity,
            // Fading in the backdrop
            ['--rsbs-backdrop-opacity' as any]: springBackdropOpacity,
            // Scaling the antigap in the bottom
            ['--rsbs-antigap-scale-y' as any]: springFiller,
            // Shifts the position of the bottom sheet, used on open and close primarily as snap point changes usually only interpolate the height
            ['--rsbs-overlay-translate-y' as any]: springY,
            // Remove rounded borders when full height, it looks much better this way
            ['--rsbs-overlay-rounded' as any]: springBorderRadius,
            // Animates the height state, not the most performant way but it's the safest with regards to mobile browser and focus/scrolling that could happen while animating
            ['--rsbs-overlay-h' as any]: springHeight,
            // allow overriding interpolations/disabling them
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
              </div>
            )}
            <div
              key="scroll"
              data-rsbs-scroll
              ref={scrollRef}
              {...(expandOnContentDrag
                ? bind({ isContentDragging: true })
                : {})}
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
      </FocusScope>
    </>
  )
})

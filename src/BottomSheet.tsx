//
// In order to greatly reduce complexity this component is designed to always transition to open on mount, and then
// transition to a closed state later. This ensures that all memory used to keep track of animation and gesture state
// can be reclaimed after the sheet is closed and then unmounted.
// It also ensures that when transitioning to open on mount the state is always clean, not affected by previous states that could
// cause race conditions.

import Portal from '@reach/portal'
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import {
  animated,
  useSpring,
  useSpringRef,
  config,
  to,
} from '@react-spring/web'
import { rubberbandIfOutOfBounds, useDrag } from '@use-gesture/react'
import {
  useAriaHider,
  useFocusTrap,
  useLayoutEffect,
  useReducedMotion,
  useScrollLock,
} from './hooks'
import { useMaxHeight } from './hooks/useMaxHeight'
import {
  useContentHeight,
  useFooterHeight,
  useHeaderHeight,
} from './hooks/useResizeObserver'
import useRootStateMachine from './hooks/useRootStateMachine'
import type {
  defaultSnapProps,
  Props,
  RefHandles,
  ResizeSource,
  SnapPointProps,
  SpringConfigMode,
} from './types'
import { debugging, clamp } from './utils'
import type { SheetContext } from './hooks/useStateMachine'

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
    maxHeight: maxHeightProp,
    defaultSnap: getDefaultSnap = _defaultSnap,
    snapPoints: getSnapPoints = _snapPoints,
    blocking = true,
    scrollLocking = true,
    style,
    onSpringStart,
    onSpringCancel,
    onSpringEnd,
    reserveScrollBarGap = blocking,
    expandOnContentDrag = false,
    UNSTABLE_springConfig,
    ...props
  },
  forwardRef
) {
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
  // const [springLegacy, setLegacy] = useSpringLegacy()

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
    enabled: scrollLocking,
    reserveScrollBarGap,
  })
  const ariaHiderRef = useAriaHider({
    targetRef: containerRef,
    enabled: blocking,
  })
  const focusTrapRef = useFocusTrap({
    targetRef: containerRef,
    fallbackRef: overlayRef,
    initialFocusRef: initialFocusRef || undefined,
    enabled: blocking && initialFocusRef !== false,
  })

  // New utility for using events safely
  /*
  const asyncSet = useCallback<typeof setLegacy>(
    // @ts-expect-error
    ({ onRest, config: { velocity = 1, ...config } = {}, ...opts }) =>
      new Promise((resolve) =>
        setLegacy({
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
    [setLegacy]
  )
  // */
  /* NEW STUFF START */
  const maxHeightRef = useRef(0)
  const minSnapRef = useRef(0)
  const maxSnapRef = useRef(0)
  const snapPointsRef = useRef(getSnapPoints)
  useEffect(() => {
    snapPointsRef.current = getSnapPoints
  }, [getSnapPoints])
  const initialHeightRef = useRef(getDefaultSnap)
  useEffect(() => {
    initialHeightRef.current = getDefaultSnap
  }, [getDefaultSnap])
  type SpringState = {
    mode:
      | 'mounting'
      | 'closed'
      | 'opening'
      | 'open'
      | 'dragging'
      | 'snapping'
      | 'resizing'
      | 'closing'
    // height and y are usually the same value, but they behave differently when moving out of bounds
    // height is always a value between minSnap and maxSnap
    height: number
    // y can sometimes be out of minSnap and maxSnap bounds, sometimes rubberbanded, sometimes not
    y: number
    // maxHeight, maxSnap and minSnap are synced with the state machine context during specific transition events
    // the state machine is the source of truth for these values
    maxHeight: number
    maxSnap: number
    minSnap: number
    // backdropOpacity fires both while dragging, and on open/close, to signal during dragging you are about to close
    backdropOpacity: number
    // contentOpacity is only updated during open/close, as the content should always be visible while the user interacts with the sheet
    contentOpacity: number
  }
  // @TODO add example showing how the ref can be used with useChain and useTransition to chain other page animations to sync with the sheet
  // Maybe scale the background like AppleMusic I dunno go wild
  const springRef = useSpringRef<SpringState>()
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
  // @TODO add support for springConfig prop
  const [spring] = useSpring<SpringState>(() => ({
    mode: 'mounting',
    height: 0,
    y: 0,
    maxHeight: 0,
    maxSnap: 0,
    minSnap: 0,
    backdropOpacity: 0,
    contentOpacity: 0,
    ref: springRef,
  }))
  const [debugDragSpring, debugDragApi] = useSpring(() => ({
    mode: spring.mode.get(),
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
    [spring.height, spring.minSnap, spring.maxSnap],
    (height, minSnap, maxSnap) => {
      console.log('interpolateHeight', clamp(height, minSnap, maxSnap), {
        height,
        minSnap,
        maxSnap,
      })
      return clamp(height, minSnap, maxSnap)
    }
  )
  const springHeight = springClampedHeight.to((height) => `${height}px`)
  const springY = to([spring.y, springClampedHeight], (y, height) => {
    console.log('interpolateY', `${height - y}px`, { y, height })
    return `${height - y}px`
  })
  /*
  const springYToMinSnap = to(
    [spring.y, spring.minSnap],
    (y, minSnap) => y / minSnap
  ).to({ range: [0.5, 1], output: [0, 1], extrapolate: 'clamp' })
  // */
  const springContentOpacity = spring.contentOpacity
  /*
  const springContentOpacity = spring.contentOpacity.to({
    range: [0.5, 0.9],
    output: [0, 1],
    extrapolate: 'clamp',
  })
  //*/
  const springBackdropOpacity = spring.backdropOpacity
  const springFiller = to([spring.y, springClampedHeight], (y, height) => {
    if (y >= height) {
      return Math.ceil(y - height)
    }
    return 0
  })
  const springBorderRadius = to(
    [spring.y, spring.maxHeight],
    (y, maxHeight) => {
      return `${Math.round(clamp(maxHeight - y, 0, 16))}px`
    }
  )
  const springDebug = to(
    [
      spring.mode,
      spring.height,
      spring.y,
      spring.maxHeight,
      spring.maxSnap,
      spring.minSnap,
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
      if (backdropOpacity < 0 || backdropOpacity > 1) {
        console.count('backdropOpacity is incorrect')
        console.error('backdropOpacity is incorrect', backdropOpacity)
      }
      if (contentOpacity < 0 || contentOpacity > 1) {
        console.count('contentOpacity is incorrect')
        console.error('contentOpacity is incorrect', contentOpacity)
      }

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

  const activateDomHooks = useCallback(async () => {
    await Promise.all([
      // scrollLockRef.current.activate(),
      ariaHiderRef.current.activate(),
    ])
  }, [ariaHiderRef, focusTrapRef, scrollLockRef])
  const activateFocusLock = useCallback(async () => {
    await Promise.all([
      // scrollLockRef.current.activate(),
      focusTrapRef.current.activate(),
    ])
  }, [ariaHiderRef, focusTrapRef, scrollLockRef])
  const deactivateDomHooks = useCallback(async () => {
    // scrollLockRef.current.deactivate()
    focusTrapRef.current.deactivate()
    ariaHiderRef.current.deactivate()
  }, [ariaHiderRef, focusTrapRef, scrollLockRef])
  useEffect(() => {
    console.count('DEBUG useEffect')
    // @ts-expect-error
    window.cody = springRef

    // this will give you access to the same API documented above
    console.log('DEBUG useEffect', { spring, springRef }, springRef.current)
  }, [spring, springRef])
  const { send, isMounting } = useRootStateMachine({
    snapPointsRef,
    initialHeightRef,
    springRef,
    springConfigRef,
    activateDomHooks,
    deactivateDomHooks,
    activateFocusLock,
  })
  useMaxHeight(maxHeightProp, send)
  useHeaderHeight(header !== false ? headerRef : undefined, send)
  useContentHeight(contentRef, send)
  useFooterHeight(footer ? footerRef : undefined, send)
  /* NEW STUFF END */

  useLayoutEffect(() => {
    if (_open) {
      if (initialState === 'OPEN' && isMounting()) {
        send('OPEN_IMMEDIATELY')
      } else {
        send('OPEN')
      }
    } else {
      send('CLOSE')
    }
  }, [_open, initialState, isMounting, send])
  useEffect(
    () => () => {
      // Ensure effects are cleaned up on unmount, in case they're not cleaned up otherwise
      // @TODO move logic into respective hooks
      // scrollLockRef.current.deactivate()
      focusTrapRef.current.deactivate()
      ariaHiderRef.current.deactivate()
    },
    [ariaHiderRef, focusTrapRef, scrollLockRef]
  )

  /*
  useImperativeHandle(
    forwardRef,
    () => ({
      snapTo: (numberOrCallback, { velocity = 1, source = 'custom' } = {}) => {
        sendLegacy('SNAP', {
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
    }),
    [sendLegacy]
  )
  // */

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
      memo = spring.height.get(),
      movement: [, movement],
      tap,
      velocity: [, velocity],
      swipe: [, swipe],
      offset: [, offset],
    }) => {
      try {
        // Start by ensuring we don't listen to drag events if we're not supposed to be visible
        const mode = spring.mode.get()
        // Cancel the drag operation if the canDrag state changed
        if (['mounting', 'closed', 'autofocusing'].includes(mode)) {
          console.error(
            `handleDrag cancelled because ${mode} isn't a supported mode`
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
          send('DRAG_START')
        }

        if (last) {
          if (onDismiss) {
            const maybeY =
              direction > 0
                ? offset + velocity * 100
                : direction < 0
                ? offset - velocity * 100
                : offset
            console.log('DEBUG shouldClose', maybeY, spring.minSnap.get() / -2)
            if (maybeY >= spring.minSnap.get() / -2) {
              cancel()
              // Runs onDismiss in a timeout to avoid tap events on the backdrop from triggering click events on elements underneath
              setTimeout(() => onDismiss(), 0)
              return
            }
          }
          send({ type: 'DRAG_SNAP', y: offset * -1, velocity, swipe })

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

        if (spring.mode.get() === 'dragging') {
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
          mode: spring.mode.get(),
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
      from: () => [0, spring.y.get() * -1],
    }
  )

  return (
    <>
      <Portal>
        <animated.div
          style={{ position: 'absolute', top: 30, left: 10, whiteSpace: 'pre' }}
        >
          {springDebug}
        </animated.div>
        <animated.div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            whiteSpace: 'pre',
            textAlign: 'right',
          }}
        >
          {dragSpringDebug}
        </animated.div>
      </Portal>
      <animated.div
        {...props}
        data-rsbs-root
        data-rsbs-mode={spring.mode}
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
    </>
  )
})

// Default prop values that are callbacks, and it's nice to save some memory and reuse their instances since they're pure
function _defaultSnap({ snapPoints, lastSnap }: defaultSnapProps) {
  return lastSnap ?? Math.min(...snapPoints)
}
function _snapPoints({ maxContent }: SnapPointProps) {
  return maxContent
}

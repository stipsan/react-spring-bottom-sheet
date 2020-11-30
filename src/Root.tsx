// Internal component with most of the gesture logic and physics based transitions
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
  useMobileSafari,
  usePrevious,
  useReducedMotion,
  useSnapPoints,
  useTransitionState,
  useViewportHeight,
} from './hooks'
import { createAriaHider, createScrollLocker, isNumber } from './utils'
import type {
  snapPoints,
  initialHeight,
  setSnapPoint,
  SharedProps,
} from './types'

type DraggableBottomSheetProps = {
  _onClose: () => void
  _shouldClose: boolean
  snapPoints: snapPoints
  initialHeight: initialHeight
} & SharedProps

// How many pixels above the viewport height the user is allowed to drag the bottom sheet
const MAX_OVERFLOW = 120

export const DraggableBottomSheet = React.forwardRef(
  (
    {
      _shouldClose,
      _onClose,
      children,
      className,
      footer,
      header,
      initialFocusRef,
      onDismiss,
      initialHeight: _getInitialHeight,
      snapPoints: getSnapPoints,
      blocking = true,
      scrollLocking = true,
      style,
      ...props
    }: DraggableBottomSheetProps,
    forwardRef: React.Ref<HTMLDivElement>
  ) => {
    const shouldCloseRef = useRef(_shouldClose)
    shouldCloseRef.current = _shouldClose
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const contentContainerRef = useRef<HTMLDivElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const footerRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement | null>(null)
    const [state, dispatch] = useTransitionState()
    // The following variables are extracted to ensure useEffect hooks respond to specific transition states
    // instead of reacting to *any* change to state.transitionState
    // For instance some hooks only want to run when transitionState changes to 'READY', not when it changes from
    // OPENING to OPEN. By using these consts we gain that pinpoint precision.
    const isIdle = !_shouldClose && state.transitionState === 'IDLE'
    const isPrerender = !_shouldClose && state.transitionState === 'PRERENDER'
    const isReady = !_shouldClose && state.transitionState === 'READY'
    const isOpening = !_shouldClose && state.transitionState === 'OPENING'
    const isOpen = !_shouldClose && state.transitionState === 'OPEN'
    const isDragging = !_shouldClose && state.transitionState === 'DRAGGING'

    const prefersReducedMotion = useReducedMotion()
    const viewportHeight = useViewportHeight()
    const isMobileSafari = useMobileSafari()

    useEffect(() => {
      const content = contentRef.current
      if (scrollLocking && content && !_shouldClose) {
        const scrollLocker = createScrollLocker(content)
        scrollLocker.activate()

        return () => {
          scrollLocker.deactivate()
        }
      }
    }, [_shouldClose, scrollLocking])

    // Drag interaction states
    const [{ y }, set] = useSpring(() => ({
      y: 0,
    }))

    const { contentHeight, maxHeight } = useDimensions({
      viewportHeight,
      headerRef,
      contentRef: contentContainerRef,
      footerRef,
    })

    const { snapPoints, minSnap, maxSnap, toSnapPoint } = useSnapPoints({
      getSnapPoints,
      currentHeight: state.currentHeight,
      minHeight,
      maxHeight,
      viewportHeight,
    })

    const initialHeight = useMemo(() => {
      // If we're firing before the dom is mounted then minHeight will be 0 and we should return default values
      if (minHeight === 0) {
        return 0
      }

      const nextHeight = _getInitialHeight({
        currentHeight: state.currentHeight,
        minHeight,
        maxHeight,
        viewportHeight,
        snapPoints,
      })
      return toSnapPoint(nextHeight)
    }, [
      _getInitialHeight,
      maxHeight,
      minHeight,
      snapPoints,
      state.currentHeight,
      toSnapPoint,
      viewportHeight,
    ])

    // @TODO move these to custom hooks
    useEffect(() => {
      if (_shouldClose || isIdle) return

      const container = containerRef.current
      const overlay = overlayRef.current

      if (blocking && container && overlay) {
        const trap = createFocusTrap(container, {
          onActivate: () => {
            requestAnimationFrame(() => {
              dispatch({ type: 'FOCUS_TRAP_READY' })
            })
          },
          // If initialFocusRef is manually specified we don't want the first tabbable element to receive focus if initialFocusRef can't be found
          initialFocus: initialFocusRef ? overlay : undefined,
          fallbackFocus: overlay,
          escapeDeactivates: false,
          clickOutsideDeactivates: false,
        })
        const ariaHide = createAriaHider(container)

        trap.activate()
        ariaHide.activate()

        return () => {
          ariaHide.deactivate()
          trap.deactivate()
        }
      } else {
        dispatch({ type: 'FOCUS_TRAP_READY' })
      }
    }, [_shouldClose, blocking, dispatch, isIdle, initialFocusRef])
    // Handles both setting initial focus when opening, as well as changes to the initialFocusRef prop itself
    useEffect(() => {
      if (_shouldClose || isIdle) return

      let cancelRef
      if (initialFocusRef) {
        // branch of wether we're setting initial focus for the first time, or after opening
        if (isPrerender) {
          cancelRef = setTimeout(() => {
            initialFocusRef.current?.focus?.()

            // @TODO also handle .select
            cancelRef = setTimeout(() => {
              dispatch({ type: 'INITIAL_FOCUS_READY' })
            })
          })
        } else {
          if (initialFocusRef.current) {
            if (isMobileSafari) {
              initialFocusRef.current.blur?.()
              cancelRef = setTimeout(() => {
                if (initialFocusRef.current) {
                  // Thanks to Safari edge cases it's actually necessary to do two rAF cycles...
                  cancelRef = requestAnimationFrame(() => {
                    initialFocusRef.current?.focus?.()
                  })
                }
              })
            } else {
              initialFocusRef.current.focus?.()
            }
          }
        }
      } else if (isPrerender) {
        dispatch({ type: 'INITIAL_FOCUS_READY' })
      }

      return () => {
        clearTimeout(cancelRef)
      }
    }, [
      _shouldClose,
      dispatch,
      initialFocusRef,
      isIdle,
      isMobileSafari,
      isPrerender,
    ])

    useEffect(() => {
      if (_shouldClose) return

      if (isIdle) {
        // render it hidden in the location it will be after the open transition
        set({
          y: initialHeight,
          immediate: true,
          onRest: () => {
            dispatch({
              type: 'PRERENDER',
              currentHeight: initialHeight,
            })
          },
        })

        return
      }

      // The transitionState is changed from READY to OPENING when potential focus traps and initial focus is done
      if (isReady) {
        set({
          y: 0,
          immediate: true,
          onRest: () => dispatch({ type: 'OPENING' }),
        })
      }

      if (isOpening) {
        set({
          y: initialHeight,
          immediate: prefersReducedMotion.current,
          onRest: () => {
            dispatch({
              type: 'OPEN',
              currentHeight: initialHeight,
            })
          },
        })
      }
    }, [
      _shouldClose,
      dispatch,
      initialHeight,
      isIdle,
      isOpen,
      isOpening,
      isReady,
      prefersReducedMotion,
      set,
    ])

    // Respond to viewport height or content height changes if they affect the min and max heights
    const prevDimensions = usePrevious({
      minHeight,
      maxHeight,
      viewportHeight,
    })

    useEffect(() => {
      // Don't interfer with other states
      if (!isOpen) return

      // Only respond if minHeight or maxHeight changes as a result
      if (
        minHeight !== prevDimensions.minHeight ||
        maxHeight !== prevDimensions.maxHeight
      ) {
        set({
          y: initialHeight,
          // If the viewportHeight changed then we should respond immediatly instead of animating
          immediate:
            viewportHeight !== prevDimensions.viewportHeight ||
            prefersReducedMotion.current,
          onRest: () => {
            dispatch({
              type: 'OPEN',
              currentHeight: initialHeight,
            })
          },
        })
        return
      }
      // Fail recovery effect, if an inconsistent state is detected it should correct itself
      const validHeight = toSnapPoint(state.currentHeight)
      if (state.currentHeight !== validHeight) {
        set({
          y: validHeight,
          immediate: prefersReducedMotion.current,
          onRest: () => {
            dispatch({ type: 'OPEN', currentHeight: validHeight })
          },
        })
      }
    }, [
      dispatch,
      initialHeight,
      isOpen,
      maxHeight,
      minHeight,
      prefersReducedMotion,
      prevDimensions.maxHeight,
      prevDimensions.minHeight,
      prevDimensions.viewportHeight,
      set,
      state.currentHeight,
      toSnapPoint,
      viewportHeight,
    ])

    useEffect(() => {
      if (!_shouldClose) return

      set({
        y: 0,
        immediate: prefersReducedMotion.current,
        onRest: _onClose,
      })
    }, [_onClose, _shouldClose, prefersReducedMotion, set])

    useImperativeHandle<{}, { setSnapPoint: setSnapPoint }>(forwardRef, () => ({
      setSnapPoint: (maybeHeightUpdater) => {
        if (shouldCloseRef.current || !isOpen) return
        let nextHeight: number
        if (typeof maybeHeightUpdater === 'function') {
          nextHeight = maybeHeightUpdater({
            currentHeight: state.currentHeight,
            minHeight,
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

        set({
          y: nextHeight,
          immediate: prefersReducedMotion.current,
          onRest: () =>
            dispatch({
              type: 'OPEN',
              currentHeight: nextHeight,
            }),
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

    const bind = useDrag(
      ({
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
        }

        set({
          y: newY,
          immediate: prefersReducedMotion.current || down,
          config: {
            mass: relativeVelocity,
            tension: 300 * relativeVelocity,
            friction: 35 * relativeVelocity,
            velocity: direction[1] * velocity,
          },
          onRest: last
            ? () => {
                // Race condition case for onClick happening after _shouldClose is false
                if (shouldCloseRef.current) {
                  set({
                    y: 0,
                    immediate: prefersReducedMotion.current,
                    onRest: _onClose,
                  })
                } else {
                  dispatch({
                    type: 'OPEN',
                    currentHeight: newY,
                  })
                }
              }
            : undefined,
        })
        if (first) {
          dispatch({ type: 'DRAGGING' })
        }

        return memo
      },
      { enabled: !shouldCloseRef.current, axis: 'y' }
    )

    // @TODO the ts-ignore comments are because the `extrapolate` param isn't in the TS defs for some reason
    const interpolateBorderRadius =
      viewportHeight !== maxSnap
        ? undefined
        : // @ts-expect-error
          y.interpolate({
            range: [viewportHeight - 16, viewportHeight],
            output: ['16px', '0px'],
            extrapolate: 'clamp',
            map: Math.round,
          })
    // @ts-expect-error
    const overlayOpacity = y.interpolate({
      range: [0, minSnap],
      output: [0, 1],
      extrapolate: 'clamp',
    })
    // @ts-expect-error
    const interpolateHeight = y.interpolate({
      range: [minSnap, maxSnap],
      output: [minSnap, maxSnap],
      extrapolate: 'clamp',
    })
    const interpolateY = y.interpolate({
      range: [0, minSnap, maxSnap, maxSnap + MAX_OVERFLOW],
      output: [`${minSnap}px`, '0px', '0px', `${-MAX_OVERFLOW}px`],
    })
    // @ts-expect-error
    const interpolateFiller = y.interpolate({
      range: [0, maxSnap, maxSnap + MAX_OVERFLOW],
      output: ['scaleY(0)', 'scaleY(0)', `scaleY(${MAX_OVERFLOW})`],
      map: Math.ceil,
    })

    const dragEvents = bind()

    return (
      <div
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
          opacity:
            (isIdle || isPrerender || isReady) && !_shouldClose ? 0 : undefined,
          // Allows interactions on the rest of the page before the close transition is finished
          pointerEvents: _shouldClose ? 'none' : undefined,
        }}
      >
        {blocking && (
          <animated.div
            key="backdrop"
            // This component needs to be placed outside bottom-sheet, as bottom-sheet uses transform and thus creates a new context
            // that clips this element to the container, not allowing it to cover the full page.
            data-rsbs-backdrop
            style={{
              opacity:
                isOpening || (onDismiss && isDragging) || _shouldClose
                  ? overlayOpacity
                  : undefined,
            }}
            onClick={(event) => {
              if (onDismiss) {
                event.preventDefault()
                onDismiss()
              }
            }}
            {...dragEvents}
          />
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
          {header !== false && (
            <div key="header" data-rsbs-header ref={headerRef} {...dragEvents}>
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
            <div key="footer" ref={footerRef} data-rsbs-footer {...dragEvents}>
              <div data-rsbs-footer-padding>{footer}</div>
            </div>
          )}
        </animated.div>
        <animated.div
          key="antigap"
          data-rsbs-antigap
          style={{ transform: interpolateFiller }}
        />
      </div>
    )
  }
)

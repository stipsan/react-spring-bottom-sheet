import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import { createFocusTrap } from 'focus-trap'
import React, {
  useDebugValue,
  useEffect,
  useLayoutEffect as useLayoutEffectSafely,
  useRef,
  useState,
} from 'react'
import type { SnapPointProps, snapPoints } from '../types'
import { clamp, roundAndCheckForNaN } from '../utils'
export { useDimensions } from './useDimensions'
export { usePrevious } from './usePrevious'
export { useReducedMotion } from './useReducedMotion'

// Blazingly keep track of the current viewport height without blocking the thread, keeping that sweet 60fps on smartphones
export const useViewportHeight = (controlledMaxHeight) => {
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 0
  )
  const raf = useRef(0)

  useEffect(() => {
    // Bail if the max height is a controlled prop
    if (controlledMaxHeight) return

    const handleResize = () => {
      if (raf.current) {
        // bail to throttle the amount of resize changes
        return
      }

      // throttle state changes using rAF
      raf.current = requestAnimationFrame(() => {
        setViewportHeight(window.innerHeight)

        raf.current = 0
      })
    }
    window.addEventListener('resize', handleResize)
    setViewportHeight(window.innerHeight)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(raf.current)
    }
  }, [controlledMaxHeight])

  return controlledMaxHeight || viewportHeight
}

type UseSnapPointsProps = {
  getSnapPoints: snapPoints
  contentHeight: number
} & SnapPointProps
export const useSnapPoints = ({
  getSnapPoints,
  minHeight,
  footerHeight,
  headerHeight,
  contentHeight,
  height,
  maxHeight,
}: UseSnapPointsProps) => {
  // @TODO cleanup
  function _getSnaps() {
    // If we're firing before the dom is mounted then height will be 0 and we should return default values
    if (contentHeight === 0) {
      return { snapPoints: [0], minSnap: 0, maxSnap: 0 }
    }

    const massagedSnapPoints = []
      .concat(
        getSnapPoints({
          height,
          footerHeight,
          headerHeight,
          minHeight,
          maxHeight,
        })
      )
      .map(roundAndCheckForNaN)

    const snapPoints = [
      ...massagedSnapPoints.reduce((acc, snapPoint) => {
        acc.add(clamp(snapPoint, 0, maxHeight))
        return acc
      }, new Set<number>()),
    ]

    return {
      snapPoints,
      minSnap: Math.min(...snapPoints),
      maxSnap: Math.max(...snapPoints),
    }
  }

  // @TODO Extract the snap points logic to a separate function that can be unit tested
  // @TODO replace this with simpler logic: https://stackoverflow.com/a/19277804
  const { snapPoints, minSnap, maxSnap } = _getSnaps()

  const toSnapPoint = (rawY: number) => {
    const y = roundAndCheckForNaN(rawY)
    return snapPoints.reduce(
      (prev, curr) => (Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev),
      minSnap
    )
  }

  useDebugValue(snapPoints, (snapPoints) => snapPoints.sort())

  return { snapPoints, minSnap, maxSnap, toSnapPoint }
}

/**
 * Handle scroll locking to ensure a good dragging experience on Android and iOS.
 *
 * On iOS the following may happen if scroll isn't locked:
 * - When dragging the sheet the background gets dragged at the same time.
 * - When dragging the page scroll is also affected, causing the drag to feel buggy and "slow".
 *
 * On Android it causes the chrome toolbar to pop down as you drag down, and hide as you drag up.
 * When it's in between two toolbar states it causes the framerate to drop way below 60fps on
 * the bottom sheet drag interaction.
 */
export const useScrollLock = ({
  targetRef,
  enabled,
}: {
  targetRef: React.RefObject<Element>
  enabled: boolean
}) => {
  const ref = useRef<{ activate: () => void; deactivate: () => void }>({
    activate: () => {
      throw new TypeError('Tried to activate scroll lock too early')
    },
    deactivate: () => {},
  })

  useDebugValue(enabled ? 'Enabled' : 'Disabled')

  useEffect(() => {
    if (!enabled) {
      ref.current.deactivate()
      ref.current = { activate: () => {}, deactivate: () => {} }
      return
    }

    const target = targetRef.current
    let active = false

    ref.current = {
      activate: () => {
        if (active) return
        active = true
        disableBodyScroll(target, {
          allowTouchMove: (el) => el.closest('[data-body-scroll-lock-ignore]'),
        })
      },
      deactivate: () => {
        if (!active) return
        active = false
        enableBodyScroll(target)
      },
    }
  }, [enabled, targetRef])

  return ref
}

// Handle hiding and restoring aria-hidden attributes
export const useAriaHider = ({
  targetRef,
  enabled,
}: {
  targetRef: React.RefObject<Element>
  enabled: boolean
}) => {
  const ref = useRef<{ activate: () => void; deactivate: () => void }>({
    activate: () => {
      throw new TypeError('Tried to activate aria hider too early')
    },
    deactivate: () => {},
  })

  useDebugValue(enabled ? 'Enabled' : 'Disabled')

  useEffect(() => {
    if (!enabled) {
      ref.current.deactivate()
      ref.current = { activate: () => {}, deactivate: () => {} }
      return
    }

    const target = targetRef.current
    let active = false
    let originalValues: (null | string)[] = []
    let rootNodes: Element[] = []

    ref.current = {
      activate: () => {
        if (active) return
        active = true

        const parentNode = target.parentNode

        document.querySelectorAll('body > *').forEach((node) => {
          if (node === parentNode) {
            return
          }
          let attr = node.getAttribute('aria-hidden')
          let alreadyHidden = attr !== null && attr !== 'false'
          if (alreadyHidden) {
            return
          }
          originalValues.push(attr)
          rootNodes.push(node)
          node.setAttribute('aria-hidden', 'true')
        })
      },
      deactivate: () => {
        if (!active) return
        active = false

        rootNodes.forEach((node, index) => {
          let originalValue = originalValues[index]
          if (originalValue === null) {
            node.removeAttribute('aria-hidden')
          } else {
            node.setAttribute('aria-hidden', originalValue)
          }
        })
        originalValues = []
        rootNodes = []
      },
    }
  }, [targetRef, enabled])

  return ref
}

export const useFocusTrap = ({
  targetRef,
  fallbackRef,
  initialFocusRef,
  enabled,
}: {
  targetRef: React.RefObject<HTMLElement>
  fallbackRef: React.RefObject<HTMLElement>
  initialFocusRef?: React.RefObject<HTMLElement>
  enabled: boolean
}) => {
  const ref = useRef<{ activate: () => void; deactivate: () => void }>({
    activate: () => {
      throw new TypeError('Tried to activate focus trap too early')
    },
    deactivate: () => {},
  })

  useDebugValue(enabled ? 'Enabled' : 'Disabled')

  useEffect(() => {
    if (!enabled) {
      ref.current.deactivate()
      ref.current = { activate: () => {}, deactivate: () => {} }
      return
    }

    const fallback = fallbackRef.current
    const trap = createFocusTrap(targetRef.current, {
      onActivate:
        process.env.NODE_ENV !== 'production'
          ? () => {
              console.log('focus activate')
            }
          : undefined,
      // If initialFocusRef is manually specified we don't want the first tabbable element to receive focus if initialFocusRef can't be found
      initialFocus: initialFocusRef
        ? () => initialFocusRef?.current || fallback
        : undefined,
      fallbackFocus: fallback,
      escapeDeactivates: false,
      clickOutsideDeactivates: false,
    })
    let active = false

    ref.current = {
      activate: async () => {
        if (active) return
        active = true

        await trap.activate()
        return new Promise((resolve) =>
          requestAnimationFrame(() => resolve(void 1))
        )
      },
      deactivate: () => {
        if (!active) return
        active = false

        trap.deactivate()
      },
    }
  }, [enabled, fallbackRef, initialFocusRef, targetRef])

  return ref
}

// Ensure the name used in components is useLayoutEffect so the eslint react hooks plugin works
export const useLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffectSafely : useEffect

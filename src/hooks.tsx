import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useReducer,
  useLayoutEffect,
} from 'react'
import type { snapPoints } from './types'
import { clamp } from './utils'

import ResizeObserver from 'resize-observer-polyfill'

/**
 * Hook for determining the size of an element using the Resize Observer API.
 *
 * @param ref - A React ref to an element
 */
export default function useElementSizeObserver(
  ref: React.RefObject<Element>
): { width: number; height: number } {
  let [size, setSize] = useState({ width: 0, height: 0 })

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    setSize({
      // we only observe one element, so accessing the first entry here is fine
      width: entries[0].contentRect.width,
      height: entries[0].contentRect.height,
    })
  }, [])

  useLayoutEffect(() => {
    if (!ref.current) {
      return
    }

    // Set initial size here, as the one from the observer fires too late on iOS safari
    const { width, height } = ref.current.getBoundingClientRect()
    setSize({ width, height })

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(ref.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [ref, handleResize])

  return size
}

// Blazingly keep track of the current viewport height without blocking the thread, keeping that sweet 60fps on smartphones
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)
  const raf = useRef(0)

  useEffect(() => {
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

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return viewportHeight
}

// @TODO refactor to useState instead of useRef
export function useReducedMotion() {
  const mql = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)'),
    []
  )
  const ref = useRef(mql.matches)

  useEffect(() => {
    const handler = (event) => {
      ref.current = event.matches
    }
    mql.addListener(handler)

    return () => mql.removeListener(handler)
  }, [mql])

  return ref
}

export const useMobileSafari = () =>
  useMemo(
    () =>
      navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
      navigator.userAgent.match(/AppleWebKit/),
    []
  )

type UseSnapPointsProps = {
  getSnapPoints: snapPoints
  minHeight: number
  maxHeight: number
  currentHeight: number
  viewportHeight: number
}
export const useSnapPoints = ({
  getSnapPoints,
  minHeight,
  maxHeight,
  currentHeight,
  viewportHeight,
}: UseSnapPointsProps) => {
  // @TODO Extract the snap points logic to a separate function that can be unit tested
  // @TODO replace this with simpler logic: https://stackoverflow.com/a/19277804
  const { snapPoints, minSnap, maxSnap } = useMemo(() => {
    // If we're firing before the dom is mounted then minHeight will be 0 and we should return default values
    if (minHeight === 0) {
      return { snapPoints: [0], minSnap: 0, maxSnap: 0 }
    }

    const providedSnapPoints = getSnapPoints({
      currentHeight,
      minHeight,
      maxHeight,
      viewportHeight,
    }).map(Math.round)

    const validSnapPoints: number[] = []
    providedSnapPoints.forEach((snapPoint) => {
      const validSnapPoint = clamp(snapPoint, minHeight, viewportHeight)
      if (validSnapPoints.indexOf(validSnapPoint) === -1) {
        validSnapPoints.push(validSnapPoint)
      }
    })
    validSnapPoints.sort((a, b) => a - b)

    const lastIndex = validSnapPoints.length - 1

    return {
      snapPoints: validSnapPoints,
      minSnap: validSnapPoints[0],
      maxSnap: validSnapPoints[lastIndex],
    }
  }, [currentHeight, getSnapPoints, maxHeight, minHeight, viewportHeight])

  const toSnapPoint = useCallback(
    (y: number) =>
      snapPoints.reduce(
        (prev, curr) => (Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev),
        minSnap
      ),
    [minSnap, snapPoints]
  )

  return { snapPoints, minSnap, maxSnap, toSnapPoint }
}

type UseDimensionsProps = {
  viewportHeight: number
  headerRef: React.RefObject<Element>
  contentRef: React.RefObject<Element>
  footerRef: React.RefObject<Element>
}
export const useDimensions = ({
  viewportHeight,
  headerRef,
  contentRef,
  footerRef,
}: UseDimensionsProps) => {
  const headerDimensions = useElementSizeObserver(headerRef)
  const contentDimensions = useElementSizeObserver(contentRef)
  const footerDimensions = useElementSizeObserver(footerRef)

  const contentHeight = Math.min(
    viewportHeight - headerDimensions.height - footerDimensions.height,
    contentDimensions.height
  )

  const minHeight = headerDimensions.height + footerDimensions.height
  const maxHeight =
    contentHeight + headerDimensions.height + footerDimensions.height

  return { minHeight, maxHeight }
}

interface TransitionState {
  transitionState:
    | 'IDLE'
    | 'PRERENDER'
    | 'READY'
    | 'OPENING'
    | 'OPEN'
    | 'DRAGGING'
  focusTrapReady: boolean
  initialFocusReady: boolean
  currentHeight: number
}

type TransitionActions =
  | { type: 'PRERENDER'; currentHeight: number }
  | { type: 'FOCUS_TRAP_READY' }
  | { type: 'INITIAL_FOCUS_READY' }
  | { type: 'OPENING' }
  | { type: 'OPEN'; currentHeight: number }
  | { type: 'DRAGGING' }

function transitionReducer(
  state: TransitionState,
  action: TransitionActions
): TransitionState {
  switch (action.type) {
    case 'PRERENDER':
      // The bottom sheet is mounted and rendered with opacity 0 in the initialHeight position
      return { ...state, transitionState: 'PRERENDER' }
    case 'FOCUS_TRAP_READY':
      return {
        ...state,
        focusTrapReady: true,
        transitionState:
          state.transitionState === 'PRERENDER' &&
          state.initialFocusReady === true
            ? 'READY'
            : state.transitionState,
      }
    case 'INITIAL_FOCUS_READY':
      return {
        ...state,
        initialFocusReady: true,
        transitionState:
          state.transitionState === 'PRERENDER' && state.focusTrapReady === true
            ? 'READY'
            : state.transitionState,
      }
    case 'OPENING':
      return { ...state, transitionState: 'OPENING' }
    case 'OPEN':
      return {
        ...state,
        transitionState: 'OPEN',
        currentHeight: action.currentHeight,
      }
    case 'DRAGGING':
      return { ...state, transitionState: 'DRAGGING' }
  }
}

const initialTransitionState: TransitionState = {
  transitionState: 'IDLE',
  focusTrapReady: false,
  initialFocusReady: false,
  currentHeight: 0,
}

export const useTransitionState = () =>
  useReducer(transitionReducer, initialTransitionState)

export function usePrevious<T>(value: T): T {
  const ref = useRef<T>(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import type { SnapPointArg, snapPoints } from './types'
import { clamp, roundAndCheckForNaN } from './utils'

/**
 * Hook for determining the size of an element using the Resize Observer API.
 *
 * @param ref - A React ref to an element
 */
export default function useElementSizeObserver(
  ref: React.RefObject<Element>
): { width: number; height: number } {
  let [size, setSize] = useState(() => ({ width: 0, height: 0 }))

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
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 0
  )
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
    () =>
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null,
    []
  )
  const ref = useRef(mql?.matches)

  useEffect(() => {
    const handler = (event) => {
      ref.current = event.matches
    }
    mql?.addListener(handler)

    return () => mql?.removeListener(handler)
  }, [mql])

  return ref
}

type UseSnapPointsProps = {
  getSnapPoints: snapPoints
  contentHeight: number
} & SnapPointArg
export const useSnapPoints = ({
  getSnapPoints,
  minHeight,
  footerHeight,
  headerHeight,
  contentHeight,
  height,
  viewportHeight,
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
          minHeight: minHeight,
          viewportHeight,
        })
      )
      .map(roundAndCheckForNaN)

    // @TODO detect if invalid snap points in levels, only arrays or numbers allowed.
    // And arrays must have at least 1 item. for now silently fix it

    const validSnapPoints: number[] = []
    massagedSnapPoints.forEach((snapPoint) => {
      const validSnapPoint = clamp(snapPoint, 0, viewportHeight)
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
  // Rewrite these to set refs and use nextTick
  const { height: headerHeight } = useElementSizeObserver(headerRef)
  const contentDimensions = useElementSizeObserver(contentRef)
  const { height: footerHeight } = useElementSizeObserver(footerRef)

  const contentHeight = Math.min(
    viewportHeight - headerHeight - footerHeight,
    contentDimensions.height
  )

  const minHeight = contentHeight + headerHeight + footerHeight
  return {
    minHeight: minHeight,
    contentHeight: contentDimensions.height,
    headerHeight,
    footerHeight,
  }
}

export const useInterval = (callback, delay) => {
  const savedCallback = useRef<() => any>()

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    function tick() {
      savedCallback.current()
    }
    if (delay !== null) {
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

export function usePrevious<T>(value: T): T {
  const ref = useRef<T>(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

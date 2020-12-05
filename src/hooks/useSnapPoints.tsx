import React, {
  useCallback,
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import type { defaultSnapProps, snapPoints } from '../types'
import { processSnapPoints, roundAndCheckForNaN } from '../utils'
import { useReady } from './useReady'

export function useSnapPoints({
  contentContainerRef,
  controlledMaxHeight,
  footerRef,
  getSnapPoints,
  headerRef,
  heightRef,
  lastSnapRef,
  ready,
  registerReady,
}: {
  contentContainerRef: React.RefObject<Element>
  controlledMaxHeight?: number
  footerRef: React.RefObject<Element>
  getSnapPoints: snapPoints
  headerRef: React.RefObject<Element>
  heightRef: React.RefObject<number>
  lastSnapRef: React.RefObject<number>
  ready: boolean
  registerReady: ReturnType<typeof useReady>['registerReady']
}) {
  const { maxHeight, minHeight, headerHeight, footerHeight } = useDimensions({
    controlledMaxHeight,
    headerRef,
    contentContainerRef,
    footerRef,
    registerReady,
  })

  const { snapPoints, minSnap, maxSnap } = processSnapPoints(
    ready
      ? getSnapPoints({
          height: heightRef.current,
          footerHeight,
          headerHeight,
          minHeight,
          maxHeight,
        })
      : [0],
    maxHeight
  )
  console.log({ snapPoints, minSnap, maxSnap })

  // @TODO investigate the gains from memoizing this
  function findSnap(
    numberOrCallback: number | ((state: defaultSnapProps) => number)
  ) {
    let unsafeSearch: number
    if (typeof numberOrCallback === 'function') {
      unsafeSearch = numberOrCallback({
        footerHeight,
        headerHeight,
        height: heightRef.current,
        minHeight,
        maxHeight,
        snapPoints,
        lastSnap: lastSnapRef.current,
      })
    } else {
      unsafeSearch = numberOrCallback
    }
    const querySnap = roundAndCheckForNaN(unsafeSearch)
    return snapPoints.reduce(
      (prev, curr) =>
        Math.abs(curr - querySnap) < Math.abs(prev - querySnap) ? curr : prev,
      minSnap
    )
  }

  useDebugValue(`minSnap: ${minSnap}, maxSnap:${maxSnap}`)

  return { minSnap, maxSnap, findSnap, maxHeight }
}

function useDimensions({
  headerRef,
  contentContainerRef,
  footerRef,
  controlledMaxHeight,
  registerReady,
}: {
  controlledMaxHeight?: number
  headerRef: React.RefObject<Element>
  contentContainerRef: React.RefObject<Element>
  footerRef: React.RefObject<Element>
  registerReady: ReturnType<typeof useReady>['registerReady']
}) {
  const setReady = useMemo(() => registerReady('contentHeight'), [
    registerReady,
  ])
  const maxHeight = useMaxHeight(controlledMaxHeight, registerReady)

  // Rewrite these to set refs and use nextTick
  const { height: headerHeight } = useElementSizeObserver(
    headerRef,
    'headerHeight'
  )
  const { height: contentHeight } = useElementSizeObserver(
    contentContainerRef,
    'contentHeight'
  )
  const { height: footerHeight } = useElementSizeObserver(
    footerRef,
    'footerHeight'
  )
  const minHeight =
    Math.min(maxHeight - headerHeight - footerHeight, contentHeight) +
    headerHeight +
    footerHeight

  useDebugValue(`minHeight: ${minHeight}`)

  const ready = contentHeight > 0
  useEffect(() => {
    if (ready) {
      setReady()
    }
  }, [ready, setReady])

  return {
    maxHeight,
    minHeight,
    headerHeight,
    footerHeight,
  }
}

/**
 * Hook for determining the size of an element using the Resize Observer API.
 *
 * @param ref - A React ref to an element
 */
function useElementSizeObserver(
  ref: React.RefObject<Element>,
  label: string
): { width: number; height: number } {
  let [size, setSize] = useState(() => ({ width: 0, height: 0 }))

  useDebugValue(`${label}: ${size.height}`)

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    setSize({
      // we only observe one element, so accessing the first entry here is fine
      width: entries[0].contentRect.width,
      height: entries[0].contentRect.height,
    })
  }, [])

  useEffect(() => {
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
function useMaxHeight(
  controlledMaxHeight,
  registerReady: ReturnType<typeof useReady>['registerReady']
) {
  const setReady = useMemo(() => registerReady('maxHeight'), [registerReady])
  const [maxHeight, setMaxHeight] = useState(() =>
    roundAndCheckForNaN(controlledMaxHeight) || typeof window !== 'undefined'
      ? window.innerHeight
      : 0
  )
  const ready = maxHeight > 0
  const raf = useRef(0)

  useDebugValue(controlledMaxHeight ? 'controlled' : 'auto')

  useEffect(() => {
    if (ready) {
      setReady()
    }
  }, [ready, setReady])

  useEffect(() => {
    // Bail if the max height is a controlled prop
    if (controlledMaxHeight) {
      setMaxHeight(roundAndCheckForNaN(controlledMaxHeight))

      return
    }

    const handleResize = () => {
      if (raf.current) {
        // bail to throttle the amount of resize changes
        return
      }

      // throttle state changes using rAF
      raf.current = requestAnimationFrame(() => {
        setMaxHeight(window.innerHeight)

        raf.current = 0
      })
    }
    window.addEventListener('resize', handleResize)
    setMaxHeight(window.innerHeight)
    setReady()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(raf.current)
    }
  }, [controlledMaxHeight, setReady])

  return maxHeight
}

function usePrevious<T>(value: T): T {
  const ref = useRef<T>(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

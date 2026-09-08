import React, {
  useCallback,
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  defaultSnapProps,
  MutableRef,
  ResizeSource,
  snapPoints,
} from '../types'
import { processSnapPoints, roundAndCheckForNaN } from '../utils'
import { useReady } from './useReady'
import { useLayoutEffect } from './useLayoutEffect'

export function useSnapPoints({
  contentRef,
  controlledMaxHeight,
  footerEnabled,
  footerRef,
  getSnapPoints,
  headerEnabled,
  headerRef,
  heightRef,
  lastSnapRef,
  ready,
  registerReady,
  resizeSourceRef,
}: {
  contentRef: React.RefObject<Element | null>
  controlledMaxHeight?: number
  footerEnabled: boolean
  footerRef: React.RefObject<Element | null>
  getSnapPoints: snapPoints
  headerEnabled: boolean
  headerRef: React.RefObject<Element | null>
  heightRef: React.RefObject<number>
  lastSnapRef: React.RefObject<number | null>
  ready: boolean
  registerReady: ReturnType<typeof useReady>['registerReady']
  resizeSourceRef: MutableRef<ResizeSource | undefined>
}) {
  const { maxHeight, minHeight, headerHeight, footerHeight } = useDimensions({
    contentRef,
    controlledMaxHeight,
    footerEnabled,
    footerRef,
    headerEnabled,
    headerRef,
    registerReady,
    resizeSourceRef,
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
  contentRef,
  controlledMaxHeight,
  footerEnabled,
  footerRef,
  headerEnabled,
  headerRef,
  registerReady,
  resizeSourceRef,
}: {
  contentRef: React.RefObject<Element | null>
  controlledMaxHeight?: number
  footerEnabled: boolean
  footerRef: React.RefObject<Element | null>
  headerEnabled: boolean
  headerRef: React.RefObject<Element | null>
  registerReady: ReturnType<typeof useReady>['registerReady']
  resizeSourceRef: MutableRef<ResizeSource | undefined>
}) {
  const setReady = useMemo(
    () => registerReady('contentHeight'),
    [registerReady]
  )
  const maxHeight = useMaxHeight(
    controlledMaxHeight,
    registerReady,
    resizeSourceRef
  )

  const headerHeight = useElementSizeObserver(headerRef, {
    label: 'headerHeight',
    enabled: headerEnabled,
    resizeSourceRef,
  })
  const contentHeight = useElementSizeObserver(contentRef, {
    label: 'contentHeight',
    enabled: true,
    resizeSourceRef,
  })
  const footerHeight = useElementSizeObserver(footerRef, {
    label: 'footerHeight',
    enabled: footerEnabled,
    resizeSourceRef,
  })
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

// Respond to changes to padding, happens often on iOS when using env(safe-area-inset-bottom)
// and the user hides or shows the Safari browser toolbar
const observerOptions: ResizeObserverOptions = { box: 'border-box' }

function borderBoxHeight(entry: ResizeObserverEntry): number {
  const boxSize = entry.borderBoxSize as unknown as
    ResizeObserverSize | ResizeObserverSize[] | undefined
  const size = Array.isArray(boxSize) ? boxSize[0] : boxSize
  if (size && typeof size.blockSize === 'number') {
    return size.blockSize
  }
  return entry.target.getBoundingClientRect().height
}

/**
 * Hook for determining the size of an element using the Resize Observer API.
 */
function useElementSizeObserver(
  ref: React.RefObject<Element | null>,
  {
    label,
    enabled,
    resizeSourceRef,
  }: {
    label: string
    enabled: boolean
    resizeSourceRef: MutableRef<ResizeSource | undefined>
  }
): number {
  const [size, setSize] = useState(0)

  useDebugValue(`${label}: ${size}`)

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      // we only observe one element, so accessing the first entry here is fine
      setSize(borderBoxHeight(entries[0]))
      resizeSourceRef.current = 'element'
    },
    [resizeSourceRef]
  )

  useLayoutEffect(() => {
    if (!ref.current || !enabled) {
      return
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(ref.current, observerOptions)

    return () => {
      resizeObserver.disconnect()
    }
  }, [ref, handleResize, enabled])

  return enabled ? size : 0
}

// Blazingly keep track of the current viewport height without blocking the thread, keeping that sweet 60fps on smartphones
function useMaxHeight(
  controlledMaxHeight: number | undefined,
  registerReady: ReturnType<typeof useReady>['registerReady'],
  resizeSourceRef: MutableRef<ResizeSource | undefined>
) {
  const setReady = useMemo(() => registerReady('maxHeight'), [registerReady])
  const [maxHeight, setMaxHeight] = useState(() => {
    if (controlledMaxHeight) {
      return roundAndCheckForNaN(controlledMaxHeight)
    }
    return typeof window !== 'undefined' ? window.innerHeight : 0
  })
  const ready = maxHeight > 0
  const raf = useRef(0)

  useDebugValue(controlledMaxHeight ? 'controlled' : 'auto')

  useEffect(() => {
    if (ready) {
      setReady()
    }
  }, [ready, setReady])

  useLayoutEffect(() => {
    // Bail if the max height is a controlled prop
    if (controlledMaxHeight) {
      setMaxHeight(roundAndCheckForNaN(controlledMaxHeight))
      resizeSourceRef.current = 'maxheightprop'

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
        resizeSourceRef.current = 'window'

        raf.current = 0
      })
    }
    window.addEventListener('resize', handleResize)
    setMaxHeight(window.innerHeight)
    resizeSourceRef.current = 'window'
    setReady()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(raf.current)
    }
  }, [controlledMaxHeight, setReady, resizeSourceRef])

  return maxHeight
}

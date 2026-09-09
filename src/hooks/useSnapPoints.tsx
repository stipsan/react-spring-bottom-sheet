import React, { useCallback, useDebugValue, useRef, useState } from 'react'
import type {
  defaultSnapProps,
  MutableRef,
  ResizeSource,
  snapPoints,
} from '../types'
import { processSnapPoints, roundAndCheckForNaN } from '../utils'
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
  resizeSourceRef: MutableRef<ResizeSource | undefined>
}) {
  const { maxHeight, minHeight, headerHeight, footerHeight, ready } =
    useDimensions({
      contentRef,
      controlledMaxHeight,
      footerEnabled,
      footerRef,
      headerEnabled,
      headerRef,
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

  return { minSnap, maxSnap, findSnap, maxHeight, ready }
}

function useDimensions({
  contentRef,
  controlledMaxHeight,
  footerEnabled,
  footerRef,
  headerEnabled,
  headerRef,
  resizeSourceRef,
}: {
  contentRef: React.RefObject<Element | null>
  controlledMaxHeight?: number
  footerEnabled: boolean
  footerRef: React.RefObject<Element | null>
  headerEnabled: boolean
  headerRef: React.RefObject<Element | null>
  resizeSourceRef: MutableRef<ResizeSource | undefined>
}) {
  const maxHeight = useMaxHeight(controlledMaxHeight, resizeSourceRef)

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

  return {
    maxHeight,
    minHeight,
    headerHeight,
    footerHeight,
    // Nothing can be measured or animated until the viewport and the content have a size.
    // Deriving this instead of tracking it in state saves a render pass per measurement.
    ready: maxHeight > 0 && contentHeight > 0,
  }
}

// Respond to changes to padding, happens often on iOS when using env(safe-area-inset-bottom)
// And the user hides or shows the Safari browser toolbar
const observerOptions: ResizeObserverOptions = { box: 'border-box' }

function borderBoxHeight(entry: ResizeObserverEntry): number {
  const boxSize = entry.borderBoxSize as unknown as
    | ResizeObserverSize
    | ResizeObserverSize[]
    | undefined
  const size = Array.isArray(boxSize) ? boxSize[0] : boxSize
  if (size && typeof size.blockSize === 'number') {
    return size.blockSize
  }
  return entry.target.getBoundingClientRect().height
}

/**
 * Hook for determining the size of an element using the Resize Observer API.
 *
 * @param ref - A React ref to an element
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
  resizeSourceRef: MutableRef<ResizeSource | undefined>
) {
  const [maxHeight, setMaxHeight] = useState(() => {
    if (controlledMaxHeight) {
      return roundAndCheckForNaN(controlledMaxHeight)
    }
    return typeof window !== 'undefined' ? window.innerHeight : 0
  })
  const raf = useRef(0)

  useDebugValue(controlledMaxHeight ? 'controlled' : 'auto')

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

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(raf.current)
    }
  }, [controlledMaxHeight, resizeSourceRef])

  return maxHeight
}

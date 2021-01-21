import React, {
  useCallback,
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ResizeObserver, ResizeObserverEntry } from '@juggle/resize-observer'
import type { defaultSnapProps, ResizeSource, snapPoints } from '../types'
import { processSnapPoints, roundAndCheckForNaN } from '../utils'
import { useReady } from './useReady'
import { ResizeObserverOptions } from '@juggle/resize-observer/lib/ResizeObserverOptions'
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
  contentRef: React.RefObject<Element>
  controlledMaxHeight?: number
  footerEnabled: boolean
  footerRef: React.RefObject<Element>
  getSnapPoints: snapPoints
  headerEnabled: boolean
  headerRef: React.RefObject<Element>
  heightRef: React.RefObject<number>
  lastSnapRef: React.RefObject<number>
  ready: boolean
  registerReady: ReturnType<typeof useReady>['registerReady']
  resizeSourceRef: React.MutableRefObject<ResizeSource>
}) {
  const { maxHeight, minHeight, headerHeight, footerHeight } = useDimensions({
    contentRef: contentRef,
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
  //console.log({ snapPoints, minSnap, maxSnap })

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
  contentRef,
  controlledMaxHeight,
  footerEnabled,
  footerRef,
  headerEnabled,
  headerRef,
  registerReady,
  resizeSourceRef,
}: {
  contentRef: React.RefObject<Element>
  controlledMaxHeight?: number
  footerEnabled: boolean
  footerRef: React.RefObject<Element>
  headerEnabled: boolean
  headerRef: React.RefObject<Element>
  registerReady: ReturnType<typeof useReady>['registerReady']
  resizeSourceRef: React.MutableRefObject<ResizeSource>
}) {
  const setReady = useMemo(() => registerReady('contentHeight'), [
    registerReady,
  ])
  const maxHeight = useMaxHeight(
    controlledMaxHeight,
    registerReady,
    resizeSourceRef
  )

  // @TODO probably better to forward props instead of checking refs to decide if it's enabled
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

const observerOptions: ResizeObserverOptions = {
  // Respond to changes to padding, happens often on iOS when using env(safe-area-inset-bottom)
  // And the user hides or shows the Safari browser toolbar
  box: 'border-box',
}
/**
 * Hook for determining the size of an element using the Resize Observer API.
 *
 * @param ref - A React ref to an element
 */
function useElementSizeObserver(
  ref: React.RefObject<Element>,
  {
    label,
    enabled,
    resizeSourceRef,
  }: {
    label: string
    enabled: boolean
    resizeSourceRef: React.MutableRefObject<ResizeSource>
  }
): number {
  let [size, setSize] = useState(0)

  useDebugValue(`${label}: ${size}`)

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      // we only observe one element, so accessing the first entry here is fine
      setSize(entries[0].borderBoxSize[0].blockSize)
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
  controlledMaxHeight,
  registerReady: ReturnType<typeof useReady>['registerReady'],
  resizeSourceRef: React.MutableRefObject<ResizeSource>
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

import React, {
  useCallback,
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import { roundAndCheckForNaN } from '../utils'
import { useReady } from './useReady'

export function useDimensions({
  headerRef,
  contentRef,
  footerRef,
  controlledMaxHeight,
  registerReady,
}: {
  controlledMaxHeight?: number
  headerRef: React.RefObject<Element>
  contentRef: React.RefObject<Element>
  footerRef: React.RefObject<Element>
  registerReady: ReturnType<typeof useReady>['registerReady']
}) {
  const setReady = useMemo(() => registerReady('contentHeight'), [
    registerReady,
  ])
  const maxHeight = useMaxHeight(controlledMaxHeight, registerReady)

  // Rewrite these to set refs and use nextTick
  const { height: headerHeight } = useElementSizeObserver(headerRef)
  const { height: contentHeight } = useElementSizeObserver(contentRef)
  const { height: footerHeight } = useElementSizeObserver(footerRef)
  const minHeight =
    Math.min(maxHeight - headerHeight - footerHeight, contentHeight) +
    headerHeight +
    footerHeight

  const ready = contentHeight > 0
  useEffect(() => {
    if (ready) {
      setReady()
    }
  }, [ready, setReady])

  useDebugValue(`minHeight: ${minHeight}`)
  useDebugValue(`contentHeight: ${contentHeight}`)
  useDebugValue(`headerHeight: ${headerHeight}`)
  useDebugValue(`footerHeight: ${footerHeight}`)

  return {
    maxHeight,
    minHeight,
    contentHeight,
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

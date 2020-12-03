import React, { useCallback, useDebugValue, useEffect, useState } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

export const useDimensions = ({
  maxHeight,
  headerRef,
  contentRef,
  footerRef,
}: {
  maxHeight: number
  headerRef: React.RefObject<Element>
  contentRef: React.RefObject<Element>
  footerRef: React.RefObject<Element>
}) => {
  // Rewrite these to set refs and use nextTick
  const { height: headerHeight } = useElementSizeObserver(headerRef)
  const { height: contentHeight } = useElementSizeObserver(contentRef)
  const { height: footerHeight } = useElementSizeObserver(footerRef)
  const minHeight =
    Math.min(maxHeight - headerHeight - footerHeight, contentHeight) +
    headerHeight +
    footerHeight

  useDebugValue(`minHeight: ${minHeight}`)
  useDebugValue(`contentHeight: ${contentHeight}`)
  useDebugValue(`headerHeight: ${headerHeight}`)
  useDebugValue(`footerHeight: ${footerHeight}`)

  return {
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

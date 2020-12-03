import { useEffect, useRef, useState } from 'react'

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

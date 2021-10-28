// Keeps track of the max height, which might be the window.innerHeight or the maxHeight prop
// @TODO check if potential scrollbars that are included in window.innerHeight is a problem

import { roundAndCheckForNaN } from '../utils'
import { useLayoutEffect } from './useLayoutEffect'
import type { SheetEvent } from './useStateMachine'

export function useMaxHeight(maxHeightProp, send: (event: SheetEvent) => void) {
  useLayoutEffect(() => {
    // Bail if the max height is a controlled prop
    if (maxHeightProp) {
      send({
        type: 'MAX_HEIGHT_FROM_PROP',
        value: roundAndCheckForNaN(maxHeightProp),
      })

      return
    }

    let raf: ReturnType<typeof requestAnimationFrame>
    const handleResize = () => {
      cancelAnimationFrame(raf)
      // throttle state changes using rAF
      raf = requestAnimationFrame(() => {
        send({ type: 'MAX_HEIGHT_FROM_WINDOW', value: window.innerHeight })
      })
    }
    window.addEventListener('resize', handleResize)
    send({ type: 'MAX_HEIGHT_FROM_WINDOW', value: window.innerHeight })

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(raf)
    }
  }, [maxHeightProp, send])
}

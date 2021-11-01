// Keeps track of the max height, which might be the window.innerHeight or the maxHeight prop
// @TODO check if potential scrollbars that are included in window.innerHeight is a problem

import { useLayoutEffect } from './useLayoutEffect'
import type { ModeEvent } from '../machines/mode'

export function useMaxHeight(maxHeightProp, send: (event: ModeEvent) => void) {
  useLayoutEffect(() => {
    // Bail if the max height is a controlled prop
    if (maxHeightProp) {
      send({ type: 'MAX_HEIGHT', value: maxHeightProp })

      return
    }
    send({ type: 'ENABLE_MAX_HEIGHT_FROM_WINDOW' })
  }, [maxHeightProp, send])
}

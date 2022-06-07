import type { BottomSheetMachineHook } from '@bottom-sheet/react-hooks'
import { useSpring as useReactSpring } from '@react-spring/web'

// Behold, the engine of it all!
// Put in this file befause it makes it easier to type and I'm lazy! :D

export function useSpring({
  getTransientSnapshot,
}: Pick<BottomSheetMachineHook, 'getTransientSnapshot'>) {
  // @TODO how often is the hook calling the getter?
  return useReactSpring(() => ({
    height: 0,
    maxHeight: 0,
    minSnap: 0,
    maxSnap: 0,
    // An experimental new technique that aims to buffer the next height while dragging
    // to reduce animating the `height` property to a bare minimum.
    // Effectively building on the technique used to ensure values outside minSnap and maxSnap are done on `transform: translateY()`
    bufferSnap: 0,
    // These are only used for debugging the drag handler
    debug__predictedHeight: 0,
    debug__predictedSnapPoint: 0,
  }))
}

export type Spring = ReturnType<typeof useSpring>[0]
export type SpringSet = ReturnType<typeof useSpring>[1]

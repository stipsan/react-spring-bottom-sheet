/**
 * Handles SpringEvent: SNAP events. These events happen when a drag operation ends,
 * a forwarded ref.current.snapTo was called, or when the list over snapPoints
 * has changed due to a change like window resize or content changes in the sheet itself.
 *
 * Dealing with SNAP events are far more complex than OPEN or CLOSE events.
 * Namely, when OPEN happens then the starting point is always 0 height to `defaultSnap`.
 * Same is true with CLOSE, it's just a transition from current height to 0.
 * SNAP however has to deal with:
 * 1. Asking for an updated list of snapPoints.
 * 2. Check if the new snap point is valid in the possibly updated list.
 * 3. If it isn't it needs to adjust the snap point to the value closest to it.
 * 4. Check if minSnap has changed, as the minSnap value affects the sticky footer position.
 * 5. Check if maxSnap has changed, as it affects the rubber band effect when you drag out of bounds.
 * 6. During the transition the minSnap and maxSnap values needs to fit both the old and new snap point coordination.
 * 7. After the transition has ended, minSnap and maxSnap values should be updated with the correct values.
 *
 * It's important to respond to changes in variables like:
 * - maxHeight
 * - headerHeight
 * - footerHeight
 * - contentHeight
 * - snapPoints (the callback provided as a prop)
 *
 * But it shouldn't happen while dragging as it's jarring user experience
 * as the sheet is blinking around and suddenly respond to new boudaries as
 * drag operations are done without transitions between states.
 * These state changes needs to happen after dragging, on a snap event.
 * Thus OPEN and CLOSE handlers should always have access to the latest values.
 * But when dragging it should be "frozen" until dragging ends, and the drag operation
 * decides what to do next. It might trigger a cancel op or onDismiss, but most of the time
 * it asks for a snapTo event.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSnapPoints, useSpring } from './index'

export function useSnapResponder({
  maxHeight,
  minSnap,
  maxSnap,
  draggingRef,
  heightRef,
  lastSnapRef,
  prefersReducedMotion,
  findSnap,
  set,
}: {
  maxHeight: number
  minSnap: number
  maxSnap: number
  draggingRef: React.RefObject<boolean>
  heightRef: React.MutableRefObject<number>
  lastSnapRef: React.MutableRefObject<number>
  prefersReducedMotion: React.MutableRefObject<boolean>
  findSnap: ReturnType<typeof useSnapPoints>['findSnap']
  set: ReturnType<typeof useSpring>[1]
}) {
  const [, tick] = useState(0)
  const updateSnap = useCallback(() => {
    updatedRef.current = false
    tick((_) => ++_)
  }, [])
  const updatedRef = useRef(false)
  const observeBoundsRef = useRef(false)

  const maxHeightRef = useRef(maxHeight)
  const minSnapRef = useRef(minSnap)
  const maxSnapRef = useRef(maxSnap)

  // Respond to snap point boundaries affecting how the sheet renders
  useEffect(() => {
    if (!draggingRef.current) {
      if (maxHeightRef.current !== maxHeight) {
        console.log('maxHeight changed!')
        maxSnapRef.current = maxHeight
      }
      if (maxSnapRef.current !== maxSnap) {
        maxSnapRef.current = maxSnap
        console.log('maxSnap changed!')
      }
      if (minSnapRef.current !== minSnap) {
        console.log('minSnap changed!')
        minSnapRef.current = minSnap
      }
      updateSnap()
    }
  }, [draggingRef, maxHeight, updateSnap, minSnap, maxSnap])

  // Respond to requests to snap
  useEffect(() => {
    if (tick && observeBoundsRef.current && !draggingRef.current) {
      console.log({ heightRef: heightRef.current })

      const snap = findSnap(heightRef.current)
      console.log({ snap })
      heightRef.current = snap
      lastSnapRef.current = snap
      set({ y: snap, immediate: prefersReducedMotion.current })
    }
  }, [draggingRef, findSnap, heightRef, lastSnapRef, prefersReducedMotion, set])

  return {
    maxHeightRef,
    minSnapRef,
    maxSnapRef,
    updateSnap,
    observeBoundsRef,
  }
}

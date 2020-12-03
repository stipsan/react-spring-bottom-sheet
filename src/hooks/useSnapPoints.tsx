import { useDebugValue } from 'react'
import type { defaultSnapProps, SnapPointProps, snapPoints } from '../types'
import { processSnapPoints, roundAndCheckForNaN } from '../utils'

export function useSnapPoints({
  getSnapPoints,
  minHeight,
  footerHeight,
  headerHeight,
  heightRef,
  lastSnapRef,
  maxHeight,
  ready,
}: {
  getSnapPoints: snapPoints
  heightRef: React.RefObject<number>
  lastSnapRef: React.RefObject<number>
  // If ready then all the elements that need measuring is done and ready for computing
  ready: boolean
} & Omit<SnapPointProps, 'height'>) {
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
  console.log({ snapPoints, minSnap, maxSnap })

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
    return snapPoints.reduce((prev, curr) =>
      Math.abs(curr - querySnap) < Math.abs(prev - querySnap) ? curr : prev
    )
  }

  useDebugValue(snapPoints, (snapPoints) => snapPoints.sort())

  return { minSnap, maxSnap, findSnap }
}

import { useDebugValue } from 'react'
import type { defaultSnapProps, SnapPointProps, snapPoints } from '../types'
import { clamp, roundAndCheckForNaN } from '../utils'

export function useSnapPoints({
  getSnapPoints,
  minHeight,
  footerHeight,
  headerHeight,
  contentHeight,
  heightRef,
  lastSnapRef,
  maxHeight,
}: {
  getSnapPoints: snapPoints
  contentHeight: number
  heightRef: React.RefObject<number>
  lastSnapRef: React.RefObject<number>
} & Omit<SnapPointProps, 'height'>) {
  // @TODO cleanup
  function _getSnaps() {
    // If we're firing before the dom is mounted then height will be 0 and we should return default values
    if (contentHeight === 0) {
      return { snapPoints: [0], minSnap: 0, maxSnap: 0 }
    }

    const massagedSnapPoints = []
      .concat(
        getSnapPoints({
          height: heightRef.current,
          footerHeight,
          headerHeight,
          minHeight,
          maxHeight,
        })
      )
      .map(roundAndCheckForNaN)

    const snapPoints = [
      ...massagedSnapPoints.reduce((acc, snapPoint) => {
        acc.add(clamp(snapPoint, 0, maxHeight))
        return acc
      }, new Set<number>()),
    ]

    return {
      snapPoints,
      minSnap: Math.min(...snapPoints),
      maxSnap: Math.max(...snapPoints),
    }
  }

  const { snapPoints, minSnap, maxSnap } = _getSnaps()

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

  return { snapPoints, minSnap, maxSnap, findSnap }
}

import { useDebugValue } from 'react'
import type { SnapPointProps, snapPoints } from '../types'
import { clamp, roundAndCheckForNaN } from '../utils'

export const useSnapPoints = ({
  getSnapPoints,
  minHeight,
  footerHeight,
  headerHeight,
  contentHeight,
  height,
  maxHeight,
}: {
  getSnapPoints: snapPoints
  contentHeight: number
} & SnapPointProps) => {
  // @TODO cleanup
  function _getSnaps() {
    // If we're firing before the dom is mounted then height will be 0 and we should return default values
    if (contentHeight === 0) {
      return { snapPoints: [0], minSnap: 0, maxSnap: 0 }
    }

    const massagedSnapPoints = []
      .concat(
        getSnapPoints({
          height,
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

  // @TODO Extract the snap points logic to a separate function that can be unit tested
  // @TODO replace this with simpler logic: https://stackoverflow.com/a/19277804
  const { snapPoints, minSnap, maxSnap } = _getSnaps()

  const toSnapPoint = (rawY: number) => {
    const y = roundAndCheckForNaN(rawY)
    return snapPoints.reduce(
      (prev, curr) => (Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev),
      minSnap
    )
  }

  useDebugValue(snapPoints, (snapPoints) => snapPoints.sort())

  return { snapPoints, minSnap, maxSnap, toSnapPoint }
}

/* eslint-disable no-self-compare */

// stolen from lodash
export function clamp(number: number, lower: number, upper: number) {
  number = +number
  lower = +lower
  upper = +upper
  lower = lower === lower ? lower : 0
  upper = upper === upper ? upper : 0
  if (number === number) {
    number = number <= upper ? number : upper
    number = number >= lower ? number : lower
  }
  return number
}

// Mwahaha easiest way to filter out NaN I ever saw! >:3
export function deleteNaN(arr) {
  const set = new Set(arr)
  set.delete(NaN)
  return [...set]
}

export function roundAndCheckForNaN(unrounded) {
  const rounded = Math.round(unrounded)
  if (Number.isNaN(unrounded)) {
    throw new TypeError(
      'Found a NaN! Check your snapPoints / defaultSnap / snapTo '
    )
  }

  return rounded
}

// Validate, sanitize, round and dedupe snap points, as well as extracting the minSnap and maxSnap points
export function processSnapPoints(unsafeSnaps: number | number[], maxHeight) {
  const safeSnaps = [].concat(unsafeSnaps).map(roundAndCheckForNaN)

  const snapPoints = [
    ...safeSnaps.reduce((acc, snapPoint) => {
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

import type { Spring } from './useSpring'
import { clamp } from '../utils'

// It's a bit easier to ensure interpolations don't accidentally use the wrong variables by
// putting them here, in their own closure with explicitly defined variables used

// Note that the callbacks in the interpolation functions close over their scope every time react renders
// so it's important that if anything can change outside of render that needs to be available
// in the interpolation then a ref must be used

// @TODO retire this constant and implement true rubberbanding
// How many pixels above the viewport height the user is allowed to drag the bottom sheet
const MAX_OVERFLOW = 120

export function useSpringInterpolations({
  maxHeight,
  maxSnap,
  minSnap,
  spring,
}: {
  maxHeight: number
  maxSnap: number
  minSnap: number
  spring: Spring
}): React.CSSProperties {
  // This effect is for removing rounded corners on phones when the sheet touches the top of the browser chrome
  // as it's really ugly with the gaps border radius creates. This ensures it looks sleek.
  // @TODO the ts-ignore comments are because the `extrapolate` param isn't in the TS defs for some reason
  const interpolateBorderRadius =
    maxHeight !== maxSnap
      ? undefined
      : // @ts-expect-error
        spring.y.interpolate({
          // @TODO change 16 hardcoded value to a dynamic/detected one
          range: [maxHeight - 16, maxHeight],
          output: ['16px', '0px'],
          extrapolate: 'clamp',
          map: Math.round,
        })

  /*
   * Only animate the height when absolute necessary
   * @TODO currently it's only able to opt out of changing the height if there's just a single snapshot
   *       but it should be possible to do it in other scenarios too, like on window resize,
   *       or maybe even while dragging, but probably requires a more restrictive CSS.
   *       As in now the sticky footer isn't overlapping the content, allowing `backdrop-filter: blur(8px)` effects.
   *       A FLIP resize flow for content height would likely require the sticky elements to overlap the content area.
   *       Could be done as a separat mode though, or a separate example CSS for max performance.
   */
  const interpolateHeight = spring.y.interpolate(
    (y: number) => `${clamp(y, minSnap, maxSnap)}px`
  )

  const interpolateY = spring.y.interpolate({
    range: [0, minSnap, maxSnap, maxSnap + MAX_OVERFLOW],
    output: [`${minSnap}px`, '0px', '0px', `${-MAX_OVERFLOW}px`],
  })

  const interpolateFiller = spring.y
    .interpolate({
      range: [0, maxSnap, maxSnap + MAX_OVERFLOW],
      output: [0, 0, MAX_OVERFLOW],
    })
    // Rounding up prevents subpixel gaps that can happen since we use fractions in translateY for a smooth animation
    .interpolate(Math.ceil)

  const interpolateContentOpacity = spring.y.interpolate({
    range: [
      0,
      Math.max(minSnap / 2 - 45, 0),
      Math.min(minSnap / 2 + 45, minSnap),
      minSnap,
    ],
    output: [0, 0, 1, 1],
  })

  return {
    // Fancy content fade-in effect
    ['--rsbs-content-opacity' as any]: interpolateContentOpacity,
    // Fading in the backdrop
    ['--rsbs-backdrop-opacity' as any]: spring.backdrop,
    // Scaling the antigap in the bottom
    ['--rsbs-antigap-scale-y' as any]: interpolateFiller,
    // Shifts the position of the bottom sheet, used on open and close primarily as snap point changes usually only interpolate the height
    ['--rsbs-overlay-translate-y' as any]: interpolateY,
    // Remove rounded borders when full height, it looks much better this way
    ['--rsbs-overlay-rounded' as any]: interpolateBorderRadius,
    // Animates the height state, not the most performant way but it's the safest with regards to mobile browser and focus/scrolling that could happen while animating
    ['--rsbs-overlay-h' as any]: interpolateHeight,
  }
}

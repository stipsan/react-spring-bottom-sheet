import { interpolate } from 'react-spring'
import type { OpaqueInterpolation } from 'react-spring'
import type { Spring } from './useSpring'
import { clamp, toPx } from '../utils'

// It's a bit easier to ensure interpolations don't accidentally use the wrong variables by
// putting them here, in their own closure with explicitly defined variables used

// Note that the callbacks in the interpolation functions close over their scope every time react renders
// so it's important that if anything can change outside of render that needs to be available
// in the interpolation then a ref must be used

export function useSpringInterpolations({
  spring,
}: {
  spring: Spring
}): React.CSSProperties {
  // This effect is for removing rounded corners on phones when the sheet touches the top of the browser chrome
  // as it's really ugly with the gaps border radius creates. This ensures it looks sleek.
  const interpolateOverlayRounded = interpolate(
    [spring.y, spring.maxHeight as OpaqueInterpolation<number>],
    (y, maxHeight) => {
      return `${Math.round(clamp(maxHeight - y, 0, 16))}px`
    }
  )

  /*
   * Only animate the height when absolute necessary
   * @TODO currently it's only able to opt out of changing the height if there's just a single snapshot
   *       but it should be possible to do it in other scenarios too, like on window resize,
   *       or maybe even while dragging, but probably requires a more restrictive CSS.
   *       As in now the sticky footer isn't overlapping the content, allowing `backdrop-filter: blur(8px)` effects.
   *       A FLIP resize flow for content height would likely require the sticky elements to overlap the content area.
   *       Could be done as a separat mode though, or a separate example CSS for max performance.
   */
  const interpolateOverlayHeight = interpolate(
    [spring.y, spring.minSnap, spring.maxSnap],
    (y, minSnap, maxSnap) => `${clamp(y, minSnap, maxSnap)}px`
  )

  const interpolateOverlayTranslateY = interpolate(
    [spring.y, spring.minSnap, spring.maxSnap],
    (y, minSnap, maxSnap) => {
      if (y < minSnap) {
        return `${minSnap - y}px`
      }
      if (y > maxSnap) {
        return `${maxSnap - y}px`
      }
      return '0px'
    }
  )

  const interpolateAntigapScaleY = interpolate(
    [spring.y, spring.maxSnap],
    (y, maxSnap) => {
      if (y >= maxSnap) {
        return Math.ceil(y - maxSnap)
      }
      return 0
    }
  )

  const interpolateContentOpacity = interpolate(
    [spring.y, spring.minSnap],
    (y, minSnap) => {
      const minX = Math.max(minSnap / 2 - 45, 0)
      const maxX = Math.min(minSnap / 2 + 45, minSnap)
      const minY = 0
      const maxY = 1

      const slope = (maxY - minY) / (maxX - minX)
      const res = (y - minX) * (slope + minY)
      return clamp(res, 0, 1)
    }
  )

  const interpolateBackdropOpacity = interpolate(
    [spring.y, spring.minSnap],
    (y, minSnap) => clamp(y / minSnap, 0, 1)
  )

  return {
    // Scaling the antigap in the bottom when dragging out of bounds
    ['--rsbs-antigap-scale-y' as any]: interpolateAntigapScaleY,
    // Fading in the backdrop when below the fold
    ['--rsbs-backdrop-opacity' as any]: interpolateBackdropOpacity,
    // Fancy content fade-in effect as it gets below the fold
    ['--rsbs-content-opacity' as any]: interpolateContentOpacity,
    // Animates the height state when y is somewhere between min/max snap, not the most performant way but it's the safest with regards to mobile browser and focus/scrolling that could happen while animating
    ['--rsbs-overlay-h' as any]: interpolateOverlayHeight,
    // Remove rounded borders when full height, it looks much better this way
    ['--rsbs-overlay-rounded' as any]: interpolateOverlayRounded,
    // Shifts the position of the bottom sheet, used on open and close primarily as snap point changes usually only interpolate the height
    ['--rsbs-overlay-translate-y' as any]: interpolateOverlayTranslateY,
    // Expose spring state to allow more advanced CSS customizations
    ['--rsbs-state-max-h' as any]: spring.maxHeight.interpolate(toPx),
    ['--rsbs-state-max-snap' as any]: spring.maxSnap.interpolate(toPx),
    ['--rsbs-state-min-snap' as any]: spring.minSnap.interpolate(toPx),
    ['--rsbs-state-y' as any]: spring.y.interpolate(toPx),
  }
}

import { useMemo } from 'react'
import { to } from '@react-spring/web'
import type { Spring } from './useSpring'
import { clamp } from '../utils'

// It's a bit easier to ensure interpolations don't accidentally use the wrong variables by
// putting them here, in their own closure with explicitly defined variables used.
// The SpringValue instances are stable for the lifetime of the component, so the derived
// interpolations only need to be created once.

export function useSpringInterpolations({
  spring,
}: {
  spring: Spring
}): React.CSSProperties {
  const { y, maxHeight, minSnap, maxSnap } = spring

  return useMemo(() => {
    // Removes rounded corners on phones when the sheet touches the top of the browser chrome
    const interpolateBorderRadius = to(
      [y, maxHeight],
      (y, maxHeight) => `${Math.round(clamp(maxHeight - y, 0, 16))}px`
    )

    // Only animate the height when absolutely necessary
    const interpolateHeight = to(
      [y, minSnap, maxSnap],
      (y, minSnap, maxSnap) => `${clamp(y, minSnap, maxSnap)}px`
    )

    const interpolateY = to([y, minSnap, maxSnap], (y, minSnap, maxSnap) => {
      if (y < minSnap) {
        return `${minSnap - y}px`
      }
      if (y > maxSnap) {
        return `${maxSnap - y}px`
      }
      return '0px'
    })

    const interpolateFiller = to([y, maxSnap], (y, maxSnap) =>
      y >= maxSnap ? Math.ceil(y - maxSnap) : 0
    )

    const interpolateContentOpacity = to([y, minSnap], (y, minSnap) => {
      if (!minSnap) {
        return 0
      }
      const minX = Math.max(minSnap / 2 - 45, 0)
      const maxX = Math.min(minSnap / 2 + 45, minSnap)
      const slope = 1 / (maxX - minX)
      return clamp((y - minX) * slope, 0, 1)
    })

    const interpolateBackdrop = to([y, minSnap], (y, minSnap) =>
      minSnap ? clamp(y / minSnap, 0, 1) : 0
    )

    return {
      // Fancy content fade-in effect
      ['--rsbs-content-opacity' as any]: interpolateContentOpacity,
      // Fading in the backdrop
      ['--rsbs-backdrop-opacity' as any]: interpolateBackdrop,
      // Scaling the antigap in the bottom
      ['--rsbs-antigap-scale-y' as any]: interpolateFiller,
      // Shifts the position of the bottom sheet, used on open and close primarily as snap point changes usually only interpolate the height
      ['--rsbs-overlay-translate-y' as any]: interpolateY,
      // Remove rounded borders when full height, it looks much better this way
      ['--rsbs-overlay-rounded' as any]: interpolateBorderRadius,
      // Animates the height state, not the most performant way but it's the safest with regards to mobile browser and focus/scrolling that could happen while animating
      ['--rsbs-overlay-h' as any]: interpolateHeight,
    }
  }, [y, maxHeight, minSnap, maxSnap])
}

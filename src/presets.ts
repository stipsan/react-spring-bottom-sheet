import { easings } from '@react-spring/web'
import type { SpringConfig } from './types'

/**
 * Ready made values for the `springConfig` prop.
 *
 * A note on how react-spring reads these: when `duration` is set it runs a tween and
 * ignores `tension`, `friction`, `mass` and `velocity` entirely. Only a config without
 * `duration` reaches the spring solver, which is why `springy` sets it to undefined.
 *
 * The floor for any duration is one frame. react-spring advances the first frame with a
 * fixed 16.667ms delta, so anything at or below that finishes instantly. It also caps a
 * frame's progress at 64ms, so on a device that stutters the animation stretches in real
 * time rather than jumping.
 */

/** Solves a CSS style `cubic-bezier(x1, y1, x2, y2)` curve, which react-spring has no helper for. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const axis = (a: number, b: number, t: number) => {
    const u = 1 - t
    return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t
  }
  return (progress: number) => {
    if (progress <= 0) return 0
    if (progress >= 1) return 1
    let lo = 0
    let hi = 1
    let t = progress
    for (let i = 0; i < 20; i++) {
      const x = axis(x1, x2, t)
      if (Math.abs(x - progress) < 1e-4) break
      if (x < progress) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return axis(y1, y2, t)
  }
}

/** The historical default. A linear tween, so it starts and stops abruptly. */
export const linear: Partial<SpringConfig> = {
  duration: 115,
}

/**
 * Same pace, but eased so it leaves quickly and settles instead of stopping dead.
 *
 * The longer duration is not a slower animation. `easeOutCubic` front loads the distance:
 * it covers 90% of the travel in 54% of its duration, against 90% in 90% for a linear
 * tween. 190ms here reaches 90% at the same moment 115ms linear does, so it reads as the
 * same speed with a softer landing.
 */
export const eased: Partial<SpringConfig> = {
  duration: 190,
  easing: easings.easeOutCubic,
}

/**
 * Material 3's motion for a surface entering the screen, for apps that sit next to
 * Material components and should not feel faster or slower than the rest of them.
 *
 * 300ms is `md.sys.motion.duration.medium2` and the curve is `emphasized.decelerate`,
 * both taken from Google's own token repository. Noticeably more deliberate than the
 * default, which sits between M3's short2 and short3, the range meant for small controls
 * rather than a full width sheet.
 */
export const material: Partial<SpringConfig> = {
  duration: 300,
  easing: cubicBezier(0.05, 0.7, 0.1, 1),
}

/**
 * Actual spring physics, which is what this library was built on.
 *
 * Unlike the tweens, the speed follows the distance travelled and the velocity of your
 * drag, so a short snap is quick and a long one carries momentum. Costs a little overshoot.
 */
export const springy: Partial<SpringConfig> = {
  duration: undefined,
  tension: 210,
  friction: 26,
}

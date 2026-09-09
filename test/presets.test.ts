import { describe, expect, it } from 'vitest'
import { cubicBezier, eased, linear, material, springy } from '../src/presets'

/** First progress value at which the curve has covered `fraction` of the travel */
function timeToFraction(easing: (t: number) => number, fraction: number) {
  for (let p = 0; p <= 1; p += 0.0005) {
    if (easing(p) >= fraction) return p
  }
  return 1
}

describe('cubicBezier', () => {
  it('is pinned at both ends', () => {
    const curve = cubicBezier(0.05, 0.7, 0.1, 1)
    expect(curve(0)).toBe(0)
    expect(curve(1)).toBe(1)
    expect(curve(-1)).toBe(0)
    expect(curve(2)).toBe(1)
  })

  it('reproduces linear for the identity curve', () => {
    const curve = cubicBezier(0, 0, 1, 1)
    for (const p of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(curve(p)).toBeCloseTo(p, 2)
    }
  })

  it('never goes backwards', () => {
    const curve = cubicBezier(0.05, 0.7, 0.1, 1)
    let previous = 0
    for (let p = 0; p <= 1; p += 0.01) {
      const value = curve(p)
      expect(value).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = value
    }
  })

  it('decelerates, so most of the travel happens early', () => {
    const curve = cubicBezier(0.05, 0.7, 0.1, 1)
    expect(curve(0.25)).toBeGreaterThan(0.75)
  })
})

describe('presets', () => {
  it('only the spring one reaches the spring solver', () => {
    // react-spring runs a tween whenever duration is set, ignoring tension and friction
    expect(linear.duration).toBeDefined()
    expect(eased.duration).toBeDefined()
    expect(material.duration).toBeDefined()
    expect(springy.duration).toBeUndefined()
    expect(springy.tension).toBeDefined()
  })

  it('every duration clears the one frame floor', () => {
    // react-spring advances the first frame with a fixed 16.667ms delta
    for (const preset of [linear, eased, material]) {
      expect(preset.duration).toBeGreaterThan(16.667)
    }
  })

  it('the eased and material recipes match linear where it is noticed', () => {
    // linear covers 90% of the travel in 90% of its duration
    const linearAt90 = 0.9 * linear.duration!

    const easedAt90 = timeToFraction(eased.easing!, 0.9) * eased.duration!
    const materialAt90 =
      timeToFraction(material.easing!, 0.9) * material.duration!

    // within 15ms of each other, so none of them reads as slower than the default
    expect(Math.abs(easedAt90 - linearAt90)).toBeLessThan(15)
    expect(Math.abs(materialAt90 - linearAt90)).toBeLessThan(15)

    // and both still take longer overall, which is the soft landing
    expect(eased.duration!).toBeGreaterThan(linear.duration!)
    expect(material.duration!).toBeGreaterThan(linear.duration!)
  })
})

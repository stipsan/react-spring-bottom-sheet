import { describe, expect, it } from 'vitest'
import {
  clamp,
  processSnapPoints,
  roundAndCheckForNaN,
  rubberbandIfOutOfBounds,
} from '../src/utils'

describe('clamp', () => {
  it('keeps values inside the bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })

  it('treats NaN bounds as zero', () => {
    expect(clamp(5, NaN, 10)).toBe(5)
    expect(clamp(5, 0, NaN)).toBe(0)
  })
})

describe('roundAndCheckForNaN', () => {
  it('rounds', () => {
    expect(roundAndCheckForNaN(10.4)).toBe(10)
    expect(roundAndCheckForNaN(10.6)).toBe(11)
  })

  it('throws on NaN so misconfigured snap points fail loudly', () => {
    expect(() => roundAndCheckForNaN(NaN)).toThrow(TypeError)
  })
})

describe('processSnapPoints', () => {
  it('sorts, rounds, dedupes and clamps to maxHeight', () => {
    const { snapPoints, minSnap, maxSnap } = processSnapPoints(
      [100.4, 100, 300, 900],
      500
    )
    expect(snapPoints).toEqual([100, 300, 500])
    expect(minSnap).toBe(100)
    expect(maxSnap).toBe(500)
  })

  it('accepts a single number', () => {
    expect(processSnapPoints(120, 500).snapPoints).toEqual([120])
  })

  it('never returns a negative snap point', () => {
    expect(processSnapPoints([-50, 100], 500).minSnap).toBe(0)
  })
})

describe('rubberbandIfOutOfBounds', () => {
  it('passes through values inside the bounds', () => {
    expect(rubberbandIfOutOfBounds(50, 0, 100)).toBe(50)
  })

  it('dampens overshoot on both ends', () => {
    const over = rubberbandIfOutOfBounds(150, 0, 100, 0.55)
    expect(over).toBeGreaterThan(100)
    expect(over).toBeLessThan(150)

    const under = rubberbandIfOutOfBounds(-50, 0, 100, 0.55)
    expect(under).toBeLessThan(0)
    expect(under).toBeGreaterThan(-50)
  })

  it('clamps when the constant is zero', () => {
    expect(rubberbandIfOutOfBounds(150, 0, 100, 0)).toBe(100)
  })
})

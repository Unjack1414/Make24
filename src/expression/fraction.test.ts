import { describe, expect, it } from 'vitest'
import { calculate, fraction, isTwentyFour } from './fraction'

describe('fraction math', () => {
  it('normalizes signs and reduces values', () => {
    expect(fraction(8, -12)).toEqual({ numerator: -2, denominator: 3 })
  })

  it('keeps thirds exact through arithmetic', () => {
    const third = fraction(1, 3)
    expect(calculate(calculate(third, '+', third), '+', third)).toEqual(fraction(1))
  })

  it('recognizes exact 24 and division by zero', () => {
    expect(isTwentyFour(fraction(48, 2))).toBe(true)
    expect(() => calculate(fraction(1), '÷', fraction(0))).toThrow('division-by-zero')
  })
})

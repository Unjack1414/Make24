import type { Fraction, Operator } from '../types'

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) [x, y] = [y, x % y]
  return x || 1
}

export function fraction(numerator: number, denominator = 1): Fraction {
  if (denominator === 0) throw new Error('division-by-zero')
  const sign = denominator < 0 ? -1 : 1
  const divisor = gcd(numerator, denominator)
  return {
    numerator: (numerator / divisor) * sign,
    denominator: Math.abs(denominator / divisor)
  }
}

export function calculate(left: Fraction, operator: Operator, right: Fraction): Fraction {
  switch (operator) {
    case '+': return fraction(left.numerator * right.denominator + right.numerator * left.denominator, left.denominator * right.denominator)
    case '-': return fraction(left.numerator * right.denominator - right.numerator * left.denominator, left.denominator * right.denominator)
    case '×': return fraction(left.numerator * right.numerator, left.denominator * right.denominator)
    case '÷': return fraction(left.numerator * right.denominator, left.denominator * right.numerator)
  }
}

export const isTwentyFour = (value: Fraction) => value.numerator === 24 * value.denominator
export const fractionToNumber = (value: Fraction) => value.numerator / value.denominator
export const fractionToText = (value: Fraction) => value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`

import { describe, expect, it } from 'vitest'
import type { ExpressionToken } from '../types'
import { evaluateTokens, validateExpression } from './parser'

const number = (cardId: string, value: number): ExpressionToken => ({ type: 'number', cardId, value })
const operator = (value: '+' | '-' | '×' | '÷'): ExpressionToken => ({ type: 'operator', value })
const paren = (value: '(' | ')'): ExpressionToken => ({ type: 'paren', value })

describe('expression parser', () => {
  it('honors precedence', () => {
    expect(evaluateTokens([number('a', 2), operator('+'), number('b', 3), operator('×'), number('c', 4)])).toEqual({ numerator: 14, denominator: 1 })
  })

  it('evaluates nested fractional solutions exactly', () => {
    const tokens = [number('a', 8), operator('÷'), paren('('), number('b', 3), operator('-'), number('c', 8), operator('÷'), number('d', 3), paren(')')]
    expect(validateExpression(tokens, ['a', 'b', 'c', 'd']).valid).toBe(true)
  })

  it('rejects duplicated card instances and invalid syntax', () => {
    const duplicated = [number('a', 6), operator('+'), number('a', 6), operator('+'), number('c', 6), operator('+'), number('d', 6)]
    expect(validateExpression(duplicated, ['a', 'b', 'c', 'd'])).toMatchObject({ valid: false, reason: 'number-usage' })
    expect(() => evaluateTokens([number('a', 1), operator('+')])).toThrow('syntax')
  })
})

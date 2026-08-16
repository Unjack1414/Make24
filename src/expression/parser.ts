import type { ExpressionToken, Fraction, Operator, ValidationResult } from '../types'
import { calculate, fraction, isTwentyFour } from './fraction'

const precedence: Record<Operator, number> = { '+': 1, '-': 1, '×': 2, '÷': 2 }

export function tokensToText(tokens: ExpressionToken[]): string {
  return tokens.map((token) => token.value).join(' ')
}

export function isExpressionComplete(tokens: ExpressionToken[], cardCount = 4): boolean {
  if (tokens.filter((token) => token.type === 'number').length !== cardCount) return false
  if (!tokens.length || tokens.at(-1)?.type === 'operator' || tokens.at(-1)?.value === '(') return false
  let depth = 0
  for (const token of tokens) {
    if (token.value === '(') depth += 1
    if (token.value === ')') depth -= 1
    if (depth < 0) return false
  }
  return depth === 0
}

export function allowedNext(tokens: ExpressionToken[]) {
  const last = tokens.at(-1)
  const depth = tokens.reduce((value, token) => value + (token.value === '(' ? 1 : token.value === ')' ? -1 : 0), 0)
  const expectsValue = !last || last.type === 'operator' || last.value === '('
  return {
    number: expectsValue,
    leftParen: expectsValue,
    operator: Boolean(last && (last.type === 'number' || last.value === ')')),
    rightParen: depth > 0 && Boolean(last && (last.type === 'number' || last.value === ')'))
  }
}

function toPostfix(tokens: ExpressionToken[]): ExpressionToken[] {
  const output: ExpressionToken[] = []
  const stack: ExpressionToken[] = []
  let expectsValue = true

  for (const token of tokens) {
    if (token.type === 'number') {
      if (!expectsValue) throw new Error('syntax')
      output.push(token)
      expectsValue = false
    } else if (token.value === '(') {
      if (!expectsValue) throw new Error('syntax')
      stack.push(token)
      expectsValue = true
    } else if (token.value === ')') {
      if (expectsValue) throw new Error('syntax')
      while (stack.length && stack.at(-1)?.value !== '(') output.push(stack.pop()!)
      if (!stack.length) throw new Error('syntax')
      stack.pop()
      expectsValue = false
    } else {
      if (expectsValue) throw new Error('syntax')
      while (stack.length) {
        const top = stack.at(-1)!
        if (top.type !== 'operator' || precedence[top.value] < precedence[token.value]) break
        output.push(stack.pop()!)
      }
      stack.push(token)
      expectsValue = true
    }
  }
  if (expectsValue) throw new Error('syntax')
  while (stack.length) {
    const token = stack.pop()!
    if (token.type === 'paren') throw new Error('syntax')
    output.push(token)
  }
  return output
}

export function evaluateTokens(tokens: ExpressionToken[]): Fraction {
  const stack: Fraction[] = []
  for (const token of toPostfix(tokens)) {
    if (token.type === 'number') stack.push(fraction(token.value))
    else if (token.type === 'operator') {
      if (stack.length < 2) throw new Error('syntax')
      const right = stack.pop()!
      const left = stack.pop()!
      stack.push(calculate(left, token.value, right))
    }
  }
  if (stack.length !== 1) throw new Error('syntax')
  return stack[0]
}

export function validateExpression(tokens: ExpressionToken[], cardIds: string[]): ValidationResult {
  const usedIds = tokens.filter((token): token is Extract<ExpressionToken, { type: 'number' }> => token.type === 'number').map((token) => token.cardId)
  if (usedIds.length !== cardIds.length || new Set(usedIds).size !== cardIds.length || cardIds.some((id) => !usedIds.includes(id))) {
    return { valid: false, reason: 'number-usage', message: '每张数字卡必须使用一次' }
  }
  try {
    const value = evaluateTokens(tokens)
    if (!isTwentyFour(value)) return { valid: false, reason: 'not-24', message: `结果是 ${value.numerator / value.denominator}，再试试吧`, value }
    return { valid: true, value }
  } catch (error) {
    if (error instanceof Error && error.message === 'division-by-zero') return { valid: false, reason: 'division-by-zero', message: '不能除以零' }
    return { valid: false, reason: 'syntax', message: '算式还不完整，请检查运算符和括号' }
  }
}

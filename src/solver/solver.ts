import type { SolveResult } from '../types'
import { calculate, fraction, isTwentyFour } from '../expression/fraction'

interface Term {
  value: ReturnType<typeof fraction>
  expression: string
}

export function solve24(numbers: number[]): SolveResult {
  const search = (terms: Term[]): string | undefined => {
    if (terms.length === 1) return isTwentyFour(terms[0].value) ? terms[0].expression : undefined

    for (let i = 0; i < terms.length; i += 1) {
      for (let j = i + 1; j < terms.length; j += 1) {
        const a = terms[i]
        const b = terms[j]
        const rest = terms.filter((_, index) => index !== i && index !== j)
        const candidates: Array<{ value: Term['value']; expression: string }> = [
          { value: calculate(a.value, '+', b.value), expression: `(${a.expression} + ${b.expression})` },
          { value: calculate(a.value, '-', b.value), expression: `(${a.expression} − ${b.expression})` },
          { value: calculate(b.value, '-', a.value), expression: `(${b.expression} − ${a.expression})` },
          { value: calculate(a.value, '×', b.value), expression: `(${a.expression} × ${b.expression})` }
        ]
        if (b.value.numerator !== 0) candidates.push({ value: calculate(a.value, '÷', b.value), expression: `(${a.expression} ÷ ${b.expression})` })
        if (a.value.numerator !== 0) candidates.push({ value: calculate(b.value, '÷', a.value), expression: `(${b.expression} ÷ ${a.expression})` })

        for (const candidate of candidates) {
          const result = search([...rest, candidate])
          if (result) return result
        }
      }
    }
    return undefined
  }

  const expression = search(numbers.map((value) => ({ value: fraction(value), expression: String(value) })))
  return expression ? { solvable: true, expression } : { solvable: false }
}

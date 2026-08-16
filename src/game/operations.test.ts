import { describe, expect, it } from 'vitest'
import { fraction } from '../expression/fraction'
import { validateExpression } from '../expression/parser'
import type { NumberCard } from '../types'
import { combineWorkingCards, createWorkingCards } from './operations'

const cards: NumberCard[] = [
  { id: 'a', value: 3, used: false },
  { id: 'b', value: 3, used: false },
  { id: 'c', value: 8, used: false },
  { id: 'd', value: 8, used: false }
]

describe('step-by-step card operations', () => {
  it('keeps duplicate cards independent and preserves operand order', () => {
    const initial = createWorkingCards(cards)
    const first = combineWorkingCards(initial, 'a', 'c', '-', 'r1')
    expect(first).toHaveLength(3)
    expect(first[0]).toMatchObject({ id: 'b' })
    expect(first[1]).toMatchObject({ id: 'r1', value: fraction(-5) })
    expect(first[2]).toMatchObject({ id: 'd' })
    expect(initial).toHaveLength(4)
  })

  it('builds a complete token expression that the existing parser validates', () => {
    let current = createWorkingCards(cards)
    current = combineWorkingCards(current, 'c', 'a', '÷', 'r1')
    current = combineWorkingCards(current, 'b', 'r1', '-', 'r2')
    current = combineWorkingCards(current, 'd', 'r2', '÷', 'r3')

    expect(current).toHaveLength(1)
    expect(validateExpression(current[0].tokens, cards.map((card) => card.id)).valid).toBe(true)
  })

  it('rejects division by a zero-valued result', () => {
    let current = createWorkingCards(cards)
    current = combineWorkingCards(current, 'a', 'b', '-', 'zero')
    expect(() => combineWorkingCards(current, 'c', 'zero', '÷', 'bad')).toThrow('division-by-zero')
  })
})

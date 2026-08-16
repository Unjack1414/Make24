import { calculate, fraction } from '../expression/fraction'
import type { NumberCard, Operator, WorkingCard } from '../types'

export function createWorkingCards(cards: NumberCard[]): WorkingCard[] {
  return cards.map((card) => ({
    id: card.id,
    value: fraction(card.value),
    tokens: [{ type: 'number', cardId: card.id, value: card.value }]
  }))
}

export function combineWorkingCards(
  cards: WorkingCard[],
  leftId: string,
  rightId: string,
  operator: Operator,
  resultId: string
): WorkingCard[] {
  if (leftId === rightId) throw new Error('same-card')
  const left = cards.find((card) => card.id === leftId)
  const right = cards.find((card) => card.id === rightId)
  if (!left || !right) throw new Error('missing-card')

  const result: WorkingCard = {
    id: resultId,
    value: calculate(left.value, operator, right.value),
    tokens: [
      { type: 'paren', value: '(' },
      ...left.tokens,
      { type: 'operator', value: operator },
      ...right.tokens,
      { type: 'paren', value: ')' }
    ]
  }

  return cards.flatMap((card) => {
    if (card.id === leftId) return []
    if (card.id === rightId) return [result]
    return [card]
  })
}

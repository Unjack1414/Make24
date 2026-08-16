import { describe, expect, it } from 'vitest'
import { buildPuzzleBank } from '../game/puzzles'
import { solve24 } from './solver'

describe('24 solver and puzzle bank', () => {
  it('solves classic and repeated-number puzzles', () => {
    expect(solve24([3, 3, 8, 8]).solvable).toBe(true)
    expect(solve24([6, 6, 6, 6]).solvable).toBe(true)
  })

  it('recognizes a puzzle without a solution', () => {
    expect(solve24([1, 1, 1, 1]).solvable).toBe(false)
  })

  it('ships a validated, unique, in-range static bank', () => {
    const bank = buildPuzzleBank()
    expect(bank.length).toBeGreaterThan(1000)
    expect(new Set(bank.map((item) => item.id)).size).toBe(bank.length)
    expect(bank.every((item) => item.values.length === 4 && item.values.every((value) => value >= 1 && value <= 13) && item.solution)).toBe(true)
  })
})

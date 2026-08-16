import { describe, expect, it } from 'vitest'
import { completePuzzle, EMPTY_STATS, loadStats, saveStats, STATS_KEY } from './stats'

describe('local stats', () => {
  it('tracks independent correct answers and best time', () => {
    const first = completePuzzle(EMPTY_STATS, true, 12_000)
    const second = completePuzzle(first, false, 5_000)
    const third = completePuzzle(second, true, 8_000)
    expect(third).toMatchObject({ totalCompleted: 3, totalCorrect: 2, totalCorrectTimeMs: 20_000, bestTimeMs: 8_000 })
  })

  it('persists and restores data', () => {
    const storage = new Map<string, string>()
    const adapter = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) }
    const stats = completePuzzle(EMPTY_STATS, true, 1_000)
    saveStats(stats, adapter)
    expect(loadStats(adapter)).toEqual(stats)
  })

  it('falls back safely for corrupt or unknown data', () => {
    expect(loadStats({ getItem: () => 'not json' })).toEqual(EMPTY_STATS)
    expect(loadStats({ getItem: (key) => key === STATS_KEY ? '{"version":2}' : null })).toEqual(EMPTY_STATS)
  })
})

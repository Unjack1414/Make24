import type { StatsV1 } from '../types'

export const STATS_KEY = 'make24:stats'
export const EMPTY_STATS: StatsV1 = { version: 1, totalCompleted: 0, totalCorrect: 0, totalCorrectTimeMs: 0, bestTimeMs: null }

export function loadStats(storage: Pick<Storage, 'getItem'> = localStorage): StatsV1 {
  try {
    const raw = storage.getItem(STATS_KEY)
    if (!raw) return { ...EMPTY_STATS }
    const value = JSON.parse(raw) as Partial<StatsV1>
    if (value.version !== 1 || !Number.isFinite(value.totalCompleted) || !Number.isFinite(value.totalCorrect) || !Number.isFinite(value.totalCorrectTimeMs)) return { ...EMPTY_STATS }
    return {
      version: 1,
      totalCompleted: Math.max(0, value.totalCompleted!),
      totalCorrect: Math.max(0, value.totalCorrect!),
      totalCorrectTimeMs: Math.max(0, value.totalCorrectTimeMs!),
      bestTimeMs: typeof value.bestTimeMs === 'number' && value.bestTimeMs >= 0 ? value.bestTimeMs : null
    }
  } catch {
    return { ...EMPTY_STATS }
  }
}

export function saveStats(stats: StatsV1, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(STATS_KEY, JSON.stringify(stats))
}

export function completePuzzle(stats: StatsV1, correct: boolean, elapsedMs: number): StatsV1 {
  return {
    ...stats,
    totalCompleted: stats.totalCompleted + 1,
    totalCorrect: stats.totalCorrect + (correct ? 1 : 0),
    totalCorrectTimeMs: stats.totalCorrectTimeMs + (correct ? elapsedMs : 0),
    bestTimeMs: correct ? (stats.bestTimeMs === null ? elapsedMs : Math.min(stats.bestTimeMs, elapsedMs)) : stats.bestTimeMs
  }
}

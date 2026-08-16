import type { Puzzle } from '../types'
import puzzleBank from './puzzle-bank.json'

interface PuzzleSeed {
  id: string
  values: number[]
  solution: string
}

export function buildPuzzleBank(): PuzzleSeed[] {
  return puzzleBank as PuzzleSeed[]
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function createPuzzle(previousId?: string): Puzzle {
  const puzzles = buildPuzzleBank()
  const choices = puzzles.length > 1 ? puzzles.filter((item) => item.id !== previousId) : puzzles
  const seed = choices[Math.floor(Math.random() * choices.length)]
  return {
    id: seed.id,
    solution: seed.solution.replace(/^\((.*)\)$/, '$1'),
    cards: shuffle(seed.values).map((value, index) => ({ id: `${seed.id}-${Date.now()}-${index}`, value, used: false }))
  }
}

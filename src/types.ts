export type Operator = '+' | '-' | '×' | '÷'

export interface NumberCard {
  id: string
  value: number
  used: boolean
}

export type ExpressionToken =
  | { type: 'number'; cardId: string; value: number }
  | { type: 'operator'; value: Operator }
  | { type: 'paren'; value: '(' | ')' }

export interface Fraction {
  numerator: number
  denominator: number
}

export interface WorkingCard {
  id: string
  value: Fraction
  tokens: ExpressionToken[]
}

export interface Puzzle {
  id: string
  cards: NumberCard[]
  solution: string
}

export interface SolveResult {
  solvable: boolean
  expression?: string
}

export type ValidationResult =
  | { valid: true; value: Fraction }
  | { valid: false; reason: 'syntax' | 'number-usage' | 'division-by-zero' | 'not-24'; message: string; value?: Fraction }

export type GamePhase = 'playing' | 'wrong' | 'hinted' | 'solved' | 'skipped'

export interface StatsV1 {
  version: 1
  totalCompleted: number
  totalCorrect: number
  totalCorrectTimeMs: number
  bestTimeMs: number | null
}

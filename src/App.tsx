import { useCallback, useEffect, useRef, useState } from 'react'
import type { GamePhase, Operator, Puzzle, StatsV1, WorkingCard } from './types'
import { fractionToText } from './expression/fraction'
import { validateExpression } from './expression/parser'
import { combineWorkingCards, createWorkingCards } from './game/operations'
import { createPuzzle } from './game/puzzles'
import { completePuzzle, EMPTY_STATS, loadStats, saveStats } from './storage/stats'
import { Drawer } from './components/Drawer'
import { StatsPanel } from './components/StatsPanel'
import { HelpPanel } from './components/HelpPanel'
import { UpdatePrompt } from './components/UpdatePrompt'

const operators: Operator[] = ['+', '-', '×', '÷']
const initialFeedback = '选择一个数字开始计算'

const formatClock = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`
}

interface OperationSnapshot {
  cards: WorkingCard[]
  selectedCardId: string
  selectedOperator: Operator
}

interface PuzzleSnapshot {
  puzzle: Puzzle
  workingCards: WorkingCard[]
  selectedCardId: string | null
  selectedOperator: Operator | null
  selectionFromResult: boolean
  history: OperationSnapshot[]
  operationCounter: number
  phase: GamePhase
  feedback: string
  hasHint: boolean
  interacted: boolean
  settled: boolean
  elapsedMs: number
}

export function App() {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => createPuzzle())
  const [workingCards, setWorkingCards] = useState<WorkingCard[]>(() => createWorkingCards(puzzle.cards))
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [selectionFromResult, setSelectionFromResult] = useState(false)
  const [history, setHistory] = useState<OperationSnapshot[]>([])
  const operationCounter = useRef(0)
  const [previousPuzzles, setPreviousPuzzles] = useState<PuzzleSnapshot[]>([])
  const [forwardPuzzles, setForwardPuzzles] = useState<PuzzleSnapshot[]>([])
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [feedback, setFeedback] = useState(initialFeedback)
  const [hasHint, setHasHint] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [settled, setSettled] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [elapsedMs, setElapsedMs] = useState(0)
  const [stats, setStats] = useState<StatsV1>(() => loadStats())
  const [drawer, setDrawer] = useState<'stats' | 'help' | null>(null)

  useEffect(() => {
    if (settled) return
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 250)
    return () => window.clearInterval(timer)
  }, [settled, startedAt])

  useEffect(() => saveStats(stats), [stats])

  const locked = settled
  const hasProgress = selectedCardId !== null || selectedOperator !== null || history.length > 0

  const keepHintOr = (message: string) => hasHint ? `提示：${puzzle.solution}` : message

  const settle = useCallback((correct: boolean, time: number) => {
    if (settled) return
    setStats((current) => completePuzzle(current, correct, time))
    setSettled(true)
  }, [settled])

  const capturePuzzle = (overrides: Partial<PuzzleSnapshot> = {}): PuzzleSnapshot => ({
    puzzle,
    workingCards,
    selectedCardId,
    selectedOperator,
    selectionFromResult,
    history,
    operationCounter: operationCounter.current,
    phase,
    feedback,
    hasHint,
    interacted,
    settled,
    elapsedMs: settled ? elapsedMs : Date.now() - startedAt,
    ...overrides
  })

  const restorePuzzle = (snapshot: PuzzleSnapshot) => {
    setPuzzle(snapshot.puzzle)
    setWorkingCards(snapshot.workingCards)
    setSelectedCardId(snapshot.selectedCardId)
    setSelectedOperator(snapshot.selectedOperator)
    setSelectionFromResult(snapshot.selectionFromResult)
    setHistory(snapshot.history)
    operationCounter.current = snapshot.operationCounter
    setPhase(snapshot.phase)
    setFeedback(snapshot.feedback)
    setHasHint(snapshot.hasHint)
    setInteracted(snapshot.interacted)
    setSettled(snapshot.settled)
    setElapsedMs(snapshot.elapsedMs)
    setStartedAt(Date.now() - snapshot.elapsedMs)
  }

  const finishIfFinal = (cards: WorkingCard[]) => {
    if (cards.length !== 1) return false
    const result = validateExpression(cards[0].tokens, puzzle.cards.map((card) => card.id))
    if (result.valid) {
      const time = Date.now() - startedAt
      setElapsedMs(time)
      setPhase('solved')
      setFeedback(hasHint ? '算对了！这题使用过提示' : '太棒了，最终结果正好是 24！')
      settle(!hasHint, time)
    } else {
      setPhase(hasHint ? 'hinted' : 'wrong')
      setFeedback(`最终结果是 ${fractionToText(cards[0].value)}，撤销一步再试试`)
    }
    return true
  }

  const calculateWith = (rightId: string) => {
    if (!selectedCardId || !selectedOperator || rightId === selectedCardId) return
    const left = workingCards.find((card) => card.id === selectedCardId)
    const right = workingCards.find((card) => card.id === rightId)
    if (!left || !right) return

    try {
      operationCounter.current += 1
      const next = combineWorkingCards(workingCards, selectedCardId, rightId, selectedOperator, `${puzzle.id}-result-${operationCounter.current}`)
      const resultCard = next.find((card) => card.id.endsWith(`result-${operationCounter.current}`))!
      setHistory((current) => [...current, { cards: workingCards, selectedCardId, selectedOperator }])
      setWorkingCards(next)
      setSelectedCardId(resultCard.id)
      setSelectedOperator(null)
      setSelectionFromResult(true)
      setInteracted(true)
      setPhase(hasHint ? 'hinted' : 'playing')
      const equation = `${fractionToText(left.value)} ${selectedOperator} ${fractionToText(right.value)} = ${fractionToText(resultCard.value)}`
      if (!finishIfFinal(next)) setFeedback(keepHintOr(`${equation}，选择运算符继续`))
    } catch (error) {
      setSelectedOperator(null)
      setPhase(hasHint ? 'hinted' : 'wrong')
      setFeedback(error instanceof Error && error.message === 'division-by-zero' ? '不能除以零，请换一个运算符' : '这一步无法完成，请重新选择')
    }
  }

  const selectCard = (id: string) => {
    if (locked) return
    setInteracted(true)
    setPhase(hasHint ? 'hinted' : 'playing')

    if (!selectedCardId) {
      setSelectedCardId(id)
      setSelectionFromResult(false)
      setFeedback(keepHintOr('请选择一个运算符'))
      return
    }
    if (id === selectedCardId) {
      setSelectedCardId(null)
      setSelectedOperator(null)
      setSelectionFromResult(false)
      setFeedback(keepHintOr(initialFeedback))
      return
    }
    if (selectedOperator) {
      calculateWith(id)
      return
    }
    setSelectedCardId(id)
    setSelectionFromResult(false)
    setFeedback(keepHintOr('已更换数字，请选择一个运算符'))
  }

  const selectOperator = (operator: Operator) => {
    if (locked || !selectedCardId) return
    setSelectedOperator(operator)
    setInteracted(true)
    setPhase(hasHint ? 'hinted' : 'playing')
    setFeedback(keepHintOr(`已选择 ${operator}，请点击第二个数字`))
  }

  const undo = () => {
    if (locked || !hasProgress) return
    setInteracted(true)
    setPhase(hasHint ? 'hinted' : 'playing')

    if (selectedOperator) {
      setSelectedOperator(null)
      setFeedback(keepHintOr('已取消运算符，请重新选择'))
      return
    }
    if (selectedCardId && !selectionFromResult) {
      setSelectedCardId(null)
      setFeedback(keepHintOr('已取消数字选择'))
      return
    }
    const previous = history.at(-1)
    if (!previous) {
      setSelectedCardId(null)
      setSelectionFromResult(false)
      return
    }
    setWorkingCards(previous.cards)
    setSelectedCardId(previous.selectedCardId)
    setSelectedOperator(previous.selectedOperator)
    setSelectionFromResult(false)
    setHistory((current) => current.slice(0, -1))
    setFeedback(keepHintOr('已撤销上一步计算，可重新选择第二个数字'))
  }

  const clear = () => {
    if (locked || !hasProgress) return
    setWorkingCards(createWorkingCards(puzzle.cards))
    setSelectedCardId(null)
    setSelectedOperator(null)
    setSelectionFromResult(false)
    setHistory([])
    operationCounter.current = 0
    setInteracted(true)
    setPhase(hasHint ? 'hinted' : 'playing')
    setFeedback(keepHintOr('已重置本题，请选择一个数字'))
  }

  const showHint = () => {
    if (locked) return
    setHasHint(true)
    setInteracted(true)
    setPhase('hinted')
    setFeedback(`提示：${puzzle.solution}`)
  }

  const startNewPuzzle = (previousId: string) => {
    const next = createPuzzle(previousId)
    setPuzzle(next)
    setWorkingCards(createWorkingCards(next.cards))
    setSelectedCardId(null)
    setSelectedOperator(null)
    setSelectionFromResult(false)
    setHistory([])
    operationCounter.current = 0
    setPhase('playing')
    setFeedback(initialFeedback)
    setHasHint(false)
    setInteracted(false)
    setSettled(false)
    setStartedAt(Date.now())
    setElapsedMs(0)
  }

  const nextPuzzle = () => {
    const time = settled ? elapsedMs : Date.now() - startedAt
    const shouldSkip = !settled && interacted
    if (shouldSkip) settle(false, time)
    setPreviousPuzzles((current) => [...current, capturePuzzle(shouldSkip ? {
      settled: true,
      phase: 'skipped',
      feedback: '这题已跳过',
      elapsedMs: time
    } : { elapsedMs: time })])

    const forward = forwardPuzzles.at(-1)
    if (forward) {
      setForwardPuzzles((current) => current.slice(0, -1))
      restorePuzzle(forward)
    } else {
      startNewPuzzle(puzzle.id)
    }
  }

  const previousPuzzle = () => {
    const previous = previousPuzzles.at(-1)
    if (!previous) return
    setForwardPuzzles((current) => [...current, capturePuzzle()])
    setPreviousPuzzles((current) => current.slice(0, -1))
    restorePuzzle(previous)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">24</span><span><strong>凑24</strong><small>MAKE24</small></span></div>
        <nav aria-label="应用菜单">
          <button className="icon-button" onClick={() => setDrawer('stats')} aria-label="查看统计">▥</button>
          <button className="icon-button" onClick={() => setDrawer('help')} aria-label="查看帮助">?</button>
        </nav>
      </header>

      <main>
        <section className="game-card" aria-labelledby="game-title">
          <div className="round-meta"><span id="game-title">算出 24</span><time aria-label={`用时 ${formatClock(elapsedMs)}`}>◷ {formatClock(elapsedMs)}</time></div>

          <div className="step-heading"><span>当前数字</span><small>第 {Math.min(history.length + 1, 3)} / 3 步</small></div>
          <div className={`number-grid count-${workingCards.length}`} aria-label="当前数字卡片">
            {workingCards.map((card) => {
              const selected = card.id === selectedCardId
              return (
                <button
                  key={card.id}
                  className={`number-card ${selected ? 'selected' : ''} ${card.tokens.length > 1 ? 'result' : ''}`}
                  disabled={locked}
                  onClick={() => selectCard(card.id)}
                  aria-label={`数字 ${fractionToText(card.value)}${selected ? '，已选择' : ''}`}
                  aria-pressed={selected}
                >
                  <span>{fractionToText(card.value)}</span>
                </button>
              )
            })}
          </div>

          <div className="operator-grid" aria-label="选择运算符">
            {operators.map((operator) => (
              <button
                key={operator}
                className={selectedOperator === operator ? 'selected' : ''}
                disabled={locked || !selectedCardId}
                onClick={() => selectOperator(operator)}
                aria-label={`运算符 ${operator}${selectedOperator === operator ? '，已选择' : ''}`}
                aria-pressed={selectedOperator === operator}
              >{operator}</button>
            ))}
          </div>
          <div className="utility-row">
            <button className="utility" disabled={!hasProgress || locked} onClick={undo}>↶<span>撤销</span></button>
            <button className="utility" disabled={!hasProgress || locked} onClick={clear}>⌫<span>清空</span></button>
          </div>

          <p className={`feedback ${phase}`} role="status">{feedback}</p>
          <div className="secondary-actions three-actions">
            <button className="text-button previous" disabled={!previousPuzzles.length} onClick={previousPuzzle}>← 上一题</button>
            <button className="text-button" disabled={hasHint || locked} onClick={showHint}>💡 {hasHint ? '已提示' : '提示'}</button>
            <button className="text-button next" onClick={nextPuzzle}>下一题 →</button>
          </div>
        </section>
      </main>

      <footer>每一道题都有解 · 数据仅保存在本机</footer>
      <Drawer open={drawer === 'stats'} title="我的成绩" onClose={() => setDrawer(null)}><StatsPanel stats={stats} onReset={() => setStats({ ...EMPTY_STATS })} /></Drawer>
      <Drawer open={drawer === 'help'} title="玩法与安装" onClose={() => setDrawer(null)}><HelpPanel /></Drawer>
      <UpdatePrompt />
    </div>
  )
}

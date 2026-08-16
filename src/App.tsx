import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ExpressionToken, GamePhase, Operator, Puzzle, StatsV1 } from './types'
import { allowedNext, isExpressionComplete, tokensToText, validateExpression } from './expression/parser'
import { createPuzzle } from './game/puzzles'
import { completePuzzle, EMPTY_STATS, loadStats, saveStats } from './storage/stats'
import { Drawer } from './components/Drawer'
import { StatsPanel } from './components/StatsPanel'
import { HelpPanel } from './components/HelpPanel'
import { UpdatePrompt } from './components/UpdatePrompt'

const operators: Operator[] = ['+', '-', '×', '÷']
const formatClock = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`
}

export function App() {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => createPuzzle())
  const [tokens, setTokens] = useState<ExpressionToken[]>([])
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [feedback, setFeedback] = useState('用四个数字算出 24')
  const [hasHint, setHasHint] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [settled, setSettled] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [elapsedMs, setElapsedMs] = useState(0)
  const [stats, setStats] = useState<StatsV1>(() => loadStats())
  const [drawer, setDrawer] = useState<'stats' | 'help' | null>(null)

  useEffect(() => {
    if (phase === 'solved') return
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 250)
    return () => window.clearInterval(timer)
  }, [phase, startedAt])

  useEffect(() => saveStats(stats), [stats])

  const usedCardIds = useMemo(() => new Set(tokens.filter((token) => token.type === 'number').map((token) => token.cardId)), [tokens])
  const allowed = allowedNext(tokens)
  const locked = phase === 'solved'
  const canSubmit = !locked && isExpressionComplete(tokens, puzzle.cards.length)

  const addToken = (token: ExpressionToken) => {
    if (locked) return
    setTokens((current) => [...current, token])
    setInteracted(true)
    setPhase(hasHint ? 'hinted' : 'playing')
    setFeedback(hasHint ? `提示：${puzzle.solution}` : '继续完成算式')
  }

  const settle = useCallback((correct: boolean, time: number) => {
    if (settled) return
    setStats((current) => completePuzzle(current, correct, time))
    setSettled(true)
  }, [settled])

  const submit = () => {
    const result = validateExpression(tokens, puzzle.cards.map((card) => card.id))
    setInteracted(true)
    if (result.valid) {
      const time = Date.now() - startedAt
      setElapsedMs(time)
      setPhase('solved')
      setFeedback(hasHint ? '算对了！这题使用过提示' : '太棒了，正好等于 24！')
      settle(!hasHint, time)
    } else {
      setPhase(hasHint ? 'hinted' : 'wrong')
      setFeedback(result.message)
    }
  }

  const undo = () => {
    if (locked || !tokens.length) return
    setTokens((current) => current.slice(0, -1))
    setInteracted(true)
    setPhase(hasHint ? 'hinted' : 'playing')
    setFeedback(hasHint ? `提示：${puzzle.solution}` : '已撤销上一步')
  }

  const clear = () => {
    if (locked || !tokens.length) return
    setTokens([])
    setInteracted(true)
    setPhase(hasHint ? 'hinted' : 'playing')
    setFeedback(hasHint ? `提示：${puzzle.solution}` : '已清空，重新来吧')
  }

  const showHint = () => {
    if (locked) return
    setHasHint(true)
    setInteracted(true)
    setPhase('hinted')
    setFeedback(`提示：${puzzle.solution}`)
  }

  const nextPuzzle = () => {
    if (!settled && interacted) settle(false, Date.now() - startedAt)
    const next = createPuzzle(puzzle.id)
    setPuzzle(next)
    setTokens([])
    setPhase('playing')
    setFeedback('用四个数字算出 24')
    setHasHint(false)
    setInteracted(false)
    setSettled(false)
    setStartedAt(Date.now())
    setElapsedMs(0)
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

          <div className="number-grid" aria-label="数字卡片">
            {puzzle.cards.map((card) => {
              const used = usedCardIds.has(card.id)
              return <button key={card.id} className={`number-card ${used ? 'used' : ''}`} disabled={used || !allowed.number || locked} onClick={() => addToken({ type: 'number', cardId: card.id, value: card.value })} aria-label={`数字 ${card.value}${used ? '，已使用' : ''}`}>{card.value}</button>
            })}
          </div>

          <div className={`expression ${tokens.length ? '' : 'placeholder'}`} aria-live="polite">
            {tokens.length ? tokensToText(tokens) : '点击数字和运算符组成算式'}
          </div>

          <div className="operator-grid" aria-label="运算符">
            {operators.map((operator) => <button key={operator} disabled={!allowed.operator || locked} onClick={() => addToken({ type: 'operator', value: operator })}>{operator}</button>)}
            <button disabled={!allowed.leftParen || locked} onClick={() => addToken({ type: 'paren', value: '(' })}>(</button>
            <button disabled={!allowed.rightParen || locked} onClick={() => addToken({ type: 'paren', value: ')' })}>)</button>
            <button className="utility" disabled={!tokens.length || locked} onClick={undo}>↶<span>撤销</span></button>
            <button className="utility" disabled={!tokens.length || locked} onClick={clear}>⌫<span>清空</span></button>
          </div>

          <button className="submit-button" disabled={!canSubmit} onClick={submit}>{phase === 'solved' ? '✓ 已完成' : '提交答案'}</button>
          <p className={`feedback ${phase}`} role="status">{feedback}</p>
          <div className="secondary-actions">
            <button className="text-button" disabled={hasHint || locked} onClick={showHint}>💡 {hasHint ? '已显示提示' : '提示'}</button>
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

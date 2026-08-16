import type { StatsV1 } from '../types'

const formatTime = (milliseconds: number | null) => {
  if (milliseconds === null) return '—'
  return `${(milliseconds / 1000).toFixed(1)} 秒`
}

export function StatsPanel({ stats, onReset }: { stats: StatsV1; onReset: () => void }) {
  const rate = stats.totalCompleted ? Math.round((stats.totalCorrect / stats.totalCompleted) * 100) : 0
  const average = stats.totalCorrect ? stats.totalCorrectTimeMs / stats.totalCorrect : null
  const reset = () => window.confirm('确定清空所有本地成绩吗？此操作无法撤销。') && onReset()
  return (
    <>
      <div className="stats-grid">
        <div><strong>{stats.totalCompleted}</strong><span>答题数</span></div>
        <div><strong>{stats.totalCorrect}</strong><span>正确数</span></div>
        <div><strong>{rate}%</strong><span>正确率</span></div>
        <div><strong>{formatTime(average)}</strong><span>平均用时</span></div>
        <div className="stats-wide"><strong>{formatTime(stats.bestTimeMs)}</strong><span>最佳用时</span></div>
      </div>
      <p className="muted">正确数与用时只统计未查看提示并独立答对的题目。</p>
      <button className="danger-button" onClick={reset} disabled={!stats.totalCompleted}>重置统计</button>
    </>
  )
}

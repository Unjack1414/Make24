import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

const { firstPuzzle, secondPuzzle } = vi.hoisted(() => ({
  firstPuzzle: {
    id: '7-10-2-10',
    solution: '((7 + 10) × 2) − 10',
    cards: [
      { id: 'a', value: 7, used: false },
      { id: 'b', value: 10, used: false },
      { id: 'c', value: 2, used: false },
      { id: 'd', value: 10, used: false }
    ]
  },
  secondPuzzle: {
    id: '6-6-6-6',
    solution: '6 + 6 + 6 + 6',
    cards: [
      { id: 'e', value: 6, used: false },
      { id: 'f', value: 6, used: false },
      { id: 'g', value: 6, used: false },
      { id: 'h', value: 6, used: false }
    ]
  }
}))

vi.mock('./game/puzzles', () => ({
  createPuzzle: vi.fn((previousId?: string) => previousId ? secondPuzzle : firstPuzzle)
}))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}))

describe('Make24 app', () => {
  beforeEach(() => localStorage.clear())

  it('starts with four cards, disabled operators, and no previous puzzle', () => {
    render(<App />)
    expect(screen.getAllByRole('button', { name: /数字/ })).toHaveLength(4)
    expect(screen.getByRole('button', { name: '运算符 +' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '← 上一题' })).toBeDisabled()
  })

  it('calculates after number, operator, number and keeps the result selected', () => {
    render(<App />)
    const cards = screen.getAllByRole('button', { name: /数字/ })
    fireEvent.click(cards[0])
    fireEvent.click(screen.getByRole('button', { name: '运算符 +' }))
    fireEvent.click(cards[1])

    expect(screen.getAllByRole('button', { name: /数字/ })).toHaveLength(3)
    expect(screen.getByRole('button', { name: '数字 17，已选择' })).toBePressed()
    expect(screen.getByRole('button', { name: '运算符 ×' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: /撤销/ }))
    expect(screen.getAllByRole('button', { name: /数字/ })).toHaveLength(4)
    expect(screen.getByRole('button', { name: '运算符 +，已选择' })).toBePressed()
  })

  it('supports chained operations and completes automatically at 24', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '数字 7' }))
    fireEvent.click(screen.getByRole('button', { name: '运算符 +' }))
    fireEvent.click(screen.getAllByRole('button', { name: '数字 10' })[0])
    fireEvent.click(screen.getByRole('button', { name: '运算符 ×' }))
    fireEvent.click(screen.getByRole('button', { name: '数字 2' }))
    fireEvent.click(screen.getByRole('button', { name: '运算符 -' }))
    fireEvent.click(screen.getByRole('button', { name: '数字 10' }))

    expect(screen.getByRole('button', { name: '数字 24，已选择' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('最终结果正好是 24')
  })

  it('returns to the previous puzzle within the current session', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '下一题 →' }))
    expect(screen.getAllByRole('button', { name: '数字 6' })).toHaveLength(4)

    fireEvent.click(screen.getByRole('button', { name: '← 上一题' }))
    expect(screen.getByRole('button', { name: '数字 7' })).toBeInTheDocument()
  })

  it('does not count a solved puzzle again after previous and next navigation', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '数字 7' }))
    fireEvent.click(screen.getByRole('button', { name: '运算符 +' }))
    fireEvent.click(screen.getAllByRole('button', { name: '数字 10' })[0])
    fireEvent.click(screen.getByRole('button', { name: '运算符 ×' }))
    fireEvent.click(screen.getByRole('button', { name: '数字 2' }))
    fireEvent.click(screen.getByRole('button', { name: '运算符 -' }))
    fireEvent.click(screen.getByRole('button', { name: '数字 10' }))
    fireEvent.click(screen.getByRole('button', { name: '下一题 →' }))
    fireEvent.click(screen.getByRole('button', { name: '← 上一题' }))
    fireEvent.click(screen.getByRole('button', { name: '下一题 →' }))
    fireEvent.click(screen.getByRole('button', { name: '查看统计' }))

    const stats = within(screen.getByRole('dialog', { name: '我的成绩' }))
    expect(stats.getByText('答题数').parentElement).toHaveTextContent('1答题数')
    expect(stats.getByText('正确数').parentElement).toHaveTextContent('1正确数')
  })

  it('opens the statistics drawer', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '查看统计' }))
    expect(screen.getByRole('dialog', { name: '我的成绩' })).toBeInTheDocument()
  })
})

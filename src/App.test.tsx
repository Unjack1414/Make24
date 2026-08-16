import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}))

describe('Make24 app', () => {
  it('renders four independent cards and core controls', () => {
    render(<App />)
    expect(screen.getAllByRole('button', { name: /数字/ })).toHaveLength(4)
    expect(screen.getByRole('button', { name: '提交答案' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /提示/ })).toBeEnabled()
  })

  it('uses and restores a number card through undo', () => {
    render(<App />)
    const card = screen.getAllByRole('button', { name: /数字/ })[0]
    fireEvent.click(card)
    expect(card).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /撤销/ }))
    expect(card).toBeEnabled()
  })

  it('opens the statistics drawer', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '查看统计' }))
    expect(screen.getByRole('dialog', { name: '我的成绩' })).toBeInTheDocument()
  })
})

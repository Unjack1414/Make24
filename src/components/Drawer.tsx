import { useEffect, useRef, type ReactNode } from 'react'

interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer-handle" />
        <header className="drawer-header">
          <h2 id="drawer-title">{title}</h2>
          <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <div className="drawer-body">{children}</div>
      </section>
    </div>
  )
}

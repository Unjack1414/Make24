import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker
  } = useRegisterSW()
  if (!needRefresh && !offlineReady) return null
  return (
    <aside className="update-toast" aria-live="polite">
      <span>{needRefresh ? '新版本已经准备好' : '游戏已可离线使用'}</span>
      {needRefresh && <button onClick={() => updateServiceWorker(true)}>立即更新</button>}
      <button className="toast-close" aria-label="关闭提示" onClick={() => { setNeedRefresh(false); setOfflineReady(false) }}>×</button>
    </aside>
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'tldraw/tldraw.css'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'
import { bootPersistence } from './features/persistence/boot'

/** A slow or blocked database must never keep the workspace blank. */
const BOOT_TIMEOUT_MS = 5000

// Local storage is opened before the first render so the workspace begins with
// the restored project instead of an empty canvas that would flash and re-save.
async function start() {
  let booted = false

  await Promise.race([
    bootPersistence().then(() => {
      booted = true
    }),
    new Promise<void>((resolve) => window.setTimeout(resolve, BOOT_TIMEOUT_MS)),
  ])

  if (!booted) {
    console.warn("[kunDraw] 本地数据库响应过慢，已先进入工作台；刷新页面会重新尝试恢复项目")
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  )
}

void start()

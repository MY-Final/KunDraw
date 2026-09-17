import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'tldraw/tldraw.css'
import './index.css'
import App from './App.tsx'
import { bootPersistence } from './features/persistence/boot'

// Local storage is opened before the first render so the workspace begins with
// the restored project instead of an empty canvas that would flash and re-save.
void bootPersistence().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

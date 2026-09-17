import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ isPreview, mode }) => ({
  // GitHub Pages serves project sites from /<repo>/, so builds and `npm run preview`
  // use that path while `npm run dev` stays at the root. Override with
  // KUN_DRAW_BASE_PATH (for example "/" on a custom domain or a user page).
  base:
    process.env.KUN_DRAW_BASE_PATH ?? (mode === 'development' && !isPreview ? '/' : '/KunDraw/'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
}))

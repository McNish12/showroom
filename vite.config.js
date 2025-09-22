import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Use the repository subdirectory when serving the production bundle (build
  // and preview) on GitHub Pages, but keep the default root base during local
  // development for convenience.
  base: mode === 'production' ? '/showroom/' : '/',
  plugins: [react()],
}))

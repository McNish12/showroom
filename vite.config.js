import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Emit relative asset URLs in production so the bundle works when published
  // from GitHub Pages' `docs/` directory without needing a custom server
  // rewrite for the repository name.
  base: mode === 'production' ? './' : '/',
  plugins: [react()],
  // Emit the production build to `docs/` so GitHub Pages can serve the compiled
  // assets directly from the repository without additional tooling.
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
}))

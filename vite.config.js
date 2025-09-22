import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Use the GitHub Pages repository name as the production base path so
  // absolute asset URLs resolve no matter how the catalog page is linked.
  base: mode === 'production' ? '/showroom/' : '/',
  plugins: [react()],
  // Emit the production build to `docs/` so GitHub Pages can serve the compiled
  // assets directly from the repository without additional tooling.
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
}))

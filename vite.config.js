import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Use the repository subdirectory when building for GitHub Pages, but keep
  // the default root base during local development for convenience.
  base: command === 'build' ? '/showroom/' : '/',
  plugins: [react()],
}))

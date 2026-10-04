import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

// base './' makes built assets load via relative paths, required for an
// extension page served from chrome-extension://. Output goes to dist/, which
// is what you load unpacked in chrome://extensions.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Two pages: the new tab, and the small launcher the Alt+K overlay
      // frames on other sites. They share a chunk, so the second page costs
      // almost nothing.
      input: {
        index: resolve(__dirname, 'index.html'),
        launcher: resolve(__dirname, 'launcher.html'),
      },
    },
  },
})

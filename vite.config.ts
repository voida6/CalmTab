import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' makes built assets load via relative paths, required for an
// extension page served from chrome-extension://. Output goes to dist/, which
// is what you load unpacked in chrome://extensions.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})

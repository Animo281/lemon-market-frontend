import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Matches package.json's browserslist (Safari/iOS 16+, Chrome/Edge 105+,
  // Firefox 110+): the CSS actually used (container queries, cqw units)
  // needs these versions, so the bundle shouldn't claim wider support than
  // Vite's es2020 default implies.
  build: {
    target: ['es2021', 'safari16', 'chrome105', 'firefox110', 'edge105'],
  },
  plugins: [
    react(),
    {
      name: 'production-origin-fallback',
      apply: 'build',
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          if (output.type === 'chunk') {
            output.code = output.code.replaceAll('http://localhost', 'https://invalid.local')
          }
        }
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})

import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  server: {
    port: 3082,
    strictPort: true,
    host: true,
    allowedHosts: ['macmini'],
  },
  resolve: {
    alias: {
      '@bentomd': path.resolve(__dirname, '../src'),
      '@templates': path.resolve(__dirname, '../website/templates'),
    },
  },
})

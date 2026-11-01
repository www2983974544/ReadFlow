import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Backend fixed port (fallback scans upward from here, see shell/main.py)
const BACKEND_PORT = 17878

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': `http://127.0.0.1:${BACKEND_PORT}`,
    },
  },
})

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Capacitor webDir is "www" — the APK loads the built assets from there.
// base './' so asset URLs are relative (works under capacitor://localhost).
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'www',
    emptyOutDir: true,
    target: 'es2020',
  },
  server: {
    port: 5183,
  },
})

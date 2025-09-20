import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/fusion-feast/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
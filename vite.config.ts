import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) {
            return 'firebase-firestore'
          }
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase-core'
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/lucide-react')) {
            return 'vendor'
          }
        },
      },
    },
  },
})

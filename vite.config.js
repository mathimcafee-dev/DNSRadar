import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        pure_getters: false,
        passes: 1,
      },
      mangle: true,
      format: {
        quote_style: 1, // always use single quotes — prevents unquoted CSS values
      },
    },
  },
})

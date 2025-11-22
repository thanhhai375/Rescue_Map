import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Dòng này rất quan trọng

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Khối code này sẽ giải quyết lỗi 2 bản sao React
  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    }
  }
})
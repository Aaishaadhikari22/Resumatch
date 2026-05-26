import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['react-icons'],
          'socket': ['socket.io-client'],
        }
      }
    },
    // Reduce file size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        dead_code: true,
      }
    },
    // Chunk size warning threshold
    chunkSizeWarningLimit: 500,
    // Optimize CSS
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
  },
  // Performance optimization
  server: {
    middlewareMode: false,
    hmr: {
      host: 'localhost',
      port: 5173,
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  }
});

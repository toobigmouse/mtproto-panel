import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          gravityui: ['@gravity-ui/uikit'],
        },
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { config } from 'dotenv';

config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
  },
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        secure: true,
        ws: true,
      },
      '/auth': {
        target: API_URL,
        changeOrigin: true,
        secure: true,
        ws: true,
      },
      '/ws': {
        target: API_URL.replace('http', 'ws'),
        changeOrigin: true,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/Users/scalysis/scalysis_backend/Scalysis-AI-Calling/nexcore/src',
    },
  },
});

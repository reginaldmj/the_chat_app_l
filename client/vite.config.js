// Vite config is small: React plugin plus an API proxy for local development.
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  publicDir: path.resolve(__dirname, 'public'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
  },
  server: {
    proxy: {
      // This makes frontend fetch('/api/...') work without hardcoding localhost:3001.
      '/api': 'http://localhost:3001',
    },
    hmr: {
      // Use polling instead of WebSocket to avoid connection issues in WSL.
      port: false,
      protocol: 'http',
    },
  },
});

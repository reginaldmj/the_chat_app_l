// Vite config is small: React plugin plus an API proxy for local development.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This makes frontend fetch('/api/...') work without hardcoding localhost:3001.
      '/api': 'http://localhost:3001',
    },
  },
});

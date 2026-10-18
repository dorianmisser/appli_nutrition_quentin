import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// En développement, /api est relayé vers l'API Planchette (Express + MongoDB, port 3000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_PROXY ?? 'http://localhost:3000', changeOrigin: true },
    },
  },
  test: { environment: 'node' },
});

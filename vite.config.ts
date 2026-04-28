import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy all /api calls to the Spring Boot backend.
    // This avoids CORS issues in development — the browser talks to Vite (5173),
    // Vite proxies /api/* to Spring Boot (8081) server-side.
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

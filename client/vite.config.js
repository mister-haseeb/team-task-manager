import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the Express server so the session cookie stays same-origin
    // (set API_URL if the API runs on another port)
    proxy: {
      '/api': process.env.API_URL || 'http://localhost:5050',
    },
  },
});

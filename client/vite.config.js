import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the Express server so the session cookie stays same-origin
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});

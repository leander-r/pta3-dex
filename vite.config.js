import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub repo name: pta-dex
  base: process.env.NODE_ENV === 'production' ? '/pta-dex/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});

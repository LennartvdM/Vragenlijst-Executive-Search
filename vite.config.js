import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/js/main.js'),
      name: 'Survey',
      fileName: 'survey',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        // Ensure CSS is extracted alongside JS
        assetFileNames: '[name][extname]'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});

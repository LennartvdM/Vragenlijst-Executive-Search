import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'js',
    emptyOutDir: false, // Don't delete other files in js/
    lib: {
      entry: resolve(__dirname, 'src/js/main.js'),
      name: 'Survey',
      fileName: () => 'survey.js',
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

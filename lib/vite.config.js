/**
 * Vite build configuration for @vragenlijst/forms library.
 *
 * Build from project root:
 *   npx vite build -c lib/vite.config.js
 *
 * Or add to root package.json scripts:
 *   "build:lib": "vite build -c lib/vite.config.js"
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VragenlijstForms',
      formats: ['es', 'iife'],
      fileName: (format) => {
        if (format === 'es') return 'vragenlijst-forms.es.js';
        return 'vragenlijst-forms.js';
      }
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    cssFileName: 'vragenlijst-forms',
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
};

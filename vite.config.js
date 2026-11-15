import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, cpSync } from 'node:fs';

export default defineConfig({
  root: 'frontend',
  // The UI intentionally uses classic scripts so the small teaching modules
  // can share browser globals without a framework or bundler runtime.
  // Vite leaves those scripts untouched, therefore copy them into dist.
  plugins: [{
    name: 'copy-classic-ui-scripts',
    closeBundle() {
      cpSync(resolve(__dirname, 'frontend/js'), resolve(__dirname, 'dist/js'), { recursive: true });
      copyFileSync(resolve(__dirname, 'frontend/app.js'), resolve(__dirname, 'dist/app.js'));
    },
  }],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    target: 'es2020',
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend/js'),
    },
  },
});

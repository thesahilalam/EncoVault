import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, cpSync } from 'node:fs';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: isProduction ? '/EncoVault/' : '/',  // Only use base path in production
  root: 'frontend',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
      format: { comments: false },
    },
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'frontend/home.html'),
        encryptionDecryption: resolve(projectRoot, 'frontend/encryption-decryption.html'),
        compression: resolve(projectRoot, 'frontend/compression.html'),
        simulation: resolve(projectRoot, 'frontend/simulation.html'),
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
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  plugins: [{
    name: 'copy-classic-ui-scripts',
    closeBundle() {
      cpSync(resolve(projectRoot, 'frontend/js'), resolve(projectRoot, 'dist/js'), { recursive: true });
      copyFileSync(resolve(projectRoot, 'frontend/app.js'), resolve(projectRoot, 'dist/app.js'));
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          res.writeHead(302, { Location: '/home.html' });
          res.end();
          return;
        }
        next();
      });
    },
  }],
});

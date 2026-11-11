import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const proxy = { '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000', changeOrigin: true } };
export default defineConfig({
  root: path.dirname(fileURLToPath(import.meta.url)),
  server: { host: '0.0.0.0', proxy },
  preview: { host: '0.0.0.0', proxy },
  build: { outDir: 'dist' },
});

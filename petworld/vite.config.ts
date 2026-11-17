import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Contract: cd petworld && NODE_ENV=test npm test */
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/acceptance/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    testTimeout: 120_000,
  },
});

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';
import net from 'node:net';
async function waitPort(port: number, ms: number) {
  const start = Date.now();
  for (;;) {
    try { await new Promise<void>((res, rej) => { const s = net.createConnection({ port, host: '127.0.0.1' }); s.once('connect', () => { s.destroy(); res(); }); s.once('error', rej); }); return; }
    catch { if (Date.now() - start > ms) throw new Error('dev server timeout'); await new Promise((r) => setTimeout(r, 250)); }
  }
}
describe('AC2 dev from petworld', () => {
  it('npm run dev serves app root without error', async () => {
    const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const port = 5199;
    const child = spawn('npm', ['run', 'dev', '--', '--port', String(port), '--strictPort'], { cwd, stdio: 'ignore' });
    try { await waitPort(port, 45000); const res = await fetch(`http://127.0.0.1:${port}/`); expect(res.ok).toBe(true); }
    finally { child.kill('SIGTERM'); }
  }, 90000);
});

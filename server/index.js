import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { openTodos } from './db.js';

const db = openTodos(process.env.TODO_DB_PATH || resolve('data/todos.sqlite'));
const dist = resolve('dist');
const json = (res, status, value) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
const error = (res, status, message) => json(res, status, { error: message });
async function body(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 1_000_000) throw new Error('Body too large');
  }
  return JSON.parse(text);
}
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
async function staticFile(res, pathname) {
  let file;
  try { file = resolve(dist, '.' + decodeURIComponent(pathname)); } catch { return error(res, 400, 'Invalid path'); }
  if (file !== dist && !file.startsWith(dist + sep)) return error(res, 404, 'Not found');
  try {
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch { error(res, 404, 'Not found'); }
}
const server = createServer(async (req, res) => {
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; } catch { return error(res, 400, 'Invalid URL'); }
  try {
    if (pathname === '/api/todos') {
      if (req.method === 'GET') return json(res, 200, db.list());
      if (req.method === 'POST') {
        let data;
        try { data = await body(req); } catch { return error(res, 400, 'Invalid JSON'); }
        const title = typeof data?.title === 'string' ? data.title.trim() : '';
        if (!title) return error(res, 400, 'Please type a todo first');
        return json(res, 201, db.create(title));
      }
      return error(res, 405, 'Method not allowed');
    }
    const match = /^\/api\/todos\/([1-9]\d*)$/.exec(pathname);
    if (match) {
      const id = Number(match[1]);
      if (!Number.isSafeInteger(id)) return error(res, 404, 'Not found');
      if (req.method === 'PATCH') {
        let data;
        try { data = await body(req); } catch { return error(res, 400, 'Invalid JSON'); }
        if (typeof data?.done !== 'boolean') return error(res, 400, 'done must be a boolean');
        const updated = db.setDone(id, data.done);
        return updated ? json(res, 200, updated) : error(res, 404, 'Not found');
      }
      if (req.method === 'DELETE') {
        if (!db.delete(id)) return error(res, 404, 'Not found');
        res.writeHead(204); return res.end();
      }
      return error(res, 405, 'Method not allowed');
    }
    if (pathname.startsWith('/api/')) return error(res, 404, 'Not found');
    if (req.method !== 'GET' && req.method !== 'HEAD') return error(res, 405, 'Method not allowed');
    return await staticFile(res, pathname === '/' ? '/index.html' : pathname);
  } catch (cause) {
    console.error('Todo request failed', cause);
    if (!res.headersSent) error(res, 500, 'Internal server error'); else res.end();
  }
});
server.listen(Number(process.env.PORT || 3001), '0.0.0.0');
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));

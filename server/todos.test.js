// @vitest-environment node
import { afterEach, expect, test } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';

const processes = [];
const dirs = [];
async function freePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function start(dbPath) {
  const port = await freePort();
  const child = spawn(process.execPath, ['server/index.js'], {
    env: { ...process.env, PORT: String(port), TODO_DB_PATH: dbPath, NODE_ENV: 'test' },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  processes.push(child);
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk.toString(); });
  const url = `http://127.0.0.1:${port}/api/todos`;
  for (let i = 0; i < 40; i++) {
    if (child.exitCode !== null) throw new Error(`Todo server did not start: ${stderr}`);
    try { const result = await fetch(url); if (result.status !== 502) return { child, url }; } catch { /* wait for startup */ }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`Todo server did not listen on PORT: ${stderr}`);
}
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'todo-acceptance-'));
  dirs.push(dir);
  const dbPath = join(dir, 'todos.sqlite');
  return { dbPath, ...await start(dbPath) };
}
const request = (url, method, body) => fetch(url, {
  method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
});
const create = (url, title) => request(url, 'POST', { title });
const stop = async child => {
  if (child.exitCode !== null) return;
  child.kill();
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 1000))]);
};
afterEach(async () => {
  await Promise.all(processes.splice(0).map(stop));
  await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

test('AC7 persists titles and done state in a SQLite file across server restart', async () => {
  const { url, dbPath, child } = await fixture();
  const created = await (await create(url, 'persist')).json();
  const updated = await request(`${url}/${created.id}`, 'PATCH', { done: true });
  expect(updated.ok).toBe(true);
  await stop(child);
  expect((await readdir(join(dbPath, '..'))).some(name => name.startsWith('todos.sqlite'))).toBe(true);
  const restarted = await start(dbPath);
  expect(await (await fetch(restarted.url)).json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id, title: 'persist', done: true })]));
});

test('AC8 GET /api/todos lists saved todos newest first', async () => {
  const { url } = await fixture();
  const first = await (await create(url, 'first')).json();
  const second = await (await create(url, 'second')).json();
  const result = await fetch(url);
  expect(result.status).toBe(200);
  expect((await result.json()).map(row => row.id)).toEqual([second.id, first.id]);
});

test('AC9 POST trims valid titles (201) and rejects empty or whitespace-only titles (400) without writes', async () => {
  const { url } = await fixture();
  const valid = await create(url, '  useful  ');
  expect(valid.status).toBe(201);
  expect(await valid.json()).toEqual(expect.objectContaining({ title: 'useful' }));
  for (const title of ['', '  \t ']) expect((await create(url, title)).status).toBe(400);
  expect((await (await fetch(url)).json()).map(row => row.title)).toEqual(['useful']);
});

test('AC10 PATCH sets done true and false and returns 404 for an unknown id', async () => {
  const { url } = await fixture();
  const row = await (await create(url, 'toggle')).json();
  for (const done of [true, false]) {
    const result = await request(`${url}/${row.id}`, 'PATCH', { done });
    expect(result.ok).toBe(true);
    expect(await result.json()).toEqual(expect.objectContaining({ id: row.id, done }));
  }
  expect((await request(`${url}/9999999`, 'PATCH', { done: true })).status).toBe(404);
});

test('AC11 DELETE removes a todo (204) and returns 404 for an unknown id', async () => {
  const { url } = await fixture();
  const row = await (await create(url, 'delete')).json();
  expect((await request(`${url}/${row.id}`, 'DELETE')).status).toBe(204);
  expect(await (await fetch(url)).json()).toEqual([]);
  expect((await request(`${url}/9999999`, 'DELETE')).status).toBe(404);
});

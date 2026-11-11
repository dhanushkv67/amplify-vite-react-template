import { afterAll, beforeEach, expect, test, vi } from 'vitest';
import request from 'supertest';
import { Pool } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Contract pinned by the owner: createApp({db}) and project-scoped /api routes.
// Tests deliberately import the implementation at runtime: Vitest still collects
// all criteria and identifies the missing application in each failing case.
const db = new Pool({ connectionString: process.env.DATABASE_URL });
let app: ReturnType<typeof import('../src/app').createApp>;
let migrated = false;
let sequence = 0;
const email = () => `acceptance-${Date.now()}-${++sequence}@example.test`;
const password = 'A-long-test-password-123!';
const api = () => request(app);

beforeEach(async () => {
  const { createApp } = await import('../src/app');
  if (!migrated) {
    const migrationDir = new URL('../migrations/', import.meta.url);
    for (const name of (await readdir(migrationDir)).filter(n => n.endsWith('.sql')).sort()) {
      await db.query(await readFile(join(migrationDir.pathname, name), 'utf8'));
    }
    migrated = true;
  }
  app = createApp({ db });
});
afterAll(async () => { await db.end(); });

async function member() {
  const address = email();
  const agent = request.agent(app);
  expect((await agent.post('/api/auth/signup').send({ email: address, password })).status).toBeLessThan(300);
  expect((await agent.post('/api/auth/login').send({ email: address, password })).status).toBeLessThan(300);
  return { agent, address };
}
async function project(agent: ReturnType<typeof request.agent>) {
  const res = await agent.post('/api/projects').send({ name: 'Acceptance project' });
  expect(res.status).toBeLessThan(300);
  return res.body.id as string;
}
async function task(agent: ReturnType<typeof request.agent>, id: string, title = 'Acceptance task') {
  const res = await agent.post(`/api/projects/${id}/tasks`).send({ title });
  expect(res.status).toBeLessThan(300);
  return res.body.id as string;
}

 test('AC1 account creation rejects duplicate/malformed email and invalid password', async () => {
  const address = email();
  expect((await api().post('/api/auth/signup').send({ email: address, password })).status).toBeLessThan(300);
  for (const body of [{ email: address.toUpperCase(), password }, { email: 'bad', password }, { email: email(), password: 'short' }]) {
    expect((await api().post('/api/auth/signup').send(body)).status).toBeGreaterThanOrEqual(400);
  }
});

test('AC2 valid login/logout, invalid credentials and expired sessions protect data', async () => {
  const { agent, address } = await member();
  expect((await agent.get('/api/auth/me')).status).toBe(200);
  expect((await api().post('/api/auth/login').send({ email: address, password: 'wrong' })).status).toBeGreaterThanOrEqual(400);
  await agent.post('/api/auth/logout');
  expect((await agent.get('/api/auth/me')).status).toBeGreaterThanOrEqual(400);
  expect((await agent.get('/api/projects')).status).toBeGreaterThanOrEqual(400);
  const fresh = request.agent(app);
  await fresh.post('/api/auth/login').send({ email: address, password });
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);
    expect((await fresh.get('/api/auth/me')).status).toBeGreaterThanOrEqual(400);
    expect((await fresh.get('/api/projects')).status).toBeGreaterThanOrEqual(400);
  } finally { vi.useRealTimers(); }
});

test('AC3 authenticated creator joins a named project; blank names are rejected', async () => {
  const { agent } = await member();
  const id = await project(agent);
  const created = await agent.get(`/api/projects/${id}`);
  expect(created.status).toBe(200);
  expect(created.body.creatorId).toBeTruthy();
  expect((await agent.get(`/api/projects/${id}/members`)).text).toContain(created.body.creatorId);
  expect((await agent.post('/api/projects').send({ name: '  ' })).status).toBeGreaterThanOrEqual(400);
});

test('AC4 creator adds existing email only, not unknown/duplicate or noncreator', async () => {
  const owner = await member(), invited = await member(), outsider = await member();
  const id = await project(owner.agent), route = `/api/projects/${id}/members`;
  expect((await owner.agent.post(route).send({ email: invited.address })).status).toBeLessThan(300);
  expect((await owner.agent.post(route).send({ email: invited.address })).status).toBeGreaterThanOrEqual(400);
  expect((await owner.agent.post(route).send({ email: email() })).status).toBeGreaterThanOrEqual(400);
  expect((await invited.agent.post(route).send({ email: outsider.address })).status).toBeGreaterThanOrEqual(400);
  const listed = await owner.agent.get(route);
  expect(listed.text).toContain(invited.address);
  expect(listed.text).not.toContain(outsider.address);
});

test('AC5 creator removes member; removed member immediately loses task access', async () => {
  const owner = await member(), invited = await member();
  const id = await project(owner.agent), route = `/api/projects/${id}/members`;
  const added = await owner.agent.post(route).send({ email: invited.address });
  const tid = await task(owner.agent, id);
  expect((await invited.agent.get(`/api/projects/${id}/tasks/${tid}`)).status).toBe(200);
  expect((await invited.agent.delete(`${route}/${added.body.id}`)).status).toBeGreaterThanOrEqual(400);
  expect((await owner.agent.delete(`${route}/${added.body.id}`)).status).toBeLessThan(300);
  for (const call of [invited.agent.get(`/api/projects/${id}/tasks/${tid}`), invited.agent.patch(`/api/projects/${id}/tasks/${tid}`).send({ title: 'No access' }), invited.agent.post(`/api/projects/${id}/tasks/${tid}/comments`).send({ text: 'No access' })]) {
    expect((await call).status).toBeGreaterThanOrEqual(400);
  }
});

test('AC6 task creation validates title, due date and project-scoped assignee; default To do', async () => {
  const owner = await member(), outsider = await member(), id = await project(owner.agent);
  const created = await owner.agent.post(`/api/projects/${id}/tasks`).send({ title: 'Valid' });
  expect(created.status).toBeLessThan(300);
  expect(created.body.status).toBe('To do');
  for (const body of [{ title: ' ' }, { title: 'Bad date', dueDate: 'not-a-date' }, { title: 'Bad assignee', assigneeId: (await outsider.agent.get('/api/auth/me')).body.id }]) {
    expect((await owner.agent.post(`/api/projects/${id}/tasks`).send(body)).status).toBeGreaterThanOrEqual(400);
  }
});

test('AC7 member edits task fields/status; invalid status or nonmember cannot change it', async () => {
  const owner = await member(), outsider = await member(), id = await project(owner.agent), tid = await task(owner.agent, id);
  const route = `/api/projects/${id}/tasks/${tid}`;
  expect((await owner.agent.patch(route).send({ title: 'Edited', description: 'Detail', dueDate: '2026-12-01', status: 'In progress' })).status).toBeLessThan(300);
  expect((await owner.agent.patch(route).send({ status: 'Invented' })).status).toBeGreaterThanOrEqual(400);
  expect((await outsider.agent.patch(route).send({ title: 'Hijack' })).status).toBeGreaterThanOrEqual(400);
  const current = await owner.agent.get(route);
  expect(current.body.title).toBe('Edited');
  expect(current.body.status).toBe('In progress');
});

test('AC8 board exposes only member tasks once in the right status after refresh', async () => {
  const owner = await member(), id = await project(owner.agent), tid = await task(owner.agent, id);
  expect((await owner.agent.patch(`/api/projects/${id}/tasks/${tid}`).send({ status: 'Done' })).status).toBeLessThan(300);
  const board = await owner.agent.get(`/api/projects/${id}/tasks`);
  expect(board.status).toBe(200);
  expect(board.body.filter((item: { id: string }) => item.id === tid)).toHaveLength(1);
  expect(board.body.find((item: { id: string }) => item.id === tid).status).toBe('Done');
});

test('AC9 comments require membership/content and return author/time as inert text', async () => {
  const owner = await member(), outsider = await member(), id = await project(owner.agent), tid = await task(owner.agent, id);
  const route = `/api/projects/${id}/tasks/${tid}/comments`, text = '<script>alert(1)</script>';
  const added = await owner.agent.post(route).send({ text });
  expect(added.status).toBeLessThan(300);
  expect(added.body).toMatchObject({ text });
  expect(added.body.author).toBeTruthy();
  expect(added.body.createdAt).toBeTruthy();
  expect((await owner.agent.post(route).send({ text: '  ' })).status).toBeGreaterThanOrEqual(400);
  expect((await outsider.agent.post(route).send({ text: 'Leak' })).status).toBeGreaterThanOrEqual(400);
});

test('AC10 visitor and nonmember cannot list/open/search/change or comment on private tasks', async () => {
  const owner = await member(), outsider = await member(), id = await project(owner.agent), tid = await task(owner.agent, id, 'Private marker');
  for (const route of [`/api/projects/${id}/tasks`, `/api/projects/${id}/tasks/${tid}`, `/api/projects/${id}/tasks/${tid}/comments`]) {
    for (const unauthorised of [api(), outsider.agent]) {
      const result = await unauthorised.get(route);
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.text).not.toContain('Private marker');
    }
  }
  expect((await outsider.agent.patch(`/api/projects/${id}/tasks/${tid}`).send({ title: 'Intrusion' })).status).toBeGreaterThanOrEqual(400);
});

test('AC11 stored project/task/comment survives new client session and failed saves are errors', async () => {
  const owner = await member(), id = await project(owner.agent), tid = await task(owner.agent, id);
  await owner.agent.post(`/api/projects/${id}/tasks/${tid}/comments`).send({ text: 'Persist me' });
  const fresh = request.agent(app);
  await fresh.post('/api/auth/login').send({ email: owner.address, password });
  expect((await fresh.get(`/api/projects/${id}/tasks/${tid}`)).body.title).toBe('Acceptance task');
  expect((await fresh.get(`/api/projects/${id}/tasks/${tid}/comments`)).text).toContain('Persist me');
  expect((await fresh.patch(`/api/projects/${id}/tasks/${tid}`).send({ status: 'invalid' })).status).toBeGreaterThanOrEqual(400);
  app = (await import('../src/app')).createApp({ db }); // fresh app instance, same persistent database
  expect((await request.agent(app).post('/api/auth/login').send({ email: owner.address, password })).status).toBeLessThan(300);
});

test('AC13 protected routes deny unauthenticated data and password is not stored in plaintext', async () => {
  const owner = await member(), id = await project(owner.agent);
  expect((await api().get(`/api/projects/${id}/tasks`)).status).toBeGreaterThanOrEqual(400);
  const result = await db.query('SELECT * FROM users WHERE lower(email) = lower($1)', [owner.address]);
  expect(result.rows).toHaveLength(1);
  expect(JSON.stringify(result.rows[0])).not.toContain(password);
  const denied = await api().get(`/api/projects/${id}/tasks`);
  expect(denied.text).not.toContain('Acceptance project');
});

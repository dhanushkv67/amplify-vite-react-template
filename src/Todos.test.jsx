import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const saved = (rows) => ({ ok: true, status: 200, json: async () => rows });
const response = (row, status = 200) => ({ ok: true, status, json: async () => row });
const todo = (id, title, done = false) => ({ id, title, done });
async function mount(fetchMock) {
  vi.stubGlobal('fetch', fetchMock);
  const { default: Todos } = await import('./Todos.jsx');
  return render(<Todos />);
}
const loading = (rows = []) => vi.fn().mockResolvedValueOnce(saved(rows));
const titleBox = () => screen.getByRole('textbox');
const add = () => fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.resetModules(); });

test('AC1 shows Todos input, Add and list alongside Cart', async () => {
  vi.stubGlobal('fetch', loading());
  document.body.innerHTML = '<div id="root"></div>';
  await import('./main.jsx');
  expect(await screen.findByText('Todos')).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
  expect(screen.getByRole('list')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Show cart' })).toBeInTheDocument();
});

test('AC2 adds a trimmed title first and clears the box', async () => {
  const fetchMock = loading([todo(1, 'older')]).mockResolvedValueOnce(response(todo(2, 'newer'), 201));
  await mount(fetchMock);
  expect(await screen.findByText('older')).toBeInTheDocument();
  fireEvent.change(titleBox(), { target: { value: '  newer  ' } }); add();
  expect(await screen.findByText('newer')).toBeInTheDocument();
  expect(within(screen.getByRole('list')).getAllByRole('listitem').map(li => li.textContent)).toEqual(expect.arrayContaining(['newer', 'older']));
  expect(within(screen.getByRole('list')).getAllByRole('listitem')[0]).toHaveTextContent('newer');
  expect(titleBox()).toHaveValue('');
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).title).toBe('newer');
});

test('AC3 rejects blank input with the exact message and does not add', async () => {
  const fetchMock = loading(); await mount(fetchMock);
  await screen.findByText('0 items left');
  fireEvent.change(titleBox(), { target: { value: ' \t ' } }); add();
  expect(screen.getByText('Please type a todo first')).toBeInTheDocument();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('AC4 checks and reopens a todo, toggling strike-through', async () => {
  const fetchMock = loading([todo(1, 'write')])
    .mockResolvedValueOnce(response(todo(1, 'write', true)))
    .mockResolvedValueOnce(response(todo(1, 'write', false)));
  await mount(fetchMock);
  const checkbox = await screen.findByRole('checkbox');
  expect(screen.getByText('write')).not.toHaveStyle({ textDecoration: 'line-through' });
  fireEvent.click(checkbox);
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked());
  expect(screen.getByText('write')).toHaveStyle({ textDecoration: 'line-through' });
  fireEvent.click(screen.getByRole('checkbox'));
  await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeChecked());
  expect(screen.getByText('write')).not.toHaveStyle({ textDecoration: 'line-through' });
  expect(fetchMock.mock.calls.slice(1).map(call => JSON.parse(call[1].body).done)).toEqual([true, false]);
});

test('AC5 removes a deleted todo from the displayed list', async () => {
  const fetchMock = loading([todo(1, 'remove')]).mockResolvedValueOnce({ ok: true, status: 204 });
  await mount(fetchMock); await screen.findByText('remove');
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  await waitFor(() => expect(screen.queryByText('remove')).not.toBeInTheDocument());
  expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
});

test('AC6 counts unfinished todos with zero, singular and plural grammar', async () => {
  const view = await mount(loading([todo(1, 'done', true), todo(2, 'one')]));
  expect(await screen.findByText('1 item left')).toBeInTheDocument();
  view.unmount();
  await mount(loading([todo(1, 'done', true)]));
  expect(await screen.findByText('0 items left')).toBeInTheDocument();
  cleanup();
  await mount(loading([todo(1, 'a'), todo(2, 'b')]));
  expect(await screen.findByText('2 items left')).toBeInTheDocument();
});

test('AC12 loads via API and preserves the list with an error when server is unavailable', async () => {
  const fetchMock = loading([todo(1, 'kept')]).mockRejectedValueOnce(new Error('offline'));
  await mount(fetchMock); await screen.findByText('kept');
  fireEvent.change(titleBox(), { target: { value: 'lost' } }); add();
  await screen.findByText(/error|unavailable|failed/i);
  expect(screen.getByText('kept')).toBeInTheDocument();
  expect(screen.queryByText('lost')).not.toBeInTheDocument();
  expect(fetchMock.mock.calls[0][0]).toContain('/api/todos');
  expect(fetchMock.mock.calls[1][0]).toContain('/api/todos');
});

test('AC13 preserves cart toggle and total in the combined app', async () => {
  vi.stubGlobal('fetch', loading());
  document.body.innerHTML = '<div id="root"></div>';
  await import('./main.jsx');
  expect(await screen.findByText('Total: $2')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show cart' }));
  expect(screen.getByText('pen: $2')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Hide cart' }));
  expect(screen.queryByText('pen: $2')).not.toBeInTheDocument();
});

test('AC14 keeps UI/API tests in the npm test suite and a build command', async () => {
  const { readFileSync } = await import('node:fs');
  const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
  expect(scripts.test).toMatch(/vitest/);
  expect(scripts.build).toMatch(/vite build/);
  expect(readFileSync('server/todos.test.js', 'utf8')).toMatch(/AC(?:7|8|9|10|11)/);
  expect(readFileSync('src/Todos.test.jsx', 'utf8')).toMatch(/AC(?:1|2|3|4|5|6|12|13)/);
});

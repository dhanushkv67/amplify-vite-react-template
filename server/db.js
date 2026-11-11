import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openTodos(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)');
  const list = db.prepare('SELECT id, title, done FROM todos ORDER BY id DESC');
  const get = db.prepare('SELECT id, title, done FROM todos WHERE id = ?');
  const insert = db.prepare('INSERT INTO todos (title) VALUES (?)');
  const update = db.prepare('UPDATE todos SET done = ? WHERE id = ?');
  const remove = db.prepare('DELETE FROM todos WHERE id = ?');
  const row = value => value ? { ...value, done: Boolean(value.done) } : null;
  return {
    list: () => list.all().map(row),
    create: title => row(get.get(insert.run(title).lastInsertRowid)),
    setDone: (id, done) => { if (!update.run(Number(done), id).changes) return null; return row(get.get(id)); },
    delete: id => Boolean(remove.run(id).changes),
    close: () => db.close(),
  };
}

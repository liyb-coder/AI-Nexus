import { describe, it, expect, afterAll } from 'vitest';
import { getDatabase, closeDatabase } from '../src/db/database.js';

describe('Database', () => {

  afterAll(() => {
    closeDatabase();
  });

  it('should initialize and create tables', async () => {
    const db = await getDatabase();

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('models');
    expect(tableNames).toContain('skills');
    expect(tableNames).toContain('tasks');
    expect(tableNames).toContain('task_events');
    expect(tableNames).toContain('materials');
    expect(tableNames).toContain('mcp_servers');
    expect(tableNames).toContain('approvals');
    expect(tableNames).toContain('settings');
    expect(tableNames).toContain('audit_log');
  });

  it('should have default models seeded', async () => {
    const db = await getDatabase();
    const models = db.prepare('SELECT * FROM models').all() as { id: string; name: string }[];
    expect(models.length).toBeGreaterThanOrEqual(5);
    expect(models.find((m) => m.id === 'kimi')).toBeTruthy();
    expect(models.find((m) => m.id === 'claude')).toBeTruthy();
    expect(models.find((m) => m.id === 'deepseek')).toBeTruthy();
  });

  it('should have default skills seeded', async () => {
    const db = await getDatabase();
    const skills = db.prepare('SELECT * FROM skills').all() as { id: string; name: string }[];
    expect(skills.length).toBeGreaterThanOrEqual(4);
  });

  it('should support CRUD on models', async () => {
    const db = await getDatabase();

    // Read
    const kimi = db.prepare('SELECT * FROM models WHERE id = ?').get('kimi') as { id: string; enabled: number };
    expect(kimi).toBeTruthy();
    expect(kimi.enabled).toBe(1);

    // Update
    db.prepare('UPDATE models SET enabled = 0, updated_at = ? WHERE id = ?').run(Date.now(), 'kimi');
    const updated = db.prepare('SELECT * FROM models WHERE id = ?').get('kimi') as { enabled: number };
    expect(updated.enabled).toBe(0);

    // Restore
    db.prepare('UPDATE models SET enabled = 1, updated_at = ? WHERE id = ?').run(Date.now(), 'kimi');
  });

  it('should cascade delete task events when task is deleted', async () => {
    const db = await getDatabase();

    db.prepare("INSERT INTO tasks (id, title, query, status, model_ids, model_names) VALUES ('test_task', 'Test', 'test', 'in_progress', '[]', '[]')").run();
    db.prepare("INSERT INTO task_events (id, task_id, type, description, timestamp) VALUES ('test_evt', 'test_task', 'query', 'test', ?)").run(Date.now());

    let evt = db.prepare('SELECT * FROM task_events WHERE id = ?').get('test_evt');
    expect(evt).toBeTruthy();

    db.prepare('DELETE FROM tasks WHERE id = ?').run('test_task');
    evt = db.prepare('SELECT * FROM task_events WHERE id = ?').get('test_evt');
    expect(evt).toBeFalsy();
  });
});

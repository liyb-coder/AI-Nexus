import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { APIResponse, TaskRow, TaskEventRow, MaterialRow } from '../types.js';

const router = Router();

/** GET /api/tasks — list all tasks (most recent first) */
router.get('/', async (_req, res) => {
  try {
    const db = await getDatabase();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50').all() as TaskRow[];
    res.json({ ok: true, data: tasks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** GET /api/tasks/:id — get a task with events and materials */
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
    if (!task) {
      res.status(404).json({ ok: false, error: 'Task not found' });
      return;
    }

    const events = db.prepare('SELECT * FROM task_events WHERE task_id = ? ORDER BY timestamp ASC').all(id) as TaskEventRow[];
    const materials = db.prepare('SELECT * FROM materials WHERE task_id = ? ORDER BY created_at ASC').all(id) as MaterialRow[];

    res.json({
      ok: true,
      data: {
        ...task,
        model_ids: JSON.parse(task.model_ids),
        model_names: JSON.parse(task.model_names),
        events,
        materials,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** DELETE /api/tasks/:id — delete a task */
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;

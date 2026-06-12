import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { MaterialRow } from '../types.js';
import { v4 as uuid } from 'uuid';

const router = Router();

/** GET /api/materials */
router.get('/', async (_req, res) => {
  try {
    const db = await getDatabase();
    const materials = db.prepare('SELECT * FROM materials ORDER BY created_at DESC LIMIT 100').all() as MaterialRow[];
    res.json({ ok: true, data: materials });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** POST /api/materials */
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { content, sourceModel, sourceModelColor, sourceResponseId, label, taskId } = req.body;

    if (!content) {
      res.status(400).json({ ok: false, error: 'content is required' });
      return;
    }

    const id = uuid();
    db.prepare(`
      INSERT INTO materials (id, task_id, content, source_model, source_model_color, source_response_id, label, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, taskId || null, content, sourceModel || '手动添加', sourceModelColor || '#888', sourceResponseId || null, label || null, Date.now());

    const created = db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as MaterialRow;
    res.status(201).json({ ok: true, data: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** DELETE /api/materials/:id */
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;

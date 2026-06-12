import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { APIResponse, ModelRow } from '../types.js';

const router = Router();

/** GET /api/models — list all models */
router.get('/', async (_req, res) => {
  try {
    const db = await getDatabase();
    const models = db.prepare('SELECT * FROM models ORDER BY enabled DESC, name ASC').all() as ModelRow[];
    const response: APIResponse<ModelRow[]> = { ok: true, data: models };
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** PUT /api/models/:id — update a model */
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const updates = req.body as Partial<ModelRow>;

    const existing = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as ModelRow | undefined;
    if (!existing) {
      res.status(404).json({ ok: false, error: 'Model not found' });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(Date.now());
      values.push(id);

      db.prepare(`UPDATE models SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as ModelRow;
    res.json({ ok: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** PATCH /api/models/:id/toggle — toggle model enabled state */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;

    const model = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as ModelRow | undefined;
    if (!model) {
      res.status(404).json({ ok: false, error: 'Model not found' });
      return;
    }

    db.prepare('UPDATE models SET enabled = ?, updated_at = ? WHERE id = ?')
      .run(model.enabled ? 0 : 1, Date.now(), id);

    const updated = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as ModelRow;
    res.json({ ok: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** POST /api/models — add a custom model */
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const model = req.body as Partial<ModelRow>;

    if (!model.id || !model.name) {
      res.status(400).json({ ok: false, error: 'id and name are required' });
      return;
    }

    const now = Date.now();
    db.prepare(`
      INSERT INTO models (id, name, color, icon, enabled, endpoint, api_key_env, temperature, max_tokens, provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      model.id, model.name,
      model.color || '#5E8B7E', model.icon || 'Brain',
      model.enabled ?? 1, model.endpoint || null, model.api_key_env || null,
      model.temperature ?? 0.7, model.max_tokens ?? 4096,
      model.provider || 'openai-compatible', now, now
    );

    const created = db.prepare('SELECT * FROM models WHERE id = ?').get(model.id) as ModelRow;
    res.status(201).json({ ok: true, data: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;

import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { SkillRow } from '../types.js';

const router = Router();

/** GET /api/skills */
router.get('/', async (_req, res) => {
  try {
    const db = await getDatabase();
    const skills = db.prepare('SELECT * FROM skills ORDER BY usage_count DESC').all() as SkillRow[];
    const parsed = skills.map((s) => ({
      ...s,
      tags: JSON.parse(s.tags),
    }));
    res.json({ ok: true, data: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** POST /api/skills */
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const s = req.body as Partial<SkillRow>;
    if (!s.id || !s.name || !s.prompt) {
      res.status(400).json({ ok: false, error: 'id, name, and prompt are required' });
      return;
    }

    const now = Date.now();
    db.prepare(`
      INSERT INTO skills (id, name, description, prompt, icon, color, category, tags, usage_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(s.id, s.name, s.description || null, s.prompt, s.icon || 'code', s.color || '#7e22ce', s.category || 'custom', JSON.stringify(s.tags || []), now, now);

    const created = db.prepare('SELECT * FROM skills WHERE id = ?').get(s.id) as SkillRow;
    res.status(201).json({ ok: true, data: { ...created, tags: JSON.parse(created.tags) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** PUT /api/skills/:id */
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as SkillRow | undefined;
    if (!existing) {
      res.status(404).json({ ok: false, error: 'Skill not found' });
      return;
    }

    const updates = req.body as Partial<SkillRow>;
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && value !== undefined) {
        if (key === 'tags' && Array.isArray(value)) {
          fields.push('tags = ?');
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(Date.now());
      values.push(id);
      db.prepare(`UPDATE skills SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as SkillRow;
    res.json({ ok: true, data: { ...updated, tags: JSON.parse(updated.tags) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** DELETE /api/skills/:id */
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;

import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { MCPServerRow } from '../types.js';

const router = Router();

/** GET /api/mcp */
router.get('/', async (_req, res) => {
  try {
    const db = await getDatabase();
    const servers = db.prepare('SELECT * FROM mcp_servers ORDER BY name ASC').all() as MCPServerRow[];
    const parsed = servers.map((s) => ({
      ...s,
      args: JSON.parse(s.args),
      env: JSON.parse(s.env),
      tools: JSON.parse(s.tools),
      resources: JSON.parse(s.resources),
    }));
    res.json({ ok: true, data: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** PUT /api/mcp/:id */
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM mcp_servers WHERE id = ?').get(id) as MCPServerRow | undefined;
    if (!existing) {
      res.status(404).json({ ok: false, error: 'MCP server not found' });
      return;
    }

    const updates = req.body as Partial<MCPServerRow>;
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && value !== undefined) {
        if (['args', 'env', 'tools', 'resources'].includes(key) && typeof value !== 'string') {
          fields.push(`${key} = ?`);
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
      db.prepare(`UPDATE mcp_servers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM mcp_servers WHERE id = ?').get(id) as MCPServerRow;
    res.json({
      ok: true,
      data: { ...updated, args: JSON.parse(updated.args), env: JSON.parse(updated.env), tools: JSON.parse(updated.tools), resources: JSON.parse(updated.resources) },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;

import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import { cliExecutor, assessRisk } from '../services/cli-executor.js';

const router = Router();

/** GET /api/settings */
router.get('/', async (_req, res) => {
  try {
    const db = await getDatabase();
    const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json({ ok: true, data: settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** PUT /api/settings/:key */
router.put('/:key', async (req, res) => {
  try {
    const db = await getDatabase();
    const { key } = req.params;
    const { value } = req.body;

    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));

    res.json({ ok: true, data: { key, value: String(value) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** GET /api/settings/cli — list CLI configs */
router.get('/cli', async (_req, res) => {
  try {
    const db = await getDatabase();
    const configs = db.prepare('SELECT * FROM cli_configs ORDER BY name ASC').all();
    const parsed = (configs as Array<Record<string, unknown>>).map((c) => ({
      ...c,
      env_vars: JSON.parse(c.env_vars as string),
    }));
    res.json({ ok: true, data: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** POST /api/settings/cli — add CLI config */
router.post('/cli', async (req, res) => {
  try {
    const db = await getDatabase();
    const c = req.body;
    if (!c.id || !c.name || !c.command) {
      res.status(400).json({ ok: false, error: 'id, name, and command are required' });
      return;
    }

    db.prepare(`
      INSERT INTO cli_configs (id, name, command, version, status, description, risk_level, auto_approve, working_dir, env_vars)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, c.name, c.command, c.version || null, c.status || 'ready', c.description || null, c.risk_level || 'medium', c.auto_approve ? 1 : 0, c.working_dir || null, JSON.stringify(c.env_vars || {}));

    res.status(201).json({ ok: true, data: req.body });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** POST /api/cli/execute — execute a CLI command (with approval check) */
router.post('/cli/execute', async (req, res) => {
  try {
    const { tool, command, workingDir, purpose, envVars, approvalId } = req.body;

    if (!command) {
      res.status(400).json({ ok: false, error: 'command is required' });
      return;
    }

    const riskLevel = assessRisk(command);

    // Check if approval is resolved
    if (riskLevel !== 'low') {
      if (!approvalId) {
        // Create approval request — frontend must resolve it
        const newApprovalId = cliExecutor.createApproval({
          tool: tool || 'cli',
          command,
          workingDir: workingDir || process.cwd(),
          riskLevel,
          purpose: purpose || 'CLI 命令执行',
          envVars,
        });

        res.json({
          ok: true,
          data: {
            requiresApproval: true,
            approvalId: newApprovalId,
            riskLevel,
          },
        });
        return;
      }

      // Check if this approval was resolved
      const db = await getDatabase();
      const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as { resolved: number; approved: number } | undefined;
      if (!approval || !approval.resolved) {
        res.json({
          ok: true,
          data: {
            requiresApproval: true,
            approvalId,
            riskLevel,
            message: '等待审批',
          },
        });
        return;
      }
      if (!approval.approved) {
        res.status(403).json({ ok: false, error: '命令已被拒绝' });
        return;
      }
    }

    // Execute
    const result = await cliExecutor.execute({
      tool: tool || 'cli',
      command,
      workingDir: workingDir || process.cwd(),
      riskLevel,
      purpose: purpose || 'CLI 命令执行',
      envVars,
    });

    res.json({ ok: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** POST /api/cli/approve/:id — resolve a CLI approval */
router.post('/cli/approve/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const result = cliExecutor.resolveApproval(id, !!approved);
    res.json({ ok: true, data: { approved: result } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/** POST /api/cli/assess-risk — assess risk level of a command */
router.post('/cli/assess-risk', (req, res) => {
  const { command } = req.body;
  if (!command) {
    res.status(400).json({ ok: false, error: 'command is required' });
    return;
  }

  const riskLevel = assessRisk(command);
  res.json({ ok: true, data: { command, riskLevel } });
});

export default router;

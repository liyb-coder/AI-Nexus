import { Router } from 'express';
import { detectorRegistry } from '../detectors/index.js';
import type { APIResponse, DetectedAccount } from '../types.js';

const router = Router();

/**
 * GET /api/auth/status
 * Returns the current authentication status for all detected accounts.
 */
router.get('/status', async (_req, res) => {
  try {
    const accounts: DetectedAccount[] = await detectorRegistry.scanAll();

    const summary = {
      authenticated: accounts.filter((a) => a.status === 'authenticated').length,
      keyFound: accounts.filter((a) => a.status === 'key_found').length,
      notFound: accounts.filter((a) => a.status === 'not_found').length,
      error: accounts.filter((a) => a.status === 'error').length,
      total: accounts.length,
      accounts,
    };

    const response: APIResponse<typeof summary> = { ok: true, data: summary };
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const response: APIResponse<never> = { ok: false, error: message };
    res.status(500).json(response);
  }
});

/**
 * POST /api/auth/rescan
 * Force a re-scan of all accounts.
 */
router.post('/rescan', async (_req, res) => {
  try {
    const accounts = await detectorRegistry.scanAll();
    const response: APIResponse<{ accounts: DetectedAccount[] }> = {
      ok: true,
      data: { accounts },
    };
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const response: APIResponse<never> = { ok: false, error: message };
    res.status(500).json(response);
  }
});

export default router;

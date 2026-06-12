import { BaseDetector, HOME } from './base-detector.js';
import type { DetectedAccount } from '../types.js';
import { join } from 'path';

/**
 * Codex / OpenAI detector:
 * 1. Check ~/.codex/ auth.json (Codex Desktop App)
 * 2. Check CC Switch SQLite database for Codex providers
 * 3. Check OPENAI_API_KEY env var
 * 4. Check codex CLI installation
 */
export class CodexDetector extends BaseDetector {
  name = 'codex';

  async detect(): Promise<DetectedAccount[]> {
    const results: DetectedAccount[] = [];

    // 1. Codex Desktop App auth.json
    const authJson = join(HOME, '.codex', 'auth.json');
    if (this.fileExists(authJson)) {
      try {
        const { readFileSync } = await import('fs');
        const content = readFileSync(authJson, 'utf-8');
        // Check if it contains valid auth data
        if (content.includes('access_token') || content.includes('OPENAI_API_KEY')) {
          results.push(this.authenticated('codex', 'oauth', '~/.codex/auth.json', 'Codex Desktop (已登录)'));
        }
      } catch {
        // Ignore parse errors
      }
    }

    // 2. CC Switch database — find Codex/OpenAI providers
    const ccSwitchDb = join(HOME, '.cc-switch', 'cc-switch.db');
    if (this.fileExists(ccSwitchDb)) {
      try {
        const { readFileSync } = await import('fs');
        const buffer = readFileSync(ccSwitchDb);
        const sqlModule = await import('sql.js');
        const initSqlJs = sqlModule.default;
        const SQL = await initSqlJs();
        const sqlDb = new SQL.Database(buffer);

        const rows = sqlDb.exec(
          "SELECT name, settings_config FROM providers WHERE app_type='codex' AND (settings_config LIKE '%OPENAI_API_KEY%' OR settings_config LIKE '%access_token%')"
        );

        if (rows.length > 0 && rows[0].values.length > 0) {
          const name = rows[0].values[0][0] as string;
          results.push({
            provider: 'codex',
            status: 'authenticated',
            authType: 'api_key',
            source: `CC Switch: ${name}`,
            displayName: name as string,
            lastVerified: Date.now(),
            requiresReauth: false,
          });
        }

        sqlDb.close();
      } catch {
        // Ignore
      }
    }

    // 3. OPENAI_API_KEY env var
    if (this.hasEnvVar('OPENAI_API_KEY')) {
      const key = this.getEnvVar('OPENAI_API_KEY');
      // Don't duplicate if already found from CC Switch
      if (!results.some(r => r.status === 'authenticated')) {
        results.push(this.keyFound('openai', 'env:OPENAI_API_KEY', key));
      }
    }

    // 4. Codex CLI check
    const codexVersion = this.runCmd('codex --version');
    if (codexVersion) {
      results.push({
        provider: 'codex-cli',
        status: 'authenticated',
        authType: 'cli_config',
        source: 'CLI: codex',
        displayName: codexVersion,
        lastVerified: Date.now(),
        requiresReauth: false,
      });
    }

    if (results.length === 0) {
      results.push(this.notFound('codex', 'oauth'));
    }

    return results;
  }
}

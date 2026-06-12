import { BaseDetector, HOME } from './base-detector.js';
import type { DetectedAccount } from '../types.js';
import { join } from 'path';

/**
 * DeepSeek detector:
 * 1. DEEPSEEK_API_KEY env var
 * 2. CC Switch SQLite database (cc-switch.db providers table)
 */
export class DeepSeekDetector extends BaseDetector {
  name = 'deepseek';

  async detect(): Promise<DetectedAccount[]> {
    const results: DetectedAccount[] = [];

    // 1. Direct env var
    if (this.hasEnvVar('DEEPSEEK_API_KEY')) {
      const key = this.getEnvVar('DEEPSEEK_API_KEY');
      results.push(this.keyFound('deepseek', 'env:DEEPSEEK_API_KEY', key));
    }

    // 2. CC Switch database — find DeepSeek provider
    const ccSwitchDb = join(HOME, '.cc-switch', 'cc-switch.db');
    if (this.fileExists(ccSwitchDb)) {
      try {
        const { readFileSync } = await import('fs');
        const sqlModule = await import('sql.js');
        const initSqlJs = sqlModule.default;
        const SQL = await initSqlJs();
        const buffer = readFileSync(ccSwitchDb);
        const sqlDb = new SQL.Database(buffer);

        // Find providers with DeepSeek base URL or auth token
        const stmt = sqlDb.prepare(
          "SELECT name, app_type, settings_config FROM providers WHERE settings_config LIKE '%deepseek%' OR settings_config LIKE '%ANTHROPIC_AUTH_TOKEN%'"
        );
        const foundAccounts: Array<{ name: string; appType: string }> = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          const config = row.settings_config as string;
          const isDS = config.includes('deepseek.com');
          const hasToken = config.includes('ANTHROPIC_AUTH_TOKEN');
          if (isDS && hasToken) {
            foundAccounts.push({ name: row.name as string, appType: row.app_type as string });
          }
        }
        stmt.free();

        if (foundAccounts.length > 0) {
          const account = foundAccounts[0];
          results.push({
            provider: 'deepseek',
            status: 'authenticated',
            authType: 'api_key',
            source: `CC Switch: ${account.name}`,
            displayName: 'DeepSeek via CC Switch',
            lastVerified: Date.now(),
            requiresReauth: false,
          });
        }

        sqlDb.close();
      } catch {
        // CC Switch DB may be locked or unreadable
      }
    }

    if (results.length === 0) {
      results.push(this.notFound('deepseek', 'api_key'));
    }

    return results;
  }
}

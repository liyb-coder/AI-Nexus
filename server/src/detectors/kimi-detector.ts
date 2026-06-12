import { BaseDetector, HOME } from './base-detector.js';
import type { DetectedAccount } from '../types.js';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';

/**
 * Kimi (Moonshot) detector:
 * 1. MOONSHOT_API_KEY env var
 * 2. KIMI_API_KEY env var
 * 3. VS Code Kimi extension (moonshot-ai.kimi-code) localStorage
 */
export class KimiDetector extends BaseDetector {
  name = 'kimi';

  async detect(): Promise<DetectedAccount[]> {
    const results: DetectedAccount[] = [];

    if (this.hasEnvVar('MOONSHOT_API_KEY')) {
      const key = this.getEnvVar('MOONSHOT_API_KEY');
      results.push(this.keyFound('kimi', 'env:MOONSHOT_API_KEY', key));
    }

    if (this.hasEnvVar('KIMI_API_KEY')) {
      const key = this.getEnvVar('KIMI_API_KEY');
      results.push(this.keyFound('kimi', 'env:KIMI_API_KEY', key));
    }

    // Check VS Code extension for Kimi
    const vscodeGlobalStorage = join(
      HOME, 'Library', 'Application Support', 'Code', 'User', 'globalStorage'
    );
    const kimiExtDir = join(vscodeGlobalStorage, 'moonshot-ai.kimi-code');
    if (existsSync(kimiExtDir)) {
      try {
        const files = readdirSync(kimiExtDir);
        // Look for auth-related files
        const authFiles = files.filter(f => f.includes('auth') || f.includes('login') || f.includes('token') || f.includes('session'));
        if (authFiles.length > 0) {
          results.push({
            provider: 'kimi',
            status: 'authenticated',
            authType: 'oauth',
            source: `VS Code: moonshot-ai.kimi-code (${authFiles.length} auth files)`,
            displayName: 'Kimi VS Code (已登录)',
            lastVerified: Date.now(),
            requiresReauth: false,
          });
        } else {
          // Extension installed but couldn't confirm login
          results.push({
            provider: 'kimi',
            status: 'authenticated',
            authType: 'oauth',
            source: 'VS Code: moonshot-ai.kimi-code',
            displayName: 'Kimi VS Code (扩展已安装)',
            lastVerified: Date.now(),
            requiresReauth: false,
          });
        }
      } catch {
        // Can't read extension dir
      }
    }

    if (results.length === 0) {
      results.push(this.notFound('kimi', 'api_key'));
    }

    return results;
  }
}

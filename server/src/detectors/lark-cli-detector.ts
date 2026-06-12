import { BaseDetector, HOME } from './base-detector.js';
import type { DetectedAccount } from '../types.js';
import { join } from 'path';

/**
 * lark-cli detector:
 * 1. Check ~/.lark-cli/ credentials
 * 2. Run `lark-cli auth whoami` to verify login
 * 3. Check env vars: LARK_APP_ID, LARK_APP_SECRET
 */
export class LarkCLIDetector extends BaseDetector {
  name = 'lark-cli';

  async detect(): Promise<DetectedAccount[]> {
    const results: DetectedAccount[] = [];

    // 1. Check lark-cli credentials on disk
    const larkPaths = [
      join(HOME, '.lark-cli', 'credentials.json'),
      join(HOME, '.config', 'lark-cli', 'credentials.json'),
    ];
    let foundCreds = false;
    for (const p of larkPaths) {
      if (this.fileExists(p)) {
        const creds = this.readJSON<Record<string, unknown>>(p);
        if (creds) {
          foundCreds = true;
          // Try to extract display name
          const displayName = (creds.user_name as string) || (creds.name as string);
          results.push(this.authenticated('lark-cli', 'oauth', p, displayName as string | undefined));
          break;
        }
      }
    }

    // 2. Check lark-cli auth status via CLI
    if (!foundCreds) {
      const whoami = this.runCmd('lark-cli auth whoami 2>/dev/null');
      if (whoami && !whoami.includes('not logged in') && !whoami.includes('error')) {
        try {
          const parsed = JSON.parse(whoami);
          const name = parsed.user_name || parsed.name || parsed.email;
          results.push(this.authenticated('lark-cli', 'oauth', 'lark-cli auth whoami', name));
          foundCreds = true;
        } catch {
          // Output is not JSON but not an error either — CLI may be logged in
          results.push(this.authenticated('lark-cli', 'oauth', 'lark-cli auth whoami', whoami.slice(0, 50)));
          foundCreds = true;
        }
      }
    }

    // 3. Check bot credentials (LARK_APP_ID + LARK_APP_SECRET)
    if (this.hasEnvVar('LARK_APP_ID') && this.hasEnvVar('LARK_APP_SECRET')) {
      results.push({
        provider: 'lark-cli-bot',
        status: 'key_found',
        authType: 'api_key',
        source: 'env:LARK_APP_ID + LARK_APP_SECRET',
        displayName: this.getEnvVar('LARK_APP_ID').slice(0, 8) + '...',
        lastVerified: Date.now(),
        requiresReauth: false,
      });
    }

    if (results.length === 0) {
      results.push(this.notFound('lark-cli', 'oauth'));
    }

    return results;
  }
}

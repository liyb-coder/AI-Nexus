import { BaseDetector, HOME } from './base-detector.js';
import type { DetectedAccount } from '../types.js';
import { join } from 'path';

/**
 * Claude Code detector:
 * 1. Check ~/.claude/ for OAuth credentials
 * 2. Check ANTHROPIC_API_KEY env var
 * 3. Check ~/.anthropic/ config files
 */
export class ClaudeDetector extends BaseDetector {
  name = 'claude';

  async detect(): Promise<DetectedAccount[]> {
    const results: DetectedAccount[] = [];

    // 1. Claude Code OAuth (~/.claude/credentials.json)
    const credsPath = join(HOME, '.claude', 'credentials.json');
    if (this.fileExists(credsPath)) {
      const creds = this.readJSON<Record<string, unknown>>(credsPath);
      if (creds) {
        results.push(this.authenticated('claude', 'oauth', credsPath, 'Claude Code (已登录)'));
      } else {
        results.push(this.errorResult('claude', 'oauth', '无法解析凭据文件', credsPath));
      }
    }

    // 2. Claude API Key via env var
    if (this.hasEnvVar('ANTHROPIC_API_KEY')) {
      const key = this.getEnvVar('ANTHROPIC_API_KEY');
      results.push(this.keyFound('claude-api', `env:ANTHROPIC_API_KEY`, key));
    }

    // 3. ~/.anthropic/ config
    const anthropicConfig = join(HOME, '.anthropic', 'config');
    if (this.fileExists(anthropicConfig)) {
      results.push(this.authenticated('claude-api', 'cli_config', anthropicConfig, '~/.anthropic/config'));
    }

    // 4. Check if `claude` CLI is installed
    const claudeVersion = this.runCmd('claude --version');
    if (claudeVersion) {
      // Only add CLI detection if no auth was found above
      if (results.length === 0) {
        results.push(this.authenticated('claude', 'cli_config', 'claude CLI', claudeVersion));
      }
    }

    if (results.length === 0) {
      results.push(this.notFound('claude', 'oauth'));
      results.push(this.notFound('claude-api', 'api_key'));
    }

    return results;
  }
}

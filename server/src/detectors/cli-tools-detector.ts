import { BaseDetector } from './base-detector.js';
import type { DetectedAccount } from '../types.js';

/**
 * CLI Tools detector:
 * Detects git, npm, node, python3, docker installations.
 * Installed tools are shown as 'cli_config' type.
 */
export class CLIToolsDetector extends BaseDetector {
  name = 'cli-tools';

  // Tools to check: [displayName, command, args, alternateCommand]
  private readonly tools: [string, string, string[]][] = [
    ['git', 'git', ['--version']],
    ['node', 'node', ['--version']],
    ['npm', 'npm', ['--version']],
    ['python3', 'python3', ['--version']],
    ['docker', 'docker', ['--version']],
    ['codex', 'codex', ['--version']],
    ['claude', 'claude', ['--version']],
  ];

  async detect(): Promise<DetectedAccount[]> {
    const results: DetectedAccount[] = [];

    for (const [name, cmd, args] of this.tools) {
      try {
        const fullCmd = [cmd, ...args].join(' ');
        const output = this.runCmd(fullCmd);
        if (output) {
          const version = output.split('\n')[0].trim();
          results.push({
            provider: name,
            status: 'authenticated',
            authType: 'cli_config',
            source: `CLI: ${cmd}`,
            displayName: version,
            lastVerified: Date.now(),
            requiresReauth: false,
          });
        } else {
          results.push({
            provider: name,
            status: 'not_found',
            authType: 'cli_config',
            source: `${cmd} not found in PATH`,
            lastVerified: Date.now(),
            requiresReauth: false,
          });
        }
      } catch {
        results.push({
          provider: name,
          status: 'not_found',
          authType: 'cli_config',
          source: `${cmd} not found`,
          lastVerified: Date.now(),
          requiresReauth: false,
        });
      }
    }

    return results;
  }
}

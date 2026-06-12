import { spawn, execSync } from 'child_process';
import { v4 as uuid } from 'uuid';
import { getDatabase } from '../db/database.js';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface CLIExecutionRequest {
  tool: string;
  command: string;
  workingDir: string;
  riskLevel: RiskLevel;
  purpose: string;
  envVars?: Record<string, string>;
  timeout?: number;
}

interface CLIExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  killed: boolean;
  duration: number;
}

const RISK_PATTERNS: Record<string, { level: RiskLevel; patterns: RegExp[] }> = {
  read: {
    level: 'low',
    patterns: [
      /^(ls|cat|head|tail|wc|du|df|git\s+status|git\s+log|git\s+diff|git\s+branch|echo|pwd|whoami|date|which|type)\b/,
      /^(npm|node|python3?)\s+(--version|-v)$/,
    ],
  },
  write: {
    level: 'medium',
    patterns: [
      /^(touch|mkdir|cp|mv|rm\s+\S+$|git\s+add|git\s+commit|git\s+push|git\s+checkout|git\s+merge)\b/,
      /^(npm|yarn|pnpm)\s+install/,
    ],
  },
  exec: {
    level: 'high',
    patterns: [
      /^(npm|yarn|pnpm)\s+run/,
      /^(python3?|node|ruby|bash|sh|zsh)\s+\S/,
      /^(make|cmake|gcc|g\+\+|rustc|cargo)\b/,
      /^(lark-cli)\s+\S/,
    ],
  },
  network: {
    level: 'high',
    patterns: [
      /^(curl|wget)\b/,
      /^(lark-cli)\s+(api|auth)\b/,
    ],
  },
  admin: {
    level: 'critical',
    patterns: [
      /^(rm\s+-rf|sudo)\b/,
      /^(chmod|chown|kill|killall|reboot|shutdown)\b/,
      /^(docker)\s+(rm|kill|stop|system\s+prune)\b/,
    ],
  },
};

/**
 * Assess risk level of a CLI command based on pattern matching.
 */
export function assessRisk(command: string): RiskLevel {
  const trimmed = command.trim();

  // Check patterns from highest risk to lowest
  const checkOrder: (keyof typeof RISK_PATTERNS)[] = ['admin', 'network', 'exec', 'write', 'read'];

  for (const key of checkOrder) {
    for (const pattern of RISK_PATTERNS[key].patterns) {
      if (pattern.test(trimmed)) {
        return RISK_PATTERNS[key].level;
      }
    }
  }

  // Default to medium for unrecognized commands
  return 'medium';
}

/**
 * CLI Executor — runs shell commands with risk assessment and sandboxing.
 */
export class CLIExecutor {
  /**
   * Execute a CLI command (after approval).
   */
  async execute(req: CLIExecutionRequest): Promise<CLIExecutionResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      // Parse command into executable and args
      const parts = req.command.trim().split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);

      const child = spawn(cmd, args, {
        cwd: req.workingDir || process.cwd(),
        env: { ...process.env, ...req.envVars },
        timeout: req.timeout || 120000, // 2 min default
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', async (exitCode, signal) => {
        const duration = Date.now() - startTime;
        const result: CLIExecutionResult = {
          success: exitCode === 0 && !signal,
          stdout: stdout.slice(0, 10000),
          stderr: stderr.slice(0, 10000),
          exitCode: exitCode ?? -1,
          killed: !!signal,
          duration,
        };

        // Log to audit trail
        const db = await getDatabase();
        db.prepare(`
          INSERT INTO audit_log (action, detail, user_approved, result, created_at)
          VALUES (?, ?, 1, ?, ?)
        `).run(
          `cli:${req.tool}`,
          req.command,
          result.success ? 'success' : `exit=${result.exitCode}`,
          Date.now()
        );

        resolve(result);
      });

      child.on('error', (err) => {
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          stdout: '',
          stderr: err.message,
          exitCode: -1,
          killed: false,
          duration,
        });
      });
    });
  }

  /**
   * Create an approval request for a high-risk command.
   * Returns the approval ID — frontend must resolve before execution.
   */
  async createApproval(req: CLIExecutionRequest): Promise<string> {
    const approvalId = uuid();
    const db = await getDatabase();

    db.prepare(`
      INSERT INTO approvals (id, tool, command, working_dir, risk_level, purpose, resolved, approved, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?)
    `).run(approvalId, req.tool, req.command, req.workingDir, req.riskLevel, req.purpose, Date.now());

    return approvalId;
  }

  /**
   * Resolve an approval — returns true if approved.
   */
  async resolveApproval(approvalId: string, approved: boolean): Promise<boolean> {
    const db = await getDatabase();
    db.prepare('UPDATE approvals SET resolved = 1, approved = ? WHERE id = ?')
      .run(approved ? 1 : 0, approvalId);

    // Log
    db.prepare(`
      INSERT INTO audit_log (action, detail, user_approved, result)
      VALUES ('approval_resolve', ?, ?, ?)
    `).run(approvalId, approved ? 1 : 0, approved ? 'approved' : 'rejected');

    return approved;
  }
}

export const cliExecutor = new CLIExecutor();

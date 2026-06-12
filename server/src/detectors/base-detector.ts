import type { Detector, DetectedAccount } from '../types.js';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const HOME = homedir();

/**
 * Base detector with common utility methods.
 */
abstract class BaseDetector implements Detector {
  abstract name: string;

  abstract detect(): Promise<DetectedAccount[]>;

  /** Check if a file exists */
  protected fileExists(...paths: string[]): boolean {
    return existsSync(join(...paths));
  }

  /** Try to read a JSON file, return null on failure */
  protected readJSON<T>(...paths: string[]): T | null {
    try {
      const content = readFileSync(join(...paths), 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /** Run a shell command and return stdout, or null on failure */
  protected runCmd(command: string): string | null {
    try {
      return execSync(command, {
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return null;
    }
  }

  /** Check if an environment variable is set and non-empty */
  protected hasEnvVar(name: string): boolean {
    return !!process.env[name] && process.env[name]!.length > 0;
  }

  /** Get env var value, return empty string if not set */
  protected getEnvVar(name: string): string {
    return process.env[name] || '';
  }

  /** Build a "not found" account entry */
  protected notFound(provider: string, authType: DetectedAccount['authType']): DetectedAccount {
    return {
      provider,
      status: 'not_found',
      authType,
      source: 'auto-detect',
      lastVerified: Date.now(),
      requiresReauth: false,
    };
  }

  /** Build an "error" account entry */
  protected errorResult(provider: string, authType: DetectedAccount['authType'], message: string, source: string): DetectedAccount {
    return {
      provider,
      status: 'error',
      authType,
      source,
      lastVerified: Date.now(),
      requiresReauth: false,
      errorMessage: message,
    };
  }

  /** Build a "key_found" account entry */
  protected keyFound(provider: string, source: string, keyPreview?: string): DetectedAccount {
    return {
      provider,
      status: 'key_found',
      authType: 'api_key',
      source,
      lastVerified: Date.now(),
      requiresReauth: false,
      displayName: keyPreview ? `${keyPreview.slice(0, 8)}...` : undefined,
    };
  }

  /** Build an "authenticated" account entry */
  protected authenticated(provider: string, authType: DetectedAccount['authType'], source: string, displayName?: string): DetectedAccount {
    return {
      provider,
      status: 'authenticated',
      authType,
      source,
      displayName,
      lastVerified: Date.now(),
      requiresReauth: false,
    };
  }
}

export { BaseDetector, HOME };

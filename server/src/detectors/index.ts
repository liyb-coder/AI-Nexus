import type { Detector, DetectedAccount } from '../types.js';
import { ClaudeDetector } from './claude-detector.js';
import { CodexDetector } from './codex-detector.js';
import { KimiDetector } from './kimi-detector.js';
import { DeepSeekDetector } from './deepseek-detector.js';
import { OpenAIDetector } from './openai-detector.js';
import { LarkCLIDetector } from './lark-cli-detector.js';
import { CLIToolsDetector } from './cli-tools-detector.js';

/**
 * Runs all detectors in parallel and returns unified results.
 */
export class DetectorRegistry {
  private detectors: Detector[];

  constructor() {
    this.detectors = [
      new ClaudeDetector(),
      new CodexDetector(),
      new KimiDetector(),
      new DeepSeekDetector(),
      new OpenAIDetector(),
      new LarkCLIDetector(),
      new CLIToolsDetector(),
    ];
  }

  async scanAll(): Promise<DetectedAccount[]> {
    const results = await Promise.all(
      this.detectors.map((d) =>
        d.detect().catch((err) => {
          console.error(`[detector:${d.name}] error:`, err.message);
          return [
            {
              provider: d.name,
              status: 'error' as const,
              authType: 'cli_config' as const,
              source: 'detector-error',
              lastVerified: Date.now(),
              requiresReauth: false,
              errorMessage: err.message,
            },
          ];
        })
      )
    );

    return results.flat();
  }
}

export const detectorRegistry = new DetectorRegistry();

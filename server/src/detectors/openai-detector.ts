import { BaseDetector } from './base-detector.js';
import type { DetectedAccount } from '../types.js';

/**
 * OpenAI detector:
 * 1. OPENAI_API_KEY env var (also covers GPT-4o)
 */
export class OpenAIDetector extends BaseDetector {
  name = 'openai';

  async detect(): Promise<DetectedAccount[]> {
    const results: DetectedAccount[] = [];

    if (this.hasEnvVar('OPENAI_API_KEY')) {
      const key = this.getEnvVar('OPENAI_API_KEY');
      results.push(this.keyFound('openai', 'env:OPENAI_API_KEY', key));
    }

    if (results.length === 0) {
      results.push(this.notFound('openai', 'api_key'));
    }

    return results;
  }
}

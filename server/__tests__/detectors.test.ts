import { describe, it, expect } from 'vitest';
import { ClaudeDetector } from '../src/detectors/claude-detector.js';
import { CodexDetector } from '../src/detectors/codex-detector.js';
import { KimiDetector } from '../src/detectors/kimi-detector.js';
import { DeepSeekDetector } from '../src/detectors/deepseek-detector.js';
import { OpenAIDetector } from '../src/detectors/openai-detector.js';
import { CLIToolsDetector } from '../src/detectors/cli-tools-detector.js';

describe('Detectors', () => {
  describe('ClaudeDetector', () => {
    it('should return account entries', async () => {
      const detector = new ClaudeDetector();
      const results = await detector.detect();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // Every result should have required fields
      for (const r of results) {
        expect(r).toHaveProperty('provider');
        expect(r).toHaveProperty('status');
        expect(r).toHaveProperty('authType');
        expect(r).toHaveProperty('source');
        expect(r).toHaveProperty('lastVerified');
        expect(r).toHaveProperty('requiresReauth');
      }
    });
  });

  describe('CodexDetector', () => {
    it('should return account entries', async () => {
      const detector = new CodexDetector();
      const results = await detector.detect();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('KimiDetector', () => {
    it('should detect MOONSHOT_API_KEY env var', async () => {
      const detector = new KimiDetector();
      const results = await detector.detect();
      expect(Array.isArray(results)).toBe(true);
      const entry = results.find((r) => r.provider === 'kimi');
      expect(entry).toBeTruthy();
    });
  });

  describe('DeepSeekDetector', () => {
    it('should detect DEEPSEEK_API_KEY env var', async () => {
      const detector = new DeepSeekDetector();
      const results = await detector.detect();
      expect(Array.isArray(results)).toBe(true);
      const entry = results.find((r) => r.provider === 'deepseek');
      expect(entry).toBeTruthy();
    });
  });

  describe('OpenAIDetector', () => {
    it('should detect OPENAI_API_KEY env var', async () => {
      const detector = new OpenAIDetector();
      const results = await detector.detect();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('CLIToolsDetector', () => {
    it('should detect installed CLI tools', async () => {
      const detector = new CLIToolsDetector();
      const results = await detector.detect();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // On macOS, git, node, npm should be available
      const gitResult = results.find((r) => r.provider === 'git');
      if (gitResult) {
        expect(gitResult.status).toBe('authenticated');
        expect(gitResult.displayName).toBeTruthy();
      }
    });
  });
});

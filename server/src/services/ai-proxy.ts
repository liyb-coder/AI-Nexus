import type { ModelRow, DetectedAccount } from '../types.js';
import { getDatabase } from '../db/database.js';

interface AIStreamCallbacks {
  onChunk: (modelId: string, delta: string) => void;
  onEnd: (modelId: string, fullContent: string, tokensUsed: number, latency: number) => void;
  onError: (modelId: string, error: string) => void;
}

interface AIQueryConfig {
  query: string;
  modelIds: string[];
  materials?: string[];
  callbacks: AIStreamCallbacks;
}

/**
 * AI Proxy — unified interface for all model providers.
 *
 * Detects available API keys from environment variables at runtime.
 * Each model's stream is forwarded to callbacks for WebSocket delivery.
 */
// CC Switch overrides (ephemeral, per-process)
const _endpointOverrides = new Map<string, string>();
const _modelOverrides = new Map<string, string>();

export class AIProxy {
  /**
   * Build a system prompt that includes materials (reference packages).
   */
  private buildSystemPrompt(materials?: string[]): string {
    if (!materials || materials.length === 0) return '';

    const materialText = materials
      .map((m, i) => `[素材 ${i + 1}]\n${m}`)
      .join('\n\n');

    return `以下是用户提供的参考素材，请基于这些素材进行回答：\n\n${materialText}\n\n---\n请综合以上素材，结合你的知识给出专业回答。`;
  }

  /**
   * Get API key for a model: check DB config, then env vars, then detected accounts.
   */
  private async getApiKey(model: ModelRow, detectedAccounts: DetectedAccount[]): Promise<string | null> {
    // 1. Check env var specified in model config
    if (model.api_key_env) {
      const val = process.env[model.api_key_env];
      if (val) return val;
    }

    // 2. Check if any detected account has a key for this provider
    const account = detectedAccounts.find(
      (a) => a.provider === model.id && a.status === 'key_found'
    );
    if (account) {
      // We can't recover the raw key from detection, but we know it exists
      // The actual key is read from env vars at runtime
    }

    // 3. Try common env var patterns
    const envMap: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      codex: 'OPENAI_API_KEY',
      kimi: 'MOONSHOT_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      claude: 'ANTHROPIC_API_KEY',
      gpt4o: 'OPENAI_API_KEY',
    };

    const envVar = envMap[model.id];
    if (envVar && process.env[envVar]) {
      return process.env[envVar]!;
    }

    // 4. Try CC Switch DB — extracts key + endpoint together
    try {
      const { readFileSync, existsSync } = await import('fs');
      const { join } = await import('path');
      const { homedir } = await import('os');
      const ccSwitchDb = join(homedir(), '.cc-switch', 'cc-switch.db');
      if (!existsSync(ccSwitchDb)) return null;

      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs();
      const buffer = readFileSync(ccSwitchDb);
      const sqlDb = new SQL.Database(buffer);

      // DeepSeek: key + model name from CC Switch
      if (model.id === 'deepseek') {
        const stmt = sqlDb.prepare(
          "SELECT settings_config FROM providers WHERE settings_config LIKE '%deepseek%' AND settings_config LIKE '%ANTHROPIC_AUTH_TOKEN%' LIMIT 1"
        );
        if (stmt.step()) {
          const row = stmt.getAsObject();
          const config = row.settings_config as string;
          const keyMatch = config.match(/"ANTHROPIC_AUTH_TOKEN":"(sk-[^"]+)"/);
          if (keyMatch) {
            // Extract CC Switch model name (e.g., deepseek-v4-pro[1m])
            const modelMatch = config.match(/"ANTHROPIC_MODEL":"([^"]+)"/);
            if (modelMatch) _modelOverrides.set('deepseek', modelMatch[1]);
            stmt.free(); sqlDb.close();
            return keyMatch[1];
          }
        }
        stmt.free();
      }

      // Codex/OpenAI: freemodel or custom providers with OpenAI-compatible endpoints
      if (model.id === 'codex' || model.id === 'openai') {
        const stmt = sqlDb.prepare(
          "SELECT settings_config FROM providers WHERE app_type='codex' AND settings_config LIKE '%OPENAI_API_KEY%' LIMIT 1"
        );
        while (stmt.step()) {
          const row = stmt.getAsObject();
          const config = row.settings_config as string;
          const keyMatch = config.match(/"OPENAI_API_KEY":"([^"]+)"/);
          const urlMatch = config.match(/"base_url":"([^"]+)"/);
          if (keyMatch) {
            const key = keyMatch[1];
            // Use the provider's base_url as the endpoint
            if (urlMatch) {
              // Store endpoint override in a temporary static map
              _endpointOverrides.set(model.id, urlMatch[1]);
            }
            stmt.free(); sqlDb.close();
            return key;
          }
        }
        stmt.free();
      }

      sqlDb.close();
    } catch { /* CC Switch unavailable */ }

    // 5. Codex Desktop OAuth token
    if (model.id === 'codex') {
      try {
        const { readFileSync: rf2 } = await import('fs');
        const { homedir: home2 } = await import('os');
        const { join: j2 } = await import('path');
        const authPath = j2(home2(), '.codex', 'auth.json');
        const auth = JSON.parse(rf2(authPath, 'utf-8'));
        if (auth.tokens?.access_token) {
          return auth.tokens.access_token;
        }
      } catch { /* Codex Desktop auth unavailable */ }
    }

    // 6. Claude → DeepSeek routing via CC Switch
    if (model.id === 'claude') {
      try {
        const { readFileSync: rf3, existsSync: ex3 } = await import('fs');
        const { join: j3 } = await import('path');
        const { homedir: home3 } = await import('os');
        const ccDb = j3(home3(), '.cc-switch', 'cc-switch.db');
        if (ex3(ccDb)) {
          const initSqlJs = (await import('sql.js')).default;
          const SQL = await initSqlJs();
          const buffer = rf3(ccDb);
          const sqlDb = new SQL.Database(buffer);
          const stmt = sqlDb.prepare(
            "SELECT settings_config FROM providers WHERE app_type='claude' AND settings_config LIKE '%ANTHROPIC_AUTH_TOKEN%' AND settings_config LIKE '%deepseek%' LIMIT 1"
          );
          if (stmt.step()) {
            const row = stmt.getAsObject();
            const match = (row.settings_config as string).match(/"ANTHROPIC_AUTH_TOKEN":"(sk-[^"]+)"/);
            if (match) {
              // Override endpoint to DeepSeek's Anthropic-compatible URL
              const urlMatch = (row.settings_config as string).match(/"ANTHROPIC_BASE_URL":"([^"]+)"/);
              if (urlMatch) _endpointOverrides.set('claude', urlMatch[1]);
              stmt.free(); sqlDb.close();
              return match[1];
            }
          }
          stmt.free(); sqlDb.close();
        }
      } catch { /* unavailable */ }
    }

    return null;
  }

  /**
   * Query an OpenAI-compatible model with streaming.
   */
  private async queryOpenAICompatible(
    model: ModelRow,
    query: string,
    systemPrompt: string,
    apiKey: string,
    callbacks: AIStreamCallbacks
  ): Promise<void> {
    const { OpenAI } = await import('openai');

    const client = new OpenAI({
      apiKey,
      baseURL: model.endpoint || 'https://api.openai.com/v1',
      timeout: 60000,
      maxRetries: 2,
    });

    const startTime = Date.now();
    let fullContent = '';

    try {
      const stream = await client.chat.completions.create({
        model: _modelOverrides.get(model.id) ||
               (model.id === 'kimi' ? 'moonshot-v1-8k' :
                model.id === 'deepseek' ? 'deepseek-chat' :
                model.id === 'codex' ? 'gpt-4o' : 'gpt-4o'),
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: query },
        ],
        temperature: model.temperature,
        max_tokens: model.max_tokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          callbacks.onChunk(model.id, delta);
        }
      }

      const latency = Date.now() - startTime;
      const tokensUsed = Math.round(fullContent.length * 0.6); // rough estimate for non-Anthropic
      callbacks.onEnd(model.id, fullContent, tokensUsed, latency);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      callbacks.onError(model.id, `${model.name}: ${message}`);
    }
  }

  /**
   * Query Claude via Anthropic Messages API with streaming.
   */
  private async queryAnthropic(
    model: ModelRow,
    query: string,
    systemPrompt: string,
    apiKey: string,
    callbacks: AIStreamCallbacks
  ): Promise<void> {
    const { Anthropic } = await import('@anthropic-ai/sdk');

    const client = new Anthropic({
      apiKey,
      timeout: 60000,
      maxRetries: 2,
    });

    const startTime = Date.now();
    let fullContent = '';

    try {
      const stream = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: model.max_tokens,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: query }],
        stream: true,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          fullContent += event.delta.text;
          callbacks.onChunk(model.id, event.delta.text);
        }

        if (event.type === 'message_delta') {
          const tokensUsed = event.usage?.output_tokens || Math.round(fullContent.length * 0.6);
          const latency = Date.now() - startTime;
          callbacks.onEnd(model.id, fullContent, tokensUsed, latency);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      callbacks.onError(model.id, `${model.name}: ${message}`);
    }
  }

  /**
   * Execute parallel queries to multiple AI models.
   * Each model runs independently; results are streamed via callbacks.
   */
  async queryMultiple(config: AIQueryConfig, detectedAccounts: DetectedAccount[]): Promise<void> {
    const db = await getDatabase();
    const systemPrompt = this.buildSystemPrompt(config.materials);

    const promises = config.modelIds.map(async (modelId) => {
      const model = db
        .prepare('SELECT * FROM models WHERE id = ?')
        .get(modelId) as ModelRow | undefined;

      if (!model) {
        config.callbacks.onError(modelId, `模型 "${modelId}" 未配置`);
        return;
      }

      if (!model.enabled) {
        config.callbacks.onError(modelId, `${model.name} 未启用`);
        return;
      }

      const apiKey = await this.getApiKey(model, detectedAccounts);
      if (!apiKey) {
        config.callbacks.onError(
          modelId,
          `${model.name}: 未检测到 API Key。请设置 ${model.api_key_env || '环境变量'}`
        );
        return;
      }

      // Override endpoint if CC Switch provided one
      const effectiveEndpoint = _endpointOverrides.get(modelId) || model.endpoint;

      // Send stream_start
      config.callbacks.onChunk(modelId, '');

      try {
        if (model.provider === 'anthropic') {
          await this.queryAnthropic(
            { ...model, endpoint: effectiveEndpoint },
            config.query, systemPrompt, apiKey, config.callbacks
          );
        } else {
          await this.queryOpenAICompatible(
            { ...model, endpoint: effectiveEndpoint },
            config.query, systemPrompt, apiKey, config.callbacks
          );
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        config.callbacks.onError(modelId, `${model.name}: ${message}`);
      }
    });

    // All models run in parallel — each independently
    await Promise.allSettled(promises);
  }
}

export const aiProxy = new AIProxy();

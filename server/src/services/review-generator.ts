import { aiProxy } from './ai-proxy.js';
import { detectorRegistry } from '../detectors/index.js';
import { getDatabase } from '../db/database.js';
import type { DetectedAccount, ModelRow } from '../types.js';

/**
 * Review Generator — uses a cheap model to generate comparative review of multiple AI outputs.
 */
export class ReviewGenerator {
  /**
   * Generate a structured review comparing multiple AI responses.
   */
  async generateReview(
    responses: Array<{ modelId: string; content: string }>,
    originalQuery: string
  ): Promise<string> {
    const db = await getDatabase();
    const detectedAccounts = await detectorRegistry.scanAll();

    // Try to use a cheap/free model for review — prefer DeepSeek, fallback to any available
    const reviewModelIds = ['deepseek', 'kimi', 'openai', 'codex'];
    let reviewModel: ModelRow | null = null;
    let reviewApiKey: string | null = null;

    for (const mid of reviewModelIds) {
      const model = db.prepare('SELECT * FROM models WHERE id = ? AND enabled = 1').get(mid) as ModelRow | undefined;
      if (!model) continue;

      const envMap: Record<string, string> = {
        deepseek: 'DEEPSEEK_API_KEY',
        kimi: 'MOONSHOT_API_KEY',
        openai: 'OPENAI_API_KEY',
        codex: 'OPENAI_API_KEY',
      };

      const key = process.env[envMap[mid]];
      if (key) {
        reviewModel = model;
        reviewApiKey = key;
        break;
      }
    }

    if (!reviewModel || !reviewApiKey) {
      return '## 评审不可用\n\n未检测到可用的 AI API Key，无法生成自动评审。\n\n请在设置中配置至少一个模型的 API Key。';
    }

    // Build review prompt
    const responsesText = responses
      .map((r) => {
        const model = db.prepare('SELECT name FROM models WHERE id = ?').get(r.modelId) as { name: string } | undefined;
        return `### [${model?.name || r.modelId}]\n${r.content.slice(0, 1000)}`;
      })
      .join('\n\n---\n\n');

    const reviewPrompt = `你是一位资深技术评审专家。请对以下多个 AI 针对同一问题的回答进行结构化评审。

## 用户原始问题
${originalQuery}

## 各 AI 的回答
${responsesText}

请按以下维度输出评审报告（Markdown 格式）：

## 评审报告

### 总体摘要
（100字以内概述）

### 共同点
- 列出所有 AI 回答中的一致观点

### 差异点
| 维度 | ${responses.map(r => {
  const model = db.prepare('SELECT name FROM models WHERE id = ?').get(r.modelId) as { name: string } | undefined;
  return model?.name || r.modelId;
}).join(' | ')} |
|------|${responses.map(() => '------').join('|')}|
| 关注重心 | |
| 核心观点 | |
| 方案特点 | |

### 每个 AI 的亮点
- 分别列出每个 AI 最突出的优点

### 风险或不足
- 指出回答中的潜在问题或遗漏

### 推荐采用方向
- 综合各方案给出最佳建议`;

    // Use OpenAI-compatible API (cheapest model for review)
    let content = '';
    try {
      const { OpenAI } = await import('openai');
      const client = new OpenAI({
        apiKey: reviewApiKey,
        baseURL: reviewModel.endpoint || 'https://api.openai.com/v1',
        timeout: 30000,
      });

      const modelName = reviewModel.id === 'deepseek' ? 'deepseek-chat' :
                        reviewModel.id === 'kimi' ? 'moonshot-v1-8k' : 'gpt-4o-mini';

      const stream = await client.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: reviewPrompt }],
        max_tokens: 2048,
        stream: true,
      });

      for await (const chunk of stream) {
        content += chunk.choices?.[0]?.delta?.content || '';
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `## 评审生成失败\n\n错误：${message}`;
    }

    return content;
  }
}

export const reviewGenerator = new ReviewGenerator();

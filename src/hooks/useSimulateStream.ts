import { useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface StreamConfig {
  modelId: string;
  modelName: string;
  modelColor: string;
  content?: string;
  delayMs?: number;
}

const kimiResponse = `## 方案概述

基于你的需求，我建议采用 **微服务架构** 配合 **事件驱动** 的模式来实现这个多 AI 协作平台。

### 核心架构

\`\`\`
┌─────────────────────────────────────────────────┐
│                    前端层 (Tauri)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ 主工作台  │ │ 素材库   │ │ 审批控制台        │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────┐
│              Runtime 层 (Rust/Node)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ API 网关  │ │ 流处理器 │ │ 本地 CLI 沙箱    │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────┘
\`\`\`

### 关键技术选型

| 模块 | 推荐方案 | 理由 |
|------|----------|------|
| 桌面框架 | **Tauri** | 体积小、性能好、Rust 安全 |
| 前端 | React + Zustand | 状态管理简洁高效 |
| 流式通信 | SSE / WebSocket | 实时推送 AI 输出 |
| 本地存储 | SQLite + 文件系统 | 数据隐私、离线可用 |

### 多模型并发策略

使用 **Promise.allSettled** 并发调用多个模型，每个连接独立管理 SSE 流：

\`\`\`typescript
const streams = enabledModels.map(model => 
  createSSEStream(model.endpoint, query)
);

for await (const chunk of mergeStreams(streams)) {
  dispatchToPanel(chunk.modelId, chunk.text);
}
\`\`\`

Kimi 的 Moonshot API 支持标准的 OpenAI 兼容接口，可以直接复用现有的流式处理逻辑。

### 风险点

1. **API Key 管理**：建议使用系统钥匙串存储，避免明文保存在配置文件
2. **并发限制**：注意各厂商的 RPM/TPM 限制，建议加入请求队列和熔断机制`;

const claudeResponse = `## 架构评估与建议

这个产品的核心挑战不在于技术实现，而在于**交互模型的设计**——如何让多个 AI 的输出在有限的空间内被高效地对比和理解。

### 我的核心观点

> 这不是一个聊天工具，而是一个**认知工作台**。用户的注意力是最稀缺的资源。

### 交互设计原则

1. **渐进式披露 (Progressive Disclosure)**
   - 默认只显示每个 AI 的摘要（前 200 字）
   - 点击展开查看完整输出
   - 避免信息过载

2. **差异可视化 (Diff Visualization)**
   - 当多个 AI 给出相似答案时，自动合并显示
   - 差异部分用颜色高亮标注
   - 这能显著减少用户的认知负担

3. **上下文感知 (Context Awareness)**
   - 素材库不应该只是一个剪贴板
   - 它应该是一个**活的知识图谱**——AI 可以引用、关联、推理其中的内容

### 技术实现注意

\`\`\`rust
// Tauri 命令模式示例
#[tauri::command]
async fn execute_cli(
    app: AppHandle,
    command: String,
    working_dir: PathBuf,
) -> Result<Output, Error> {
    // 1. 解析命令风险等级
    let risk = assess_risk(&command);
    
    // 2. 高风险命令触发审批
    if risk > RiskLevel::Medium {
        let approved = request_approval(&app, &command, risk).await?;
        if !approved {
            return Err(Error::Denied);
        }
    }
    
    // 3. 在沙箱中执行
    run_in_sandbox(command, working_dir).await
}
\`\`\`

### 关于审批流程的设计

审批不应该是阻塞式的弹窗。建议采用：
- **非阻塞通知**：右下角滑入
- **批量审批**：类似的命令可以批量确认
- **信任列表**：常用命令（如 git status）可以一键信任`;

const codexResponse = `## 技术架构建议

从实现角度，我推荐以下技术栈：

### 前端层

\`\`\`typescript
// 核心状态结构
interface WorkspaceState {
  panels: Map<string, AIPanel>;     // 每个 AI 的面板状态
  materials: MaterialLibrary;        // 素材库
  approvals: ApprovalQueue;          // 审批队列
  context: ContextWindow;            // 上下文窗口
}
\`\`\`

用 **Tauri** 做桌面框架非常合适。它的多窗口支持可以让每个 AI 面板独立为一个 WebView，彻底隔离渲染，避免一个 AI 的输出卡顿影响其他面板。

### 本地 Runtime 架构

\`\`\`
┌────────────────────────────────────┐
│           Tauri Runtime            │
│  ┌─────────┐    ┌──────────────┐  │
│  │ Main    │───▶│ 权限管理器    │  │
│  │ Process │    └──────────────┘  │
│  └────┬────┘                      │
│       │                            │
│  ┌────┴────┐    ┌──────────────┐  │
│  │ WebView │◀───│  CLI 执行器   │  │
│  │ (xN)    │    │ (沙箱隔离)    │  │
│  └─────────┘    └──────────────┘  │
└────────────────────────────────────┘
\`\`\`

### SSE 流式合并实现

\`\`\`rust
use futures::stream::{self, StreamExt};
use tokio::sync::mpsc;

pub fn merge_model_streams(
    model_streams: Vec<impl Stream<Item = Chunk>>,
) -> impl Stream<Item = UnifiedChunk> {
    let (tx, rx) = mpsc::unbounded_channel();
    
    for stream in model_streams {
        let tx = tx.clone();
        tokio::spawn(async move {
            stream.for_each(|chunk| {
                let _ = tx.send(UnifiedChunk {
                    model_id: chunk.model_id,
                    text: chunk.delta,
                    done: chunk.finish_reason.is_some(),
                });
            }).await;
        });
    }
    
    tokio_stream::wrappers::UnboundedReceiverStream::new(rx)
}
\`\`\`

### 素材库的引用包格式

\`\`\`json
{
  "type": "reference_package",
  "version": "1.0",
  "materials": [
    {
      "id": "mat_001",
      "source": "kimi",
      "content": "...",
      "relevance_score": 0.92
    }
  ],
  "query_summary": "用户要求融合两个方案...",
  "token_estimate": 2048
}
\`\`\`

**注意**：引用包应该包含素材的摘要而非全文，token 控制在 2K 以内。`;

const deepseekResponse = `## 可行性分析

从工程实现角度，这个产品的核心难点有四个：

### 1. 流式渲染性能

当 4-5 个 AI 同时流式输出时，前端需要同时处理多个高频 DOM 更新。建议：

\`\`\`typescript
// 使用 requestAnimationFrame 批量更新
class StreamBuffer {
  private buffer = '';
  private scheduled = false;
  
  append(text: string) {
    this.buffer += text;
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
        this.scheduled = false;
      });
    }
  }
  
  private flush() {
    this.onUpdate(this.buffer);
    this.buffer = '';
  }
}
\`\`\`

### 2. 多模型 API 兼容性

各厂商的流式协议虽有差异，但都遵循 SSE 标准。建议抽象一层统一接口：

\`\`\`
统一接口层
├── OpenAI-compatible (GPT-4, DeepSeek, Kimi)
├── Anthropic Messages API (Claude)
├── OpenAI Codex API (Codex)
└── 自定义扩展 (本地模型)
\`\`\`

### 3. 评审模型的 Prompt 工程

评审模型需要对多个输出做结构化对比，Prompt 设计很关键：

\`\`\`
你是一位技术评审专家。请对以下多个 AI 的回答进行结构化评审：

[输出1 - Kimi]: ...
[输出2 - Claude]: ...

请按以下维度输出评审：
1. 总体摘要（100字以内）
2. 共同点
3. 差异点
4. 每个 AI 的亮点
5. 风险或不足
6. 推荐采用方向
\`\`\`

### 4. CLI 安全模型

建议采用** capability-based security** 模型：

| 权限级别 | 允许的操作 | 需要审批 |
|---------|-----------|---------|
| read | ls, cat, git status | 否 |
| write | 文件修改, git commit | 是 |
| exec | npm install, python | 是 |
| network | curl, API 调用 | 是 |
| admin | rm -rf, sudo | 双重确认 |`;

const modelResponses: Record<string, string> = {
  kimi: kimiResponse,
  claude: claudeResponse,
  codex: codexResponse,
  deepseek: deepseekResponse,
  openai: kimiResponse + '\n\n---\n\n**补充**：GPT-4o 的分析与 Kimi 基本一致，但在并发处理上建议使用更现代的 async generators 模式。',
};

// Generate slightly different content for continuation rounds
function generateVariantContent(baseContent: string, round: number): string {
  const prefixes = [
    '## 继续分析\n\n基于上文的讨论，我进一步补充以下观点：\n\n',
    '## 深入探讨\n\n结合之前的输出，我认为还需要关注以下几个方面：\n\n',
    '## 补充说明\n\n延续上面的分析，这里做一些补充和修正：\n\n',
  ];
  const prefix = prefixes[(round - 2) % prefixes.length];
  // Truncate base content to first ~800 chars and add variant marker
  const truncated = baseContent.slice(0, 800);
  return prefix + truncated + `\n\n> **注**: 这是第 ${round} 轮回复，针对用户的追问进行了补充和深化。`;
}

// Stream content into an existing response panel
function streamIntoResponse(
  responseId: string,
  fullContent: string,
  store: ReturnType<typeof useAppStore.getState>
) {
  const delayMs = 8 + Math.random() * 10;
  const loadingDelay = 500 + Math.random() * 1000;

  const loadingTimeout = window.setTimeout(() => {
    store.setResponseStatus(responseId, 'streaming');

    let charIndex = 0;
    const chunkSize = 1;

    const typeNextChunk = () => {
      if (charIndex >= fullContent.length) {
        store.setResponseStatus(responseId, 'done');
        store.setResponseMetrics(responseId, Math.round(loadingDelay + charIndex * delayMs), fullContent.length * 0.6);
        return;
      }

      const end = Math.min(charIndex + chunkSize, fullContent.length);
      const chunk = fullContent.slice(charIndex, end);
      const currentResponse = useAppStore.getState().responses.find((r) => r.id === responseId);

      if (currentResponse) {
        store.updateResponseContent(responseId, currentResponse.content + chunk);
      }

      charIndex = end;
      const nextDelay = delayMs + (Math.random() > 0.8 ? delayMs * 3 : 0);
      setTimeout(typeNextChunk, nextDelay);
    };

    typeNextChunk();
  }, loadingDelay);

  return loadingTimeout;
}

export function useSimulateStream() {
  const timeoutsRef = useRef<number[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const startStream = useCallback(
    (config: StreamConfig) => {
      const { modelId, modelName, modelColor, delayMs = 15 } = config;
      const store = useAppStore.getState();
      const content = modelResponses[modelId] || modelResponses.kimi;

      const responseId = `resp_${modelId}_${Date.now()}`;
      const response = {
        id: responseId,
        modelId,
        modelName,
        modelColor,
        status: 'loading' as const,
        content: '',
        fullContent: content,
        timestamp: Date.now(),
        messages: [],
      };

      store.addResponse(response);

      // Simulate loading delay
      const loadingDelay = 500 + Math.random() * 1500;
      const loadingTimeout = window.setTimeout(() => {
        store.setResponseStatus(responseId, 'streaming');

        let charIndex = 0;
        const chunkSize = 1;
        const typeNextChunk = () => {
          if (charIndex >= content.length) {
            store.setResponseStatus(responseId, 'done');
            store.setResponseMetrics(
              responseId,
              Math.round(loadingDelay + charIndex * delayMs),
              content.length * 0.6
            );
            return;
          }

          const end = Math.min(charIndex + chunkSize, content.length);
          const chunk = content.slice(charIndex, end);
          const currentResponse = useAppStore
            .getState()
            .responses.find((r) => r.id === responseId);

          if (currentResponse) {
            store.updateResponseContent(
              responseId,
              currentResponse.content + chunk
            );
          }

          charIndex = end;

          // Variable typing speed for realism
          const nextDelay =
            delayMs + (Math.random() > 0.8 ? delayMs * 3 : 0);
          const chunkTimeout = window.setTimeout(typeNextChunk, nextDelay);
          timeoutsRef.current.push(chunkTimeout);
        };

        typeNextChunk();
      }, loadingDelay);

      timeoutsRef.current.push(loadingTimeout);

      return responseId;
    },
    []
  );

  const startAllStreams = useCallback(
    (query: string) => {
      const store = useAppStore.getState();
      const enabledModels = store.models.filter((m) => m.enabled);

      if (enabledModels.length === 0) return;

      store.setIsQuerying(true);
      store.setCurrentQuery(query);

      // Track round numbers per model for multi-round continuation
      const existingRounds: Record<string, number> = {};
      store.responses.forEach((r) => {
        const rounds = r.content.match(/---\s*Round\s*(\d+)\s*---/g);
        const maxRound = rounds
          ? Math.max(...rounds.map((m) => parseInt(m.match(/\d+/)?.[0] || '1')))
          : 1;
        existingRounds[r.modelId] = maxRound;
      });

      enabledModels.forEach((model, index) => {
        const timeout = window.setTimeout(() => {
          const existingResponse = store.responses.find(
            (r) => r.modelId === model.id
          );

          if (existingResponse) {
            // CONTINUATION: append to existing panel
            const nextRound = (existingRounds[model.id] || 1) + 1;
            const separator = `\n\n--- Round ${nextRound} ---\n\n**查询**: ${query}\n\n`;
            store.updateResponseContent(
              existingResponse.id,
              existingResponse.content + separator
            );
            store.setResponseStatus(existingResponse.id, 'loading');

            // Stream new content into existing panel
            const content = modelResponses[model.id] || modelResponses.kimi;
            const newContent = generateVariantContent(content, nextRound);
            streamIntoResponse(existingResponse.id, newContent, store);
          } else {
            // NEW panel for first-time model
            startStream({
              modelId: model.id,
              modelName: model.name,
              modelColor: model.color,
              delayMs: 8 + Math.random() * 12,
            });
          }
        }, index * 200);
        timeoutsRef.current.push(timeout);
      });

      // End querying state
      const endTimeout = window.setTimeout(() => {
        store.setIsQuerying(false);
      }, 2000);
      timeoutsRef.current.push(endTimeout);
    },
    [startStream]
  );

  return { startStream, startAllStreams, clearAllTimeouts };
}

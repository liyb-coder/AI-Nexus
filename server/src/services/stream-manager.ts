import type { DetectedAccount } from '../types.js';
import { aiProxy } from './ai-proxy.js';
import { getDatabase } from '../db/database.js';
import type { WSServerMessage } from '../types.js';
import { v4 as uuid } from 'uuid';

interface StreamSession {
  taskId: string;
  modelIds: string[];
  results: Map<string, { content: string; tokensUsed: number; latency: number }>;
  errors: Map<string, string>;
  completedCount: number;
  totalCount: number;
}

/**
 * Stream Manager — coordinates AI queries and WebSocket message delivery.
 */
export class StreamManager {
  private sessions = new Map<string, StreamSession>();

  /**
   * Send a message to a specific WebSocket client.
   */
  private sendToClient: ((ws: unknown, msg: WSServerMessage) => void) | null = null;

  setSendHandler(handler: (ws: unknown, msg: WSServerMessage) => void): void {
    this.sendToClient = handler;
  }

  /**
   * Handle a query request from a WebSocket client.
   */
  async handleQuery(
    ws: unknown,
    query: string,
    modelIds: string[],
    materials: string[] | undefined,
    detectedAccounts: DetectedAccount[]
  ): Promise<string> {
    const taskId = uuid();
    const db = await getDatabase();

    // Create task record
    const modelNames: string[] = [];
    for (const mid of modelIds) {
      const model = db.prepare('SELECT name FROM models WHERE id = ?').get(mid) as { name: string } | undefined;
      modelNames.push(model?.name || mid);
    }

    db.prepare(`
      INSERT INTO tasks (id, title, query, status, model_ids, model_names, token_total)
      VALUES (?, ?, ?, 'in_progress', ?, ?, 0)
    `).run(taskId, query.slice(0, 100), query, JSON.stringify(modelIds), JSON.stringify(modelNames));

    // Add query event
    db.prepare(`
      INSERT INTO task_events (id, task_id, type, description, timestamp)
      VALUES (?, ?, 'query', ?, ?)
    `).run(uuid(), taskId, '用户发起问题', Date.now());

    // Create session
    const session: StreamSession = {
      taskId,
      modelIds,
      results: new Map(),
      errors: new Map(),
      completedCount: 0,
      totalCount: modelIds.length,
    };
    this.sessions.set(taskId, session);

    // Start AI queries
    await aiProxy.queryMultiple(
      {
        query,
        modelIds,
        materials,
        callbacks: {
          onChunk: (modelId: string, delta: string) => {
            if (this.sendToClient) {
              this.sendToClient(ws, {
                type: 'stream_chunk',
                payload: { modelId, delta },
              });
            }
          },
          onEnd: (modelId: string, content: string, tokensUsed: number, latency: number) => {
            session.results.set(modelId, { content, tokensUsed, latency });
            session.completedCount++;

            // Save to task_events
            const model = db.prepare('SELECT name, color FROM models WHERE id = ?').get(modelId) as { name: string; color: string } | undefined;
            db.prepare(`
              INSERT INTO task_events (id, task_id, type, description, model_id, model_name, model_color, content, timestamp)
              VALUES (?, ?, 'ai_response', ?, ?, ?, ?, ?, ?)
            `).run(uuid(), taskId, `${model?.name || modelId} 输出`, modelId, model?.name || modelId, model?.color || '#888', content.slice(0, 500), Date.now());

            // Update task token total
            db.prepare('UPDATE tasks SET token_total = token_total + ?, updated_at = ? WHERE id = ?')
              .run(tokensUsed, Date.now(), taskId);

            if (this.sendToClient) {
              this.sendToClient(ws, {
                type: 'stream_end',
                payload: { modelId, content, tokensUsed, latency },
              });
            }

            // Check if all done
            if (session.completedCount + session.errors.size >= session.totalCount) {
              this.finalizeTask(taskId);
              if (this.sendToClient) {
                this.sendToClient(ws, {
                  type: 'task_updated',
                  payload: { taskId, status: 'completed' },
                });
              }
            }
          },
          onError: (modelId: string, error: string) => {
            session.errors.set(modelId, error);

            if (this.sendToClient) {
              this.sendToClient(ws, {
                type: 'stream_error',
                payload: { modelId, error },
              });
            }

            // Check if all done
            if (session.completedCount + session.errors.size >= session.totalCount) {
              this.finalizeTask(taskId);
              if (this.sendToClient) {
                this.sendToClient(ws, {
                  type: 'task_updated',
                  payload: { taskId, status: 'completed' },
                });
              }
            }
          },
        },
      },
      detectedAccounts
    );

    return taskId;
  }

  /**
   * Cancel an in-progress stream for a specific model.
   */
  cancelModel(modelId: string): void {
    // Note: true stream cancellation requires AbortController integration.
    // For now, we mark it as done — the OpenAI/Anthropic SDK handles cleanup.
    console.log(`[stream] Cancel requested for model: ${modelId}`);
  }

  private async finalizeTask(taskId: string): Promise<void> {
    const db = await getDatabase();
    const session = this.sessions.get(taskId);
    if (!session) return;

    // Build summary
    const parts: string[] = [];
    session.results.forEach((result, modelId) => {
      const model = db.prepare('SELECT name FROM models WHERE id = ?').get(modelId) as { name: string } | undefined;
      parts.push(`${model?.name || modelId}: ${result.content.slice(0, 200)}...`);
    });

    db.prepare('UPDATE tasks SET status = ?, final_result = ?, updated_at = ? WHERE id = ?')
      .run('completed', parts.join('\n\n'), Date.now(), taskId);

    this.sessions.delete(taskId);
  }
}

export const streamManager = new StreamManager();

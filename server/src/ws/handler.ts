import type { WebSocket as WSType } from 'ws';
import { WebSocketServer } from 'ws';
import type { Server as HTTPServer } from 'http';
import type { WSClientMessage, WSServerMessage, DetectedAccount } from '../types.js';
import { detectorRegistry } from '../detectors/index.js';
import { streamManager } from '../services/stream-manager.js';
import { reviewGenerator } from '../services/review-generator.js';

export function createWSServer(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Set up stream manager's send handler
  streamManager.setSendHandler((ws, msg) => {
    sendJSON(ws as WSType, msg);
  });

  wss.on('connection', async (ws: WSType) => {
    console.log('[ws] Client connected');

    // Send auth status on connection
    try {
      const accounts = await detectorRegistry.scanAll();
      sendJSON(ws, {
        type: 'auth_status',
        payload: { accounts },
      });
    } catch (err) {
      console.error('[ws] Auth detection failed:', err);
    }

    ws.on('message', async (data: Buffer) => {
      try {
        const msg: WSClientMessage = JSON.parse(data.toString());
        await handleMessage(ws, msg);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[ws] Message error:', message);
        sendJSON(ws, {
          type: 'stream_error',
          payload: { modelId: 'system', error: message },
        });
      }
    });

    ws.on('close', () => {
      console.log('[ws] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[ws] Error:', err.message);
    });
  });

  console.log('[ws] WebSocket server ready at /ws');
  return wss;
}

async function handleMessage(ws: WSType, msg: WSClientMessage): Promise<void> {
  switch (msg.type) {
    case 'query': {
      const { query, modelIds, materials, taskId } = msg.payload;
      const accounts = await detectorRegistry.scanAll();

      const actualTaskId = await streamManager.handleQuery(
        ws, query, modelIds, materials, accounts
      );

      sendJSON(ws, {
        type: 'task_updated',
        payload: { taskId: actualTaskId, status: 'started' },
      });
      break;
    }

    case 'cancel': {
      const { modelId } = msg.payload;
      streamManager.cancelModel(modelId);
      sendJSON(ws, {
        type: 'stream_end',
        payload: { modelId, content: '[已取消]', tokensUsed: 0, latency: 0 },
      });
      break;
    }

    case 'approval_response': {
      const { approvalId, approved } = msg.payload;
      const { cliExecutor } = await import('../services/cli-executor.js');
      cliExecutor.resolveApproval(approvalId, approved);
      break;
    }

    default:
      console.warn('[ws] Unknown message type:', (msg as { type: string }).type);
  }
}

function sendJSON(ws: WSType, msg: WSServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

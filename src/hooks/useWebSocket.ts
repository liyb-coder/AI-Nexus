import { useEffect, useRef, useCallback, useState } from 'react';

type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
}

interface UseWebSocketOptions {
  onAuthStatus?: (accounts: Array<{
    provider: string;
    status: string;
    authType: string;
    displayName?: string;
    source: string;
    lastVerified: number;
    requiresReauth: boolean;
    errorMessage?: string;
  }>) => void;
  onStreamChunk?: (modelId: string, delta: string) => void;
  onStreamEnd?: (modelId: string, content: string, tokensUsed: number, latency: number) => void;
  onStreamError?: (modelId: string, error: string) => void;
  onApprovalRequest?: (data: {
    approvalId: string;
    tool: string;
    command: string;
    riskLevel: string;
    purpose: string;
  }) => void;
  onReviewGenerated?: (content: string) => void;
  onTaskUpdated?: (taskId: string, status: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep options in a ref so callbacks are always fresh
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    setStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[ws] Connected to backend');
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          const opts = optionsRef.current;

          switch (msg.type) {
            case 'auth_status': {
              const accounts = msg.payload.accounts as Array<{
                provider: string;
                status: string;
                authType: string;
                displayName?: string;
                source: string;
                lastVerified: number;
                requiresReauth: boolean;
                errorMessage?: string;
              }>;
              opts.onAuthStatus?.(accounts);
              break;
            }
            case 'stream_chunk': {
              opts.onStreamChunk?.(
                msg.payload.modelId as string,
                msg.payload.delta as string
              );
              break;
            }
            case 'stream_end': {
              opts.onStreamEnd?.(
                msg.payload.modelId as string,
                msg.payload.content as string,
                msg.payload.tokensUsed as number,
                msg.payload.latency as number
              );
              break;
            }
            case 'stream_error': {
              opts.onStreamError?.(
                msg.payload.modelId as string,
                msg.payload.error as string
              );
              break;
            }
            case 'approval_request': {
              opts.onApprovalRequest?.(msg.payload as {
                approvalId: string;
                tool: string;
                command: string;
                riskLevel: string;
                purpose: string;
              });
              break;
            }
            case 'review_generated': {
              opts.onReviewGenerated?.(msg.payload.content as string);
              break;
            }
            case 'task_updated': {
              opts.onTaskUpdated?.(
                msg.payload.taskId as string,
                msg.payload.status as string
              );
              break;
            }
          }
        } catch (err) {
          console.error('[ws] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[ws] Disconnected');
        setStatus('disconnected');
        // Auto-reconnect after 3s
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[ws] Error:', err);
        setStatus('error');
      };
    } catch (err) {
      console.error('[ws] Connection failed:', err);
      setStatus('error');
      reconnectTimerRef.current = setTimeout(connect, 5000);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const send = useCallback((type: string, payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { status, send, disconnect, reconnect: connect };
}

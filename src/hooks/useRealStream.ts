import { useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

/**
 * Talks to real backend via WebSocket.
 * Falls back to demo message when backend is unavailable.
 */
export function useRealStream() {
  const wsRef = useRef<WebSocket | null>(null);

  const startAllStreams = (query: string) => {
    const store = useAppStore.getState();
    const enabledModels = store.models.filter((m) => m.enabled);
    if (enabledModels.length === 0) return;

    store.setIsQuerying(true);
    store.setCurrentQuery(query);

    // Try WebSocket connection to backend
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//127.0.0.1:5173/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Register response panels for each model
        enabledModels.forEach((model) => {
          const responseId = `resp_${model.id}_${Date.now()}`;
          store.addResponse({
            id: responseId,
            modelId: model.id,
            modelName: model.name,
            modelColor: model.color,
            status: 'loading',
            content: '',
            fullContent: '',
            timestamp: Date.now(),
            messages: [],
          });
        });

        // Send query
        ws.send(JSON.stringify({
          type: 'query',
          payload: {
            query,
            modelIds: enabledModels.map((m) => m.id),
            materials: store.selectedMaterials.length > 0
              ? store.selectedMaterials.map((id) => store.materials.find((m) => m.id === id)?.content).filter(Boolean)
              : undefined,
          },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const s = useAppStore.getState();

          switch (msg.type) {
            case 'stream_chunk': {
              const { modelId, delta } = msg.payload;
              const responses = s.responses.filter(
                (r) => r.modelId === modelId && (r.status === 'loading' || r.status === 'streaming')
              );
              responses.forEach((r) => {
                const latest = useAppStore.getState().responses.find(rr => rr.id === r.id);
                if (latest?.status === 'loading') s.setResponseStatus(r.id, 'streaming');
                s.updateResponseContent(r.id, (latest?.content || r.content) + delta);
              });
              break;
            }
            case 'stream_end': {
              const { modelId, content, tokensUsed, latency } = msg.payload;
              const responses = s.responses.filter((r) => r.modelId === modelId && r.status === 'streaming');
              responses.forEach((r) => {
                s.setResponseStatus(r.id, 'done');
                s.setResponseMetrics(r.id, latency as number, tokensUsed as number);
                if (!r.fullContent) s.updateResponseContent(r.id, content as string);
              });
              break;
            }
            case 'stream_error': {
              const { modelId, error } = msg.payload;
              const responses = s.responses.filter((r) => r.modelId === modelId);
              responses.forEach((r) => {
                s.setResponseStatus(r.id, 'error');
                s.updateResponseContent(r.id, `❌ ${error}`);
              });
              break;
            }
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = () => {
        fallbackDemo(enabledModels);
      };

      ws.onclose = () => {
        store.setIsQuerying(false);
      };

    } catch {
      fallbackDemo(enabledModels);
    }
  };

  // Fallback: demo message when backend unavailable
  const fallbackDemo = (enabledModels: Array<{ id: string; name: string; color: string }>) => {
    const store = useAppStore.getState();
    enabledModels.forEach((model) => {
      const responseId = `resp_${model.id}_${Date.now()}`;
      store.addResponse({
        id: responseId,
        modelId: model.id,
        modelName: model.name,
        modelColor: model.color,
        status: 'done',
        content: '[演示模式] 后端未连接。\n\n请先启动后端: cd server && npm run dev',
        fullContent: '[演示模式] 后端未连接。',
        timestamp: Date.now(),
        messages: [],
      });
    });
    store.setIsQuerying(false);
  };

  return { startAllStreams };
}

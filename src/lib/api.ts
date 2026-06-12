/**
 * AI Nexus API Client
 * Communicates with the local backend server.
 */

const BASE = '/api';

export interface AuthStatusResponse {
  ok: boolean;
  data: {
    authenticated: number;
    keyFound: number;
    notFound: number;
    error: number;
    total: number;
    accounts: Array<{
      provider: string;
      status: 'authenticated' | 'key_found' | 'not_found' | 'error';
      authType: 'oauth' | 'api_key' | 'cli_config';
      displayName?: string;
      source: string;
      lastVerified: number;
      requiresReauth: boolean;
      errorMessage?: string;
    }>;
  };
}

export interface ModelData {
  id: string;
  name: string;
  color: string;
  icon: string;
  enabled: number;
  endpoint: string | null;
  api_key_env: string | null;
  temperature: number;
  max_tokens: number;
  provider: string;
  created_at: number;
  updated_at: number;
}

export interface TaskData {
  id: string;
  title: string;
  query: string;
  status: string;
  model_ids: string;
  model_names: string;
  token_total: number;
  final_result: string | null;
  created_at: number;
  updated_at: number;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json.data as T;
}

// ===== Auth =====
export async function getAuthStatus(): Promise<AuthStatusResponse['data']> {
  return request<AuthStatusResponse['data']>('/auth/status');
}

export async function rescanAuth(): Promise<{ accounts: AuthStatusResponse['data']['accounts'] }> {
  return request('/auth/rescan', { method: 'POST' });
}

// ===== Models =====
export async function getModels(): Promise<ModelData[]> {
  return request<ModelData[]>('/models');
}

export async function toggleModel(id: string): Promise<ModelData> {
  return request<ModelData>(`/models/${id}/toggle`, { method: 'PATCH' });
}

export async function updateModel(id: string, updates: Partial<ModelData>): Promise<ModelData> {
  return request<ModelData>(`/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// ===== Tasks =====
export async function getTasks(): Promise<TaskData[]> {
  return request<TaskData[]>('/tasks');
}

export async function getTask(id: string): Promise<TaskData> {
  return request<TaskData>(`/tasks/${id}`);
}

export async function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}

// ===== Materials =====
export async function createMaterial(data: {
  content: string;
  sourceModel: string;
  sourceModelColor?: string;
  sourceResponseId?: string;
  label?: string;
  taskId?: string;
}): Promise<unknown> {
  return request('/materials', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ===== Health =====
export async function healthCheck(): Promise<{ time: number; uptime: number }> {
  return request('/health');
}

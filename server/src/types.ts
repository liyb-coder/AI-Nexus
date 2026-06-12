// ===== Auth Detection Types =====

export interface DetectedAccount {
  provider: string;
  status: 'authenticated' | 'key_found' | 'not_found' | 'error';
  authType: 'oauth' | 'api_key' | 'cli_config';
  displayName?: string;
  source: string;
  lastVerified: number;
  requiresReauth: boolean;
  errorMessage?: string;
}

export interface Detector {
  name: string;
  detect(): Promise<DetectedAccount[]>;
}

// ===== Database Types =====

export interface ModelRow {
  id: string;
  name: string;
  color: string;
  icon: string;
  enabled: number;
  endpoint: string | null;
  api_key_env: string | null;   // e.g. "ANTHROPIC_API_KEY"
  temperature: number;
  max_tokens: number;
  provider: 'openai-compatible' | 'anthropic';
  created_at: number;
  updated_at: number;
}

export interface SkillRow {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  icon: string;
  color: string;
  category: string;
  tags: string;
  usage_count: number;
  created_at: number;
  updated_at: number;
}

export interface CLIConfigRow {
  id: string;
  name: string;
  command: string;
  version: string | null;
  status: string;
  description: string | null;
  risk_level: string;
  auto_approve: number;
  working_dir: string | null;
  env_vars: string;
  last_used: number | null;
}

export interface TaskRow {
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

export interface TaskEventRow {
  id: string;
  task_id: string;
  type: string;
  description: string | null;
  model_id: string | null;
  model_name: string | null;
  model_color: string | null;
  content: string | null;
  status: string | null;
  timestamp: number;
}

export interface MaterialRow {
  id: string;
  task_id: string | null;
  content: string;
  source_model: string;
  source_model_color: string | null;
  source_response_id: string | null;
  label: string | null;
  created_at: number;
}

export interface MCPServerRow {
  id: string;
  name: string;
  description: string | null;
  command: string;
  args: string;
  env: string;
  transport: string;
  enabled: number;
  status: string;
  tools: string;
  resources: string;
  last_used: number | null;
  created_at: number;
  updated_at: number;
}

export interface ApprovalRow {
  id: string;
  task_id: string | null;
  tool: string;
  command: string;
  working_dir: string | null;
  risk_level: string;
  purpose: string | null;
  resolved: number;
  approved: number | null;
  timestamp: number;
}

// ===== API Types =====

export interface APIResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ===== WebSocket Message Types =====

export type WSClientMessage =
  | { type: 'query'; payload: { query: string; modelIds: string[]; materials?: string[]; taskId?: string } }
  | { type: 'cancel'; payload: { modelId: string } }
  | { type: 'approval_response'; payload: { approvalId: string; approved: boolean } };

export type WSServerMessage =
  | { type: 'auth_status'; payload: { accounts: DetectedAccount[] } }
  | { type: 'stream_start'; payload: { modelId: string; taskId: string } }
  | { type: 'stream_chunk'; payload: { modelId: string; delta: string } }
  | { type: 'stream_end'; payload: { modelId: string; content: string; tokensUsed: number; latency: number } }
  | { type: 'stream_error'; payload: { modelId: string; error: string } }
  | { type: 'approval_request'; payload: { approvalId: string; tool: string; command: string; riskLevel: string; purpose: string } }
  | { type: 'review_generated'; payload: { content: string } }
  | { type: 'task_updated'; payload: { taskId: string; status: string } };

export type AIStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export interface AIModel {
  id: string;
  name: string;
  color: string;
  icon: string;
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  latency?: number;
  tokensUsed?: number;
}

export interface AIMessage {
  round: number;
  query: string;
  content: string;
  status: AIStatus;
  timestamp: number;
}

export interface AIResponse {
  id: string;
  modelId: string;
  modelName: string;
  modelColor: string;
  status: AIStatus;
  content: string;
  fullContent: string;
  timestamp: number;
  latency?: number;
  tokensUsed?: number;
  messages: AIMessage[]; // multi-round messages
}

export interface MaterialItem {
  id: string;
  content: string;
  sourceModel: string;
  sourceModelColor: string;
  sourceResponseId: string;
  timestamp: number;
  label?: string;
}

export interface ApprovalRequest {
  id: string;
  tool: string;
  command: string;
  workingDir: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  purpose: string;
  timestamp: number;
  resolved: boolean;
  approved?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
  color: string;
  category: 'coding' | 'writing' | 'analysis' | 'creative' | 'custom';
  tags: string[];
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface CLIConfig {
  id: string;
  name: string;
  command: string;
  version: string;
  status: 'ready' | 'not-found' | 'error';
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'admin';
  autoApprove: boolean;
  workingDir: string;
  envVars: Record<string, string>;
  lastUsed?: number;
}

export interface MentionTarget {
  id: string;
  name: string;
  type: 'ai' | 'cli';
  icon: string;
}

export type AppView = 'workbench' | 'management' | 'history';
export type ManagementTab = 'skills' | 'cli' | 'models' | 'mcp';

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  transport: 'stdio' | 'sse';
  enabled: boolean;
  status: 'ready' | 'not-found' | 'error' | 'disabled';
  tools: string[];
  resources: string[];
  lastUsed?: number;
}

export type TaskEventType = 'query' | 'ai_response' | 'review' | 'approval' | 'material_added' | 'cli_executed';

export interface TaskEvent {
  id: string;
  type: TaskEventType;
  description: string;
  timestamp: number;
  modelId?: string;
  modelName?: string;
  modelColor?: string;
  content?: string;
  status?: 'pending' | 'completed' | 'rejected';
}

export interface Task {
  id: string;
  title: string;
  query: string;
  timestamp: number;
  status: 'completed' | 'in_progress' | 'paused';
  modelIds: string[];
  modelNames: string[];
  materials: MaterialItem[];
  events: TaskEvent[];
  finalResult?: string;
  tokenTotal: number;
}

export interface AppState {
  // Navigation
  currentView: AppView;
  managementTab: ManagementTab;
  setCurrentView: (view: AppView) => void;
  setManagementTab: (tab: ManagementTab) => void;

  // Models
  models: AIModel[];
  setModels: (models: AIModel[]) => void;
  toggleModel: (id: string) => void;
  updateModel: (id: string, updates: Partial<AIModel>) => void;

  // Responses
  responses: AIResponse[];
  currentQuery: string;
  isQuerying: boolean;
  addResponse: (response: AIResponse) => void;
  updateResponseContent: (id: string, content: string) => void;
  setResponseStatus: (id: string, status: AIStatus) => void;
  setResponseMetrics: (id: string, latency: number, tokens: number) => void;
  clearResponses: () => void;
  removeResponse: (id: string) => void;
  setCurrentQuery: (query: string) => void;
  setIsQuerying: (v: boolean) => void;

  // Material Library
  materials: MaterialItem[];
  addMaterial: (item: MaterialItem) => void;
  removeMaterial: (id: string) => void;
  selectedMaterials: string[];
  toggleMaterialSelection: (id: string) => void;
  clearSelectedMaterials: () => void;

  // Review
  reviewContent: string;
  reviewExpanded: boolean;
  setReviewContent: (content: string) => void;
  setReviewExpanded: (v: boolean) => void;

  // Approval
  approvals: ApprovalRequest[];
  addApproval: (req: ApprovalRequest) => void;
  resolveApproval: (id: string, approved: boolean) => void;

  // Skills
  skills: Skill[];
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  removeSkill: (id: string) => void;

  // CLI Configs
  cliConfigs: CLIConfig[];
  addCLIConfig: (config: CLIConfig) => void;
  updateCLIConfig: (id: string, updates: Partial<CLIConfig>) => void;
  removeCLIConfig: (id: string) => void;

  // Tasks (History)
  tasks: Task[];
  selectedTaskId: string | null;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  selectTask: (id: string | null) => void;

  // MCP Servers
  mcpServers: MCPServer[];
  addMCPServer: (server: MCPServer) => void;
  updateMCPServer: (id: string, updates: Partial<MCPServer>) => void;
  removeMCPServer: (id: string) => void;

  // Input
  inputValue: string;
  setInputValue: (v: string) => void;
  showMentions: boolean;
  setShowMentions: (v: boolean) => void;
  activeMention: string;
  setActiveMention: (v: string) => void;
}

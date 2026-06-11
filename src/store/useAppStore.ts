import { create } from 'zustand';
import type { AppState, AIModel, Skill, CLIConfig, Task, MCPServer } from '@/types';

/*
 * AI Model Theme Colors — extracted from the background scenery
 * (snow-capped mountains, lake, sunset sky) for aesthetic harmony.
 *
 * Kimi:      glacier blue-grey from snow mountains  #8BA4B8
 * Claude:    warm sunset orange from golden hour     #C9956A
 * Codex:     lake teal-green from water surface      #5E8B7E
 * DeepSeek:  dusk purple-grey from distant hills     #9B8DA6
 * GPT-4o:    warm rock brown from mountain base      #A6896E
 */
const defaultModels: AIModel[] = [
  { id: 'kimi', name: 'Kimi', color: '#8BA4B8', icon: 'Brain', enabled: true, endpoint: 'https://api.moonshot.cn/v1', temperature: 0.7, maxTokens: 4096 },
  { id: 'claude', name: 'Claude Code', color: '#C9956A', icon: 'Sparkles', enabled: true, endpoint: 'https://api.anthropic.com/v1', temperature: 0.7, maxTokens: 4096 },
  { id: 'codex', name: 'Codex', color: '#5E8B7E', icon: 'Code2', enabled: true, endpoint: 'https://api.openai.com/v1', temperature: 0.3, maxTokens: 8192 },
  { id: 'deepseek', name: 'DeepSeek', color: '#9B8DA6', icon: 'Zap', enabled: true, endpoint: 'https://api.deepseek.com/v1', temperature: 0.7, maxTokens: 4096 },
  { id: 'openai', name: 'GPT-4o', color: '#A6896E', icon: 'MessageSquare', enabled: false, endpoint: 'https://api.openai.com/v1', temperature: 0.7, maxTokens: 4096 },
];

const defaultSkills: Skill[] = [
  {
    id: 'skill_code_review',
    name: '代码评审',
    description: '对代码进行深度审查，找出潜在问题、性能瓶颈和最佳实践改进',
    prompt: '请对以下代码进行专业评审。关注：1) 代码质量与可读性 2) 潜在bug和安全漏洞 3) 性能优化建议 4) 设计模式与架构 5) 测试覆盖率。输出格式：按严重程度分级，给出具体的修改建议和代码示例。',
    icon: 'code',
    color: '#7e22ce',
    category: 'coding',
    tags: ['代码质量', '审查', '优化'],
    usageCount: 42,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'skill_doc_gen',
    name: '文档生成',
    description: '自动生成函数、类和模块的 API 文档',
    prompt: '请为以下代码生成完整的 API 文档。包含：功能描述、参数说明（类型、必填、默认值）、返回值、异常说明、使用示例。使用 JSDoc / TSDoc 格式。',
    icon: 'file-text',
    color: '#1d4ed8',
    category: 'coding',
    tags: ['文档', '自动化', '开发'],
    usageCount: 28,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'skill_arch_design',
    name: '架构设计',
    description: '分析需求并给出系统架构方案和技术选型建议',
    prompt: '请基于以下需求给出系统架构设计方案。包含：1) 整体架构图（用文字描述）2) 核心模块划分 3) 技术选型（含备选方案对比）4) 数据流设计 5) 扩展性考虑 6) 潜在风险。输出格式使用 Markdown 表格对比各方案优劣。',
    icon: 'layout',
    color: '#c2410c',
    category: 'analysis',
    tags: ['架构', '设计', '技术选型'],
    usageCount: 15,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'skill_data_analysis',
    name: '数据分析',
    description: '对结构化数据进行统计分析并输出可视化建议',
    prompt: '请对以下数据进行深度分析。包含：1) 基础统计量（均值、中位数、标准差等）2) 分布特征 3) 异常值检测 4) 相关性分析 5) 趋势识别 6) 可视化建议（推荐图表类型）。输出用 Markdown 表格展示关键指标。',
    icon: 'bar-chart',
    color: '#0369a1',
    category: 'analysis',
    tags: ['数据', '统计', '可视化'],
    usageCount: 8,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'skill_creative_writing',
    name: '创意写作',
    description: '生成广告文案、产品描述、故事等创意内容',
    prompt: '请基于以下主题和要求进行创意写作。要求：1) 风格符合目标受众 2) 突出核心卖点 3) 包含情感共鸣点 4) 提供 3 个不同角度的版本 5) 每个版本标注适用场景。',
    icon: 'pen-tool',
    color: '#059669',
    category: 'creative',
    tags: ['文案', '创意', '营销'],
    usageCount: 35,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'skill_test_gen',
    name: '测试生成',
    description: '自动生成单元测试、集成测试和边界用例',
    prompt: '请为以下代码生成完整的测试用例。包含：1) 正常路径测试 2) 边界条件测试 3) 异常处理测试 4) 性能测试建议。使用 Jest 风格，每个测试附带注释说明测试意图。',
    icon: 'shield-check',
    color: '#7c3aed',
    category: 'coding',
    tags: ['测试', '自动化', '质量'],
    usageCount: 19,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
  },
];

const defaultCLIConfigs: CLIConfig[] = [
  { id: 'cli_node', name: 'node', command: 'node', version: 'v20.11.0', status: 'ready', description: 'Node.js 运行时', riskLevel: 'low', autoApprove: true, workingDir: '/usr/local/bin', envVars: {} },
  { id: 'cli_npm', name: 'npm', command: 'npm', version: 'v10.2.4', status: 'ready', description: 'Node.js 包管理器', riskLevel: 'medium', autoApprove: false, workingDir: '/usr/local/bin', envVars: {} },
  { id: 'cli_git', name: 'git', command: 'git', version: 'v2.43.0', status: 'ready', description: 'Git 版本控制', riskLevel: 'low', autoApprove: true, workingDir: '/usr/bin', envVars: {} },
  { id: 'cli_python', name: 'python3', command: 'python3', version: 'v3.11.6', status: 'ready', description: 'Python 解释器', riskLevel: 'low', autoApprove: true, workingDir: '/usr/bin', envVars: {} },
  { id: 'cli_lark', name: 'lark-cli', command: 'lark-cli', version: 'v1.2.3', status: 'not-found', description: '飞书开放平台 CLI', riskLevel: 'high', autoApprove: false, workingDir: '/usr/local/bin', envVars: { LARK_APP_ID: '', LARK_APP_SECRET: '' } },
  { id: 'cli_codex', name: 'codex-cli', command: 'codex', version: 'v0.3.1', status: 'ready', description: 'OpenAI Codex CLI', riskLevel: 'medium', autoApprove: false, workingDir: '/usr/local/bin', envVars: { OPENAI_API_KEY: '' } },
  { id: 'cli_claude', name: 'claude-cli', command: 'claude', version: 'v0.25.0', status: 'ready', description: 'Anthropic Claude CLI', riskLevel: 'medium', autoApprove: false, workingDir: '/usr/local/bin', envVars: { ANTHROPIC_API_KEY: '' } },
  { id: 'cli_docker', name: 'docker', command: 'docker', version: 'v24.0.7', status: 'ready', description: 'Docker 容器引擎', riskLevel: 'high', autoApprove: false, workingDir: '/usr/bin', envVars: {} },
];

const defaultTasks: Task[] = [
  {
    id: 'task_001',
    title: '广告片脚本方案对比',
    query: '帮我输出 3 个广告片脚本，并对不同 AI 输出做比较',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    status: 'completed',
    modelIds: ['kimi', 'claude', 'codex'],
    modelNames: ['Kimi', 'Claude Code', 'Codex'],
    tokenTotal: 3456,
    events: [
      { id: 'e1', type: 'query', description: '用户发起问题', timestamp: Date.now() - 1000 * 60 * 60 * 2, content: '帮我输出 3 个广告片脚本，并对不同 AI 输出做比较' },
      { id: 'e2', type: 'ai_response', description: 'Kimi 输出', timestamp: Date.now() - 1000 * 60 * 60 * 2 + 30000, modelId: 'kimi', modelName: 'Kimi', modelColor: '#1d4ed8', content: '偏意境、品牌感和中文表达，第三个方案被加入素材库。' },
      { id: 'e3', type: 'ai_response', description: 'Codex 输出', timestamp: Date.now() - 1000 * 60 * 60 * 2 + 45000, modelId: 'codex', modelName: 'Codex', modelColor: '#7e22ce', content: '以结构化脚本和可执行拆解为主，第二个脚本被加入引用包。' },
      { id: 'e4', type: 'review', description: '生成总结对比', timestamp: Date.now() - 1000 * 60 * 60 * 2 + 120000, content: '推荐融合 Kimi 的情绪线和 Claude 的叙事框架，交给 Codex 产出执行版。' },
      { id: 'e5', type: 'approval', description: '命令审批', timestamp: Date.now() - 1000 * 60 * 60 * 2 + 180000, content: 'Codex 请求调用 lark-cli 创建飞书文档，等待用户允许一次。', status: 'completed' },
    ],
    materials: [
      { id: 'm1', content: 'Kimi / 第 3 个方案：文本脚本，情绪线好', sourceModel: 'Kimi', sourceModelColor: '#1d4ed8', sourceResponseId: 'r1', timestamp: Date.now() - 1000 * 60 * 60 * 2 + 30000, label: '文本脚本' },
      { id: 'm2', content: 'Codex / 第 2 个脚本：JSON，结构清晰', sourceModel: 'Codex', sourceModelColor: '#7e22ce', sourceResponseId: 'r2', timestamp: Date.now() - 1000 * 60 * 60 * 2 + 45000, label: 'JSON' },
      { id: 'm3', content: 'Claude / 分镜预设：提示词，叙事完整', sourceModel: 'Claude', sourceModelColor: '#c2410c', sourceResponseId: 'r3', timestamp: Date.now() - 1000 * 60 * 60 * 2 + 60000, label: '提示词' },
    ],
    finalResult: '融合 Kimi 的镜头诗意与 Codex 的结构化执行，形成一版可直接交付给团队的广告片脚本。',
  },
  {
    id: 'task_002',
    title: '飞书文档自动整理',
    query: '用 lark-cli 把今天的会议纪要整理成飞书文档',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    status: 'completed',
    modelIds: ['claude'],
    modelNames: ['Claude Code'],
    tokenTotal: 890,
    events: [
      { id: 'e1', type: 'query', description: '用户发起问题', timestamp: Date.now() - 1000 * 60 * 60 * 24, content: '用 lark-cli 把今天的会议纪要整理成飞书文档' },
      { id: 'e2', type: 'ai_response', description: 'Claude Code 输出', timestamp: Date.now() - 1000 * 60 * 60 * 24 + 20000, modelId: 'claude', modelName: 'Claude Code', modelColor: '#c2410c', content: '已生成整理后的文档结构，等待 CLI 执行。' },
      { id: 'e3', type: 'cli_executed', description: 'lark-cli 执行', timestamp: Date.now() - 1000 * 60 * 60 * 24 + 60000, content: 'lark-cli doc create --title "会议纪要" 执行成功' },
    ],
    materials: [],
    finalResult: 'Claude Code · lark-cli · 已完成',
  },
  {
    id: 'task_003',
    title: '产品 PRD 多模型评审',
    query: '请评审这个 PRD 文档，给出技术可行性分析和风险评估',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
    status: 'completed',
    modelIds: ['kimi', 'codex', 'deepseek'],
    modelNames: ['Kimi', 'Codex', 'DeepSeek'],
    tokenTotal: 5620,
    events: [
      { id: 'e1', type: 'query', description: '用户发起问题', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 },
      { id: 'e2', type: 'ai_response', description: 'Kimi 输出', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 + 25000, modelId: 'kimi', modelName: 'Kimi', modelColor: '#1d4ed8' },
      { id: 'e3', type: 'ai_response', description: 'Codex 输出', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 + 40000, modelId: 'codex', modelName: 'Codex', modelColor: '#7e22ce' },
      { id: 'e4', type: 'ai_response', description: 'DeepSeek 输出', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 + 55000, modelId: 'deepseek', modelName: 'DeepSeek', modelColor: '#0369a1' },
      { id: 'e5', type: 'review', description: '生成总结对比', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 + 150000 },
    ],
    materials: [
      { id: 'm1', content: '技术风险清单：第三方依赖有 3 个高危漏洞', sourceModel: 'DeepSeek', sourceModelColor: '#0369a1', sourceResponseId: 'r1', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 },
    ],
    finalResult: 'Kimi / Codex / DeepSeek · 有总结',
  },
  {
    id: 'task_004',
    title: 'Mac 客户端技术选型',
    query: '对比 Tauri vs Electron 做 Mac 桌面端的优劣',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5,
    status: 'paused',
    modelIds: ['kimi', 'deepseek'],
    modelNames: ['Kimi', 'DeepSeek'],
    tokenTotal: 2340,
    events: [
      { id: 'e1', type: 'query', description: '用户发起问题', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 },
      { id: 'e2', type: 'ai_response', description: 'Kimi 输出', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 + 20000, modelId: 'kimi', modelName: 'Kimi', modelColor: '#1d4ed8' },
      { id: 'e3', type: 'ai_response', description: 'DeepSeek 输出', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 + 35000, modelId: 'deepseek', modelName: 'DeepSeek', modelColor: '#0369a1' },
    ],
    materials: [],
    finalResult: 'Tauri vs Electron · 待继续',
  },
];

const defaultMCPServers: MCPServer[] = [
  {
    id: 'mcp_filesystem',
    name: 'filesystem',
    description: '本地文件系统访问 — 读写文件、目录遍历',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/dev/Documents'],
    env: {},
    transport: 'stdio',
    enabled: true,
    status: 'ready',
    tools: ['read_file', 'write_file', 'list_directory', 'search_files'],
    resources: ['file:///*'],
    lastUsed: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'mcp_github',
    name: 'github',
    description: 'GitHub API 集成 — 仓库管理、Issue、PR 操作',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
    transport: 'stdio',
    enabled: true,
    status: 'ready',
    tools: ['search_repositories', 'get_file_contents', 'create_issue', 'create_pull_request'],
    resources: ['github:///*'],
    lastUsed: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'mcp_sqlite',
    name: 'sqlite',
    description: 'SQLite 数据库查询 — 执行 SQL、读写数据',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite', '/Users/dev/data/app.db'],
    env: {},
    transport: 'stdio',
    enabled: false,
    status: 'disabled',
    tools: ['query', 'execute', 'list_tables'],
    resources: ['sqlite:///*'],
  },
  {
    id: 'mcp_fetch',
    name: 'fetch',
    description: 'HTTP 请求 — 访问网络资源、API 调用',
    command: 'uvx',
    args: ['mcp-server-fetch'],
    env: {},
    transport: 'stdio',
    enabled: true,
    status: 'ready',
    tools: ['fetch', 'get', 'post'],
    resources: ['http://*', 'https://*'],
    lastUsed: Date.now() - 1000 * 60 * 60,
  },
  {
    id: 'mcp_puppeteer',
    name: 'puppeteer',
    description: '浏览器自动化 — 网页截图、DOM 操作',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    env: {},
    transport: 'stdio',
    enabled: false,
    status: 'not-found',
    tools: ['puppeteer_navigate', 'puppeteer_screenshot', 'puppeteer_click'],
    resources: ['browser:///*'],
  },
];

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'workbench',
  managementTab: 'skills',
  setCurrentView: (view) => set({ currentView: view }),
  setManagementTab: (tab) => set({ managementTab: tab }),

  // Models
  models: defaultModels,
  setModels: (models) => set({ models }),
  toggleModel: (id) =>
    set((s) => ({
      models: s.models.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    })),
  updateModel: (id, updates) =>
    set((s) => ({
      models: s.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  // Responses
  responses: [],
  currentQuery: '',
  isQuerying: false,
  addResponse: (response) =>
    set((s) => ({
      responses: [...s.responses, { ...response, messages: [] }],
    })),
  updateResponseContent: (id, content) =>
    set((s) => ({
      responses: s.responses.map((r) =>
        r.id === id ? { ...r, content, fullContent: content } : r
      ),
    })),
  setResponseStatus: (id, status) =>
    set((s) => ({
      responses: s.responses.map((r) => (r.id === id ? { ...r, status } : r)),
    })),
  setResponseMetrics: (id, latency, tokensUsed) =>
    set((s) => ({
      responses: s.responses.map((r) =>
        r.id === id ? { ...r, latency, tokensUsed } : r
      ),
    })),
  clearResponses: () => set({ responses: [], reviewContent: '' }),
  removeResponse: (id) =>
    set((s) => ({
      responses: s.responses.filter((r) => r.id !== id),
    })),
  setCurrentQuery: (query) => set({ currentQuery: query }),
  setIsQuerying: (v) => set({ isQuerying: v }),

  // Material Library
  materials: [],
  addMaterial: (item) =>
    set((s) => ({ materials: [...s.materials, item] })),
  removeMaterial: (id) =>
    set((s) => ({
      materials: s.materials.filter((m) => m.id !== id),
      selectedMaterials: s.selectedMaterials.filter((m) => m !== id),
    })),
  selectedMaterials: [],
  toggleMaterialSelection: (id) =>
    set((s) => ({
      selectedMaterials: s.selectedMaterials.includes(id)
        ? s.selectedMaterials.filter((m) => m !== id)
        : [...s.selectedMaterials, id],
    })),
  clearSelectedMaterials: () => set({ selectedMaterials: [] }),

  // Review
  reviewContent: '',
  reviewExpanded: false,
  setReviewContent: (content) => set({ reviewContent: content }),
  setReviewExpanded: (v) => set({ reviewExpanded: v }),

  // Approval
  approvals: [],
  addApproval: (req) =>
    set((s) => ({ approvals: [...s.approvals, req] }),
  ),
  resolveApproval: (id, approved) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, resolved: true, approved } : a
      ),
    })),

  // Skills
  skills: defaultSkills,
  addSkill: (skill) =>
    set((s) => ({ skills: [...s.skills, skill] })),
  updateSkill: (id, updates) =>
    set((s) => ({
      skills: s.skills.map((sk) => (sk.id === id ? { ...sk, ...updates, updatedAt: Date.now() } : sk)),
    })),
  removeSkill: (id) =>
    set((s) => ({
      skills: s.skills.filter((sk) => sk.id !== id),
    })),

  // CLI Configs
  cliConfigs: defaultCLIConfigs,
  addCLIConfig: (config) =>
    set((s) => ({ cliConfigs: [...s.cliConfigs, config] })),
  updateCLIConfig: (id, updates) =>
    set((s) => ({
      cliConfigs: s.cliConfigs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeCLIConfig: (id) =>
    set((s) => ({
      cliConfigs: s.cliConfigs.filter((c) => c.id !== id),
    })),

  // Tasks (History)
  tasks: defaultTasks,
  selectedTaskId: 'task_001',
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTask: (id) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
    })),
  selectTask: (id) => set({ selectedTaskId: id }),

  // MCP Servers
  mcpServers: defaultMCPServers,
  addMCPServer: (server) =>
    set((s) => ({ mcpServers: [...s.mcpServers, server] })),
  updateMCPServer: (id, updates) =>
    set((s) => ({
      mcpServers: s.mcpServers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  removeMCPServer: (id) =>
    set((s) => ({
      mcpServers: s.mcpServers.filter((m) => m.id !== id),
    })),

  // Input
  inputValue: '',
  setInputValue: (v) => set({ inputValue: v }),
  showMentions: false,
  setShowMentions: (v) => set({ showMentions: v }),
  activeMention: '',
  setActiveMention: (v) => set({ activeMention: v }),
}));

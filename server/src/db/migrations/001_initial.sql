-- AI Nexus Database Schema
-- SQLite migration 001

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#5E8B7E',
  icon TEXT DEFAULT 'Brain',
  enabled INTEGER DEFAULT 1,
  endpoint TEXT,
  api_key_env TEXT,
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  provider TEXT DEFAULT 'openai-compatible',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  icon TEXT DEFAULT 'code',
  color TEXT DEFAULT '#7e22ce',
  category TEXT DEFAULT 'custom',
  tags TEXT DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS cli_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  command TEXT NOT NULL,
  version TEXT,
  status TEXT DEFAULT 'ready',
  description TEXT,
  risk_level TEXT DEFAULT 'medium',
  auto_approve INTEGER DEFAULT 0,
  working_dir TEXT,
  env_vars TEXT DEFAULT '{}',
  last_used INTEGER
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  query TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  model_ids TEXT NOT NULL DEFAULT '[]',
  model_names TEXT NOT NULL DEFAULT '[]',
  token_total INTEGER DEFAULT 0,
  final_result TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS task_events (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  model_id TEXT,
  model_name TEXT,
  model_color TEXT,
  content TEXT,
  status TEXT,
  timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  source_model TEXT NOT NULL,
  source_model_color TEXT,
  source_response_id TEXT,
  label TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS mcp_servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  command TEXT NOT NULL,
  args TEXT DEFAULT '[]',
  env TEXT DEFAULT '{}',
  transport TEXT DEFAULT 'stdio',
  enabled INTEGER DEFAULT 0,
  status TEXT DEFAULT 'disabled',
  tools TEXT DEFAULT '[]',
  resources TEXT DEFAULT '[]',
  last_used INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  tool TEXT NOT NULL,
  command TEXT NOT NULL,
  working_dir TEXT,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  purpose TEXT,
  resolved INTEGER DEFAULT 0,
  approved INTEGER,
  timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  detail TEXT,
  user_approved INTEGER DEFAULT 0,
  result TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Default models
INSERT OR IGNORE INTO models (id, name, color, icon, enabled, endpoint, api_key_env, temperature, max_tokens, provider)
VALUES
  ('kimi', 'Kimi', '#8BA4B8', 'Brain', 1, 'https://api.moonshot.cn/v1', 'MOONSHOT_API_KEY', 0.7, 4096, 'openai-compatible'),
  ('claude', 'Claude Code', '#C9956A', 'Sparkles', 1, 'https://api.anthropic.com/v1', 'ANTHROPIC_API_KEY', 0.7, 4096, 'anthropic'),
  ('codex', 'Codex', '#5E8B7E', 'Code2', 1, 'https://api.openai.com/v1', 'OPENAI_API_KEY', 0.3, 8192, 'openai-compatible'),
  ('deepseek', 'DeepSeek', '#9B8DA6', 'Zap', 1, 'https://api.deepseek.com/v1', 'DEEPSEEK_API_KEY', 0.7, 4096, 'openai-compatible'),
  ('openai', 'GPT-4o', '#A6896E', 'MessageSquare', 0, 'https://api.openai.com/v1', 'OPENAI_API_KEY', 0.7, 4096, 'openai-compatible');

-- Default skills
INSERT OR IGNORE INTO skills (id, name, description, prompt, icon, color, category, tags, usage_count)
VALUES
  ('skill_code_review', '代码评审', '对代码进行深度审查', '请对以下代码进行专业评审...', 'code', '#7e22ce', 'coding', '["代码质量","审查","优化"]', 42),
  ('skill_doc_gen', '文档生成', '自动生成API文档', '请为以下代码生成完整的API文档...', 'file-text', '#1d4ed8', 'coding', '["文档","自动化","开发"]', 28),
  ('skill_arch_design', '架构设计', '系统架构方案设计', '请基于以下需求给出系统架构设计方案...', 'layout', '#c2410c', 'analysis', '["架构","设计","技术选型"]', 15),
  ('skill_data_analysis', '数据分析', '结构化数据分析', '请对以下数据进行深度分析...', 'bar-chart', '#0369a1', 'analysis', '["数据","统计","可视化"]', 8),
  ('skill_creative_writing', '创意写作', '创意内容生成', '请基于以下主题和要求进行创意写作...', 'pen-tool', '#059669', 'creative', '["文案","创意","营销"]', 35),
  ('skill_test_gen', '测试生成', '自动生成测试用例', '请为以下代码生成完整的测试用例...', 'shield-check', '#7c3aed', 'coding', '["测试","自动化","质量"]', 19);

-- Default CLI configs
INSERT OR IGNORE INTO cli_configs (id, name, command, version, status, description, risk_level, auto_approve, working_dir, env_vars)
VALUES
  ('cli_node', 'node', 'node', 'v20.11.0', 'ready', 'Node.js 运行时', 'low', 1, '/usr/local/bin', '{}'),
  ('cli_npm', 'npm', 'npm', 'v10.2.4', 'ready', 'Node.js 包管理器', 'medium', 0, '/usr/local/bin', '{}'),
  ('cli_git', 'git', 'git', 'v2.43.0', 'ready', 'Git 版本控制', 'low', 1, '/usr/bin', '{}'),
  ('cli_python', 'python3', 'python3', 'v3.11.6', 'ready', 'Python 解释器', 'low', 1, '/usr/bin', '{}'),
  ('cli_lark', 'lark-cli', 'lark-cli', 'v1.2.3', 'not-found', '飞书开放平台 CLI', 'high', 0, '/usr/local/bin', '{"LARK_APP_ID":"","LARK_APP_SECRET":""}'),
  ('cli_codex', 'codex-cli', 'codex', 'v0.3.1', 'ready', 'OpenAI Codex CLI', 'medium', 0, '/usr/local/bin', '{"OPENAI_API_KEY":""}'),
  ('cli_claude', 'claude-cli', 'claude', 'v0.25.0', 'ready', 'Anthropic Claude CLI', 'medium', 0, '/usr/local/bin', '{"ANTHROPIC_API_KEY":""}'),
  ('cli_docker', 'docker', 'docker', 'v24.0.7', 'ready', 'Docker 容器引擎', 'high', 0, '/usr/bin', '{}');

-- Default MCP servers
INSERT OR IGNORE INTO mcp_servers (id, name, description, command, args, env, transport, enabled, status, tools, resources)
VALUES
  ('mcp_filesystem', 'filesystem', '本地文件系统访问', 'npx', '["-y","@modelcontextprotocol/server-filesystem","/Users/dev/Documents"]', '{}', 'stdio', 1, 'ready', '["read_file","write_file","list_directory","search_files"]', '["file:///*"]'),
  ('mcp_github', 'github', 'GitHub API 集成', 'npx', '["-y","@modelcontextprotocol/server-github"]', '{"GITHUB_PERSONAL_ACCESS_TOKEN":""}', 'stdio', 1, 'ready', '["search_repositories","get_file_contents","create_issue","create_pull_request"]', '["github:///*"]'),
  ('mcp_fetch', 'fetch', 'HTTP 请求', 'uvx', '["mcp-server-fetch"]', '{}', 'stdio', 1, 'ready', '["fetch","get","post"]', '["http://*","https://*"]');

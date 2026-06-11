import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import type { ManagementTab } from '@/types';
import {
  Wrench,
  Terminal,
  Cpu,
  Server,
  ArrowLeft,
} from 'lucide-react';
import { SkillsTab } from './SkillsTab';
import { CLITab } from './CLITab';
import { ModelsTab } from './ModelsTab';
import { MCPTab } from './MCPTab';

const mgmtTabs: { id: ManagementTab; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: 'skills',
    label: 'Skills',
    icon: <Wrench className="w-4 h-4" />,
    desc: '管理 AI 技能模板与提示词',
  },
  {
    id: 'cli',
    label: 'CLI 工具',
    icon: <Terminal className="w-4 h-4" />,
    desc: '配置本地命令行运行时',
  },
  {
    id: 'models',
    label: '模型配置',
    icon: <Cpu className="w-4 h-4" />,
    desc: '管理 AI 模型与 API 密钥',
  },
  {
    id: 'mcp',
    label: 'MCP',
    icon: <Server className="w-4 h-4" />,
    desc: '管理 MCP 上下文服务器',
  },
];

export function ManagementPage() {
  const { managementTab, setManagementTab, setCurrentView } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
    >
      {/* Top Bar */}
      <header className="h-16 flex items-center px-6 glass-panel border-b border-white/40 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('workbench')}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/30 rounded-lg transition-colors"
            title="返回工作台"
          >
            <ArrowLeft className="w-4 h-4 text-[#5e5e61]" />
          </button>
          <div className="h-6 w-px bg-white/30" />
          <h1 className="text-lg font-semibold text-[#1a1c1f] tracking-tight">
            管理控制台
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] font-bold text-[#1a1c1f]">本地优先模式</p>
            <p className="text-[9px] text-[#5e5e61]">所有数据存储在本地</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-200 to-gray-400 border border-white/50" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sub-nav */}
        <nav className="w-56 shrink-0 glass-panel border-r border-white/40 flex flex-col">
          <div className="p-4 space-y-1">
            {mgmtTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setManagementTab(tab.id)}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                  managementTab === tab.id
                    ? 'bg-white/40 border border-white/60 shadow-sm'
                    : 'border border-transparent hover:bg-white/20 hover:border-white/30'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg icon-glass shrink-0 ${
                    managementTab === tab.id ? 'active-tab' : ''
                  }`}
                >
                  {tab.icon}
                </div>
                <div>
                  <span
                    className={`text-[13px] font-medium ${
                      managementTab === tab.id ? 'text-[#1a1c1f]' : 'text-[#5e5e61]'
                    }`}
                  >
                    {tab.label}
                  </span>
                  <p className="text-[10px] text-[#5e5e61] mt-0.5 leading-tight">
                    {tab.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-auto p-4 border-t border-white/20">
            <ManagementStats />
          </div>
        </nav>

        {/* Main Panel */}
        <div className="flex-1 overflow-hidden">
          {managementTab === 'skills' && <SkillsTab />}
          {managementTab === 'cli' && <CLITab />}
          {managementTab === 'models' && <ModelsTab />}
          {managementTab === 'mcp' && <MCPTab />}
        </div>
      </div>
    </motion.div>
  );
}

function ManagementStats() {
  const { skills, cliConfigs, models, mcpServers } = useAppStore();
  const readyCLIs = cliConfigs.filter((c) => c.status === 'ready').length;
  const enabledModels = models.filter((m) => m.enabled).length;
  const enabledMCPs = mcpServers.filter((s) => s.enabled).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#5e5e61]">Skills</span>
        <span className="text-[#1a1c1f] font-mono font-bold">{skills.length}</span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#5e5e61]">CLI 就绪</span>
        <span className="text-[#10b981] font-mono font-bold">{readyCLIs}/{cliConfigs.length}</span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#5e5e61]">模型在线</span>
        <span className="text-[#1d4ed8] font-mono font-bold">{enabledModels}/{models.length}</span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#5e5e61]">MCP 启用</span>
        <span className="text-purple-500 font-mono font-bold">{enabledMCPs}/{mcpServers.length}</span>
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  X,
  Key,
  Cpu,
  Globe,
  Shield,
  Terminal,
  Save,
  Eye,
  EyeOff,
  RotateCcw,
  Settings2,
} from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'models' | 'apikeys' | 'runtime' | 'security';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('models');
  const { models, toggleModel } = useAppStore();
  const [apiKeys, setApiKeys] = useState({ kimi: '', claude: '', codex: '', deepseek: '', openai: '' });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'models', label: '模型', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'apikeys', label: 'API 密钥', icon: <Key className="w-3.5 h-3.5" /> },
    { id: 'runtime', label: '运行时', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'security', label: '安全', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[640px] max-w-[90vw] h-[520px] glass-panel-strong rounded-2xl overflow-hidden flex flex-col border border-white/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/30">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#5e5e61]" />
                <h2 className="text-sm font-bold text-[#1a1c1f]">设置</h2>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/40 transition-colors">
                <X className="w-4 h-4 text-[#5e5e61]" />
              </button>
            </div>

            {/* Tabs + Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Tab List */}
              <div className="w-40 shrink-0 border-r border-white/20 p-2 space-y-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] transition-all ${
                      activeTab === tab.id
                        ? 'text-[#1a1c1f] bg-white/40 font-medium'
                        : 'text-[#5e5e61] hover:text-[#1a1c1f] hover:bg-white/20'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto scroll-hide p-5">
                {activeTab === 'models' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#1a1c1f] mb-1">已连接模型</h3>
                      <p className="text-[11px] text-[#5e5e61] mb-4">启用或禁用要在查询中使用的 AI 模型</p>
                    </div>
                    <div className="space-y-2">
                      {models.map((model) => (
                        <div key={model.id} className="flex items-center justify-between p-3 rounded-xl bg-white/20 border border-white/30">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: model.enabled ? model.color : '#c4c4c4', boxShadow: model.enabled ? `0 0 8px ${model.color}30` : 'none' }} />
                            <div>
                              <span className={`text-[13px] font-medium ${model.enabled ? 'text-[#1a1c1f]' : 'text-[#5e5e61]'}`}>{model.name}</span>
                              <p className="text-[10px] text-[#5e5e61] font-mono">{model.id}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleModel(model.id)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${model.enabled ? 'bg-black/10' : 'bg-black/5'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${model.enabled ? 'left-[22px]' : 'left-0.5'}`} style={{ backgroundColor: model.enabled ? model.color : '#c4c4c4' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="flex items-center gap-2 text-[11px] text-blue-600 hover:text-blue-700 transition-colors mt-2">
                      <Globe className="w-3 h-3" />
                      <span>添加自定义 OpenAI-compatible 端点</span>
                    </button>
                  </div>
                )}

                {activeTab === 'apikeys' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#1a1c1f] mb-1">API 密钥</h3>
                      <p className="text-[11px] text-[#5e5e61] mb-4">密钥存储在系统钥匙串中，不会明文保存</p>
                    </div>
                    <div className="space-y-3">
                      {models.filter((m) => m.enabled).map((model) => (
                        <div key={model.id}>
                          <label className="flex items-center gap-2 text-[11px] text-[#1a1c1f] mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: model.color }} />
                            {model.name}
                          </label>
                          <div className="relative">
                            <input
                              type={showKeys[model.id] ? 'text' : 'password'}
                              value={apiKeys[model.id as keyof typeof apiKeys]}
                              onChange={(e) => setApiKeys((prev) => ({ ...prev, [model.id]: e.target.value }))}
                              placeholder="sk-..."
                              className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 pr-9 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 font-mono focus:outline-none focus:border-white/60 transition-colors"
                            />
                            <button
                              onClick={() => setShowKeys((prev) => ({ ...prev, [model.id]: !prev[model.id] }))}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5e5e61] hover:text-[#1a1c1f]"
                            >
                              {showKeys[model.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'runtime' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#1a1c1f] mb-1">本地运行时</h3>
                      <p className="text-[11px] text-[#5e5e61] mb-4">管理本地 CLI 工具的运行时环境</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'node', version: 'v20.11.0', status: 'ready' },
                        { name: 'python', version: 'v3.11.6', status: 'ready' },
                        { name: 'git', version: 'v2.43.0', status: 'ready' },
                        { name: 'lark-cli', version: 'v1.2.3', status: 'not-found' },
                        { name: 'codex-cli', version: 'v0.3.1', status: 'ready' },
                        { name: 'claude-cli', version: 'v0.25.0', status: 'ready' },
                      ].map((tool) => (
                        <div key={tool.name} className="flex items-center justify-between p-3 rounded-xl bg-white/20 border border-white/30">
                          <div className="flex items-center gap-3">
                            <Terminal className="w-3.5 h-3.5 text-[#5e5e61]" />
                            <div>
                              <span className="text-[12px] text-[#1a1c1f] font-mono">{tool.name}</span>
                              <p className="text-[10px] text-[#5e5e61] font-mono">{tool.version}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${tool.status === 'ready' ? 'bg-[#10b981]' : 'bg-[#c4c4c4]'}`} />
                            <span className={`text-[10px] font-mono ${tool.status === 'ready' ? 'text-[#10b981]' : 'text-[#5e5e61]'}`}>{tool.status === 'ready' ? '就绪' : '未安装'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-[11px] text-amber-700 leading-relaxed flex items-start gap-1.5">
                        <Shield className="w-3 h-3 mt-0.5 shrink-0" />
                        所有 CLI 操作在执行前都需要你的明确授权
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#1a1c1f] mb-1">权限管理</h3>
                      <p className="text-[11px] text-[#5e5e61] mb-4">配置 CLI 命令的风险分级和自动审批规则</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { level: 'read', label: '读取操作', desc: 'ls, cat, git status', color: '#10b981', auto: true },
                        { level: 'write', label: '写入操作', desc: '文件修改, git commit', color: '#f59e0b', auto: false },
                        { level: 'exec', label: '执行操作', desc: 'npm run, python', color: '#f59e0b', auto: false },
                        { level: 'network', label: '网络请求', desc: 'curl, lark-cli API', color: '#ef4444', auto: false },
                        { level: 'admin', label: '管理操作', desc: 'rm -rf, sudo', color: '#dc2626', auto: false },
                      ].map((perm) => (
                        <div key={perm.level} className="p-3 rounded-xl bg-white/20 border border-white/30">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: perm.color }} />
                              <span className="text-[12px] text-[#1a1c1f] font-medium">{perm.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#5e5e61]">自动审批</span>
                              <div className={`w-8 h-4 rounded-full relative ${perm.auto ? 'bg-black/10' : 'bg-black/5'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${perm.auto ? 'left-[18px]' : 'left-0.5'}`} style={{ backgroundColor: perm.auto ? perm.color : '#c4c4c4' }} />
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#5e5e61] font-mono pl-4">{perm.desc}</p>
                        </div>
                      ))}
                    </div>
                    <button className="flex items-center gap-2 text-[11px] text-[#5e5e61] hover:text-[#1a1c1f] transition-colors">
                      <RotateCcw className="w-3 h-3" />
                      <span>重置所有权限为默认</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-white/20">
              <span className="text-[10px] text-[#5e5e61]">汇智台 v1.0.0-local</span>
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${
                  saved ? 'bg-[#10b981] text-white' : 'bg-[#1a1c1f] text-white hover:opacity-90'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {saved ? '已保存' : '保存设置'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

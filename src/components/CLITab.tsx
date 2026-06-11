import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import type { CLIConfig } from '@/types';
import {
  Terminal,
  FolderOpen,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

const riskLabels: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: '低风险', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  medium: { label: '中风险', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  high: { label: '高风险', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  admin: { label: '管理员', color: '#dc2626', bg: 'rgba(220,38,38,0.15)' },
};

export function CLITab() {
  const { cliConfigs, updateCLIConfig, removeCLIConfig, addCLIConfig } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'ready' | 'not-found'>('all');
  const [editingCLI, setEditingCLI] = useState<CLIConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filtered = cliConfigs.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const readyCount = cliConfigs.filter((c) => c.status === 'ready').length;

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1a1c1f]">CLI 运行时</h2>
          <p className="text-[11px] text-[#5e5e61] mt-0.5">
            {readyCount} 个工具就绪 · {cliConfigs.length} 个已配置
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/30 rounded-full p-0.5">
            {(['all', 'ready', 'not-found'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  filter === f ? 'bg-[#1a1c1f] text-white' : 'text-[#5e5e61] hover:bg-white/30'
                }`}
              >
                {f === 'all' ? '全部' : f === 'ready' ? '就绪' : '未安装'}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setIsCreating(true); setEditingCLI(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1c1f] text-white text-[11px] font-bold rounded-full hover:opacity-90 transition-opacity active:scale-95"
          >
            <Plus className="w-3 h-3" />
            添加
          </button>
        </div>
      </div>

      {/* CLI List */}
      <div className="flex-1 overflow-y-auto scroll-hide space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((cli, i) => {
            const risk = riskLabels[cli.riskLevel];
            return (
              <motion.div
                key={cli.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.03 }}
                className="glass-panel rounded-2xl p-5 group"
              >
                <div className="flex items-start justify-between">
                  {/* Left */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl icon-glass shrink-0">
                      <Terminal className="w-5 h-5 text-[#374151]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-[13px] font-bold text-[#1a1c1f]">
                          {cli.name}
                        </h3>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ backgroundColor: risk.bg, color: risk.color }}
                        >
                          {risk.label}
                        </span>
                        {cli.status === 'ready' ? (
                          <span className="flex items-center gap-1 text-[10px] text-[#10b981] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            就绪
                          </span>
                        ) : cli.status === 'not-found' ? (
                          <span className="flex items-center gap-1 text-[10px] text-[#5e5e61] font-medium">
                            <XCircle className="w-3 h-3" />
                            未安装
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-[#ef4444] font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            异常
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5e5e61] mb-2">
                        {cli.description}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-[#5e5e61] font-mono">
                        <span className="flex items-center gap-1">
                          <span className="text-[8px]">$</span>
                          {cli.command}
                        </span>
                        <span>{cli.version}</span>
                        <span className="flex items-center gap-1">
                          <FolderOpen className="w-2.5 h-2.5" />
                          {cli.workingDir}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() =>
                        updateCLIConfig(cli.id, { autoApprove: !cli.autoApprove })
                      }
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors"
                      title={cli.autoApprove ? '自动审批已开启' : '自动审批已关闭'}
                    >
                      {cli.autoApprove ? (
                        <ToggleRight className="w-4 h-4 text-[#10b981]" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-[#5e5e61]" />
                      )}
                      <span className={cli.autoApprove ? 'text-[#10b981]' : 'text-[#5e5e61]'}>
                        自动审批
                      </span>
                    </button>
                    <button
                      onClick={() => { setEditingCLI(cli); setIsCreating(false); }}
                      className="p-1.5 hover:bg-white/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 className="w-3 h-3 text-[#5e5e61]" />
                    </button>
                    <button
                      onClick={() => removeCLIConfig(cli.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3 text-[#5e5e61] hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Edit/Create Modal */}
      <CLIEditModal
        cli={editingCLI}
        isOpen={isCreating || !!editingCLI}
        onClose={() => { setEditingCLI(null); setIsCreating(false); }}
        onSave={(cli) => {
          if (editingCLI) {
            updateCLIConfig(editingCLI.id, cli);
          } else {
            addCLIConfig({
              ...cli,
              id: `cli_${Date.now()}`,
              status: 'not-found',
              envVars: {},
            } as CLIConfig);
          }
          setEditingCLI(null);
          setIsCreating(false);
        }}
      />
    </div>
  );
}

function CLIEditModal({
  cli,
  isOpen,
  onClose,
  onSave,
}: {
  cli: CLIConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cli: Partial<CLIConfig>) => void;
}) {
  const [name, setName] = useState(cli?.name || '');
  const [command, setCommand] = useState(cli?.command || '');
  const [description, setDescription] = useState(cli?.description || '');
  const [riskLevel, setRiskLevel] = useState(cli?.riskLevel || 'medium');
  const [workingDir, setWorkingDir] = useState(cli?.workingDir || '/usr/local/bin');

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[480px] max-w-[90vw] glass-panel-strong rounded-2xl overflow-hidden flex flex-col border border-white/60"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/30 shrink-0">
          <h3 className="text-sm font-bold text-[#1a1c1f]">{cli ? '编辑 CLI' : '添加 CLI 工具'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/40 transition-colors">
            <X className="w-4 h-4 text-[#5e5e61]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">工具名称</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：docker" className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">命令</label>
            <input value={command} onChange={(e) => setCommand(e.target.value)} placeholder="如：docker" className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 font-mono" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">描述</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="工具的功能描述..." className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">风险等级</label>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as CLIConfig['riskLevel'])} className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] focus:outline-none focus:border-white/60">
                {Object.entries(riskLabels).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">工作目录</label>
              <input value={workingDir} onChange={(e) => setWorkingDir(e.target.value)} className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 font-mono" />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-white/20">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/20 text-[#1a1c1f] text-[12px] font-bold border border-white/40 hover:bg-white/40 transition-colors active:scale-95">取消</button>
          <button
            onClick={() => onSave({ name, command, description, riskLevel: riskLevel as CLIConfig['riskLevel'], workingDir })}
            disabled={!name.trim() || !command.trim()}
            className="px-4 py-2 rounded-xl bg-[#1a1c1f] text-white text-[12px] font-bold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {cli ? '保存' : '添加'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import type { MCPServer } from '@/types';
import {
  Server,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Terminal,
  Globe,
  Wrench,
  FolderOpen,
  Edit3,
  X,
  Plus,
  Trash2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ready: { label: '就绪', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 className="w-3 h-3" /> },
  'not-found': { label: '未安装', color: '#5e5e61', bg: 'rgba(94,94,97,0.1)', icon: <XCircle className="w-3 h-3" /> },
  error: { label: '异常', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertTriangle className="w-3 h-3" /> },
  disabled: { label: '已禁用', color: '#5e5e61', bg: 'rgba(94,94,97,0.1)', icon: <XCircle className="w-3 h-3" /> },
};

export function MCPTab() {
  const { mcpServers, updateMCPServer, removeMCPServer } = useAppStore();
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const enabledCount = mcpServers.filter((s) => s.enabled).length;
  const readyCount = mcpServers.filter((s) => s.status === 'ready').length;

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1a1c1f]">MCP 服务器</h2>
          <p className="text-[11px] text-[#5e5e61] mt-0.5">
            {readyCount} 个就绪 · {enabledCount} 个已启用 · {mcpServers.length} 个已配置
          </p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingServer(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1c1f] text-white text-[11px] font-bold rounded-full hover:opacity-90 transition-opacity active:scale-95"
        >
          <Plus className="w-3 h-3" />
          添加
        </button>
      </div>

      {/* MCP Servers List */}
      <div className="flex-1 overflow-y-auto scroll-hide space-y-3">
        <AnimatePresence mode="popLayout">
          {mcpServers.map((server, i) => {
            const sc = statusConfig[server.status];
            return (
              <motion.div
                key={server.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.03 }}
                className="glass-panel rounded-2xl p-5 group"
              >
                <div className="flex items-start justify-between">
                  {/* Left */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl icon-glass shrink-0">
                      <Server className="w-5 h-5 text-[#374151]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="text-[13px] font-bold text-[#1a1c1f]">{server.name}</h3>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1"
                          style={{ backgroundColor: sc.bg, color: sc.color }}
                        >
                          {sc.icon}
                          {sc.label}
                        </span>
                        <span className="px-1.5 py-0.5 bg-white/30 rounded text-[9px] text-[#5e5e61] font-mono uppercase">
                          {server.transport}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5e5e61] mb-2.5">{server.description}</p>

                      {/* Command */}
                      <div className="flex items-center gap-2 mb-2.5 text-[10px] text-[#5e5e61] font-mono bg-black/5 rounded-lg px-2.5 py-1.5">
                        <Terminal className="w-3 h-3 shrink-0" />
                        <span className="truncate">{server.command} {server.args.join(' ')}</span>
                      </div>

                      {/* Tools & Resources */}
                      <div className="flex flex-wrap gap-1.5">
                        <div className="flex items-center gap-1 text-[9px] text-[#5e5e61]">
                          <Wrench className="w-2.5 h-2.5" />
                          <span>{server.tools.length} 个工具</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-[#5e5e61]">
                          <FolderOpen className="w-2.5 h-2.5" />
                          <span>{server.resources.length} 个资源</span>
                        </div>
                        {server.lastUsed && (
                          <div className="flex items-center gap-1 text-[9px] text-[#5e5e61]">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatTime(server.lastUsed)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() =>
                        updateMCPServer(server.id, {
                          enabled: !server.enabled,
                          status: server.enabled ? 'disabled' : 'ready',
                        })
                      }
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors"
                    >
                      {server.enabled ? (
                        <ToggleRight className="w-4 h-4 text-[#10b981]" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-[#5e5e61]" />
                      )}
                      <span className={server.enabled ? 'text-[#10b981]' : 'text-[#5e5e61]'}>
                        {server.enabled ? '已启用' : '已禁用'}
                      </span>
                    </button>
                    <button
                      onClick={() => { setEditingServer(server); setIsCreating(false); }}
                      className="p-1.5 hover:bg-white/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 className="w-3 h-3 text-[#5e5e61]" />
                    </button>
                    <button
                      onClick={() => removeMCPServer(server.id)}
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

      {/* MCP Info Banner */}
      <div className="mt-4 p-4 glass-panel rounded-2xl border border-white/30 shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg icon-glass shrink-0">
            <Globe className="w-4 h-4 text-[#374151]" />
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-[#1a1c1f] mb-1">什么是 MCP？</h4>
            <p className="text-[10px] text-[#5e5e61] leading-relaxed">
              Model Context Protocol（模型上下文协议）是 Anthropic 推出的开放标准，
              用于标准化 AI 模型与外部数据源、工具的连接。每个 MCP 服务器提供工具（Tools）、
              资源（Resources）和提示词模板（Prompts），让 AI 能够安全地访问本地文件、
              数据库、API 等外部系统。
            </p>
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <MCPEditModal
        server={editingServer}
        isOpen={isCreating || !!editingServer}
        onClose={() => { setEditingServer(null); setIsCreating(false); }}
        onSave={(server) => {
          if (editingServer) {
            updateMCPServer(editingServer.id, server);
          } else {
            useAppStore.getState().addMCPServer({
              ...server,
              id: `mcp_${Date.now()}`,
              status: 'disabled',
              tools: [],
              resources: [],
            } as MCPServer);
          }
          setEditingServer(null);
          setIsCreating(false);
        }}
      />
    </div>
  );
}

function MCPEditModal({
  server,
  isOpen,
  onClose,
  onSave,
}: {
  server: MCPServer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (server: Partial<MCPServer>) => void;
}) {
  const [name, setName] = useState(server?.name || '');
  const [description, setDescription] = useState(server?.description || '');
  const [command, setCommand] = useState(server?.command || '');
  const [argsStr, setArgsStr] = useState(server?.args.join(' ') || '');
  const [transport, setTransport] = useState<'stdio' | 'sse'>(server?.transport || 'stdio');

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
          <h3 className="text-sm font-bold text-[#1a1c1f]">{server ? '编辑 MCP 服务器' : '添加 MCP 服务器'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/40 transition-colors">
            <X className="w-4 h-4 text-[#5e5e61]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">名称</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：filesystem" className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 font-mono" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">描述</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="服务器的功能描述..." className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">命令</label>
              <input value={command} onChange={(e) => setCommand(e.target.value)} placeholder="npx 或 uvx" className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 font-mono" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">传输方式</label>
              <select value={transport} onChange={(e) => setTransport(e.target.value as 'stdio' | 'sse')} className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] focus:outline-none focus:border-white/60">
                <option value="stdio">stdio</option>
                <option value="sse">sse</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">参数（空格分隔）</label>
            <input value={argsStr} onChange={(e) => setArgsStr(e.target.value)} placeholder="-y @modelcontextprotocol/server-filesystem /path" className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 font-mono" />
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-white/20">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/20 text-[#1a1c1f] text-[12px] font-bold border border-white/40 hover:bg-white/40 transition-colors active:scale-95">取消</button>
          <button
            onClick={() => onSave({ name, description, command, args: argsStr.split(' ').filter(Boolean), transport: transport as 'stdio' | 'sse' })}
            disabled={!name.trim() || !command.trim()}
            className="px-4 py-2 rounded-xl bg-[#1a1c1f] text-white text-[12px] font-bold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {server ? '保存' : '添加'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

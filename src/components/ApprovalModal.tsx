import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  AlertTriangle,
  Terminal,
  FolderOpen,
  Shield,
  AlertOctagon,
} from 'lucide-react';

const riskConfig = {
  low: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.25)', label: '低风险', icon: Shield },
  medium: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.25)', label: '中风险', icon: AlertTriangle },
  high: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.25)', label: '高风险', icon: AlertOctagon },
  critical: { color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.2)', borderColor: 'rgba(220, 38, 38, 0.35)', label: '严重', icon: AlertOctagon },
};

const dangerKeywords = ['rm -rf', 'rm -r /', 'format', 'drop', 'truncate', 'sudo', 'chmod 777', 'mkfs', 'dd if='];

function highlightDanger(command: string): React.ReactNode {
  const highlights: { start: number; end: number }[] = [];
  for (const kw of dangerKeywords) {
    let idx = command.toLowerCase().indexOf(kw.toLowerCase());
    while (idx !== -1) {
      highlights.push({ start: idx, end: idx + kw.length });
      idx = command.toLowerCase().indexOf(kw.toLowerCase(), idx + 1);
    }
  }
  if (highlights.length === 0) return <span className="text-[#1a1c1f]/80">{command}</span>;

  highlights.sort((a, b) => a.start - b.start);
  const merged: typeof highlights = [];
  for (const h of highlights) {
    if (merged.length === 0 || h.start > merged[merged.length - 1].end) merged.push(h);
    else merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, h.end);
  }

  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const h of merged) {
    if (h.start > last) parts.push(<span key={`s${last}`} className="text-[#1a1c1f]/80">{command.slice(last, h.start)}</span>);
    parts.push(<span key={`d${h.start}`} className="text-red-600 bg-red-50 rounded px-0.5">{command.slice(h.start, h.end)}</span>);
    last = h.end;
  }
  if (last < command.length) parts.push(<span key={`e${last}`} className="text-[#1a1c1f]/80">{command.slice(last)}</span>);
  return parts;
}

export function ApprovalModal() {
  const { approvals, resolveApproval } = useAppStore();

  const pending = approvals.filter((a) => !a.resolved);

  return (
    <AnimatePresence>
      {pending.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60]"
        >
          {pending.map((approval) => {
            const risk = riskConfig[approval.riskLevel];
            return (
              <motion.div
                key={approval.id}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="glass-panel p-6 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.2)] w-80 border border-white/60"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 icon-glass rounded-xl">
                    <Terminal className="w-5 h-5 text-[#374151]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1a1c1f]">命令审批请求</p>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: risk.bgColor, color: risk.color }}
                    >
                      {risk.label}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#1a1c1f]/70 leading-relaxed mb-2">
                  <strong className="text-[#1a1c1f]">{approval.tool}</strong> 请求执行命令：
                </p>

                <div className="p-3 bg-black/5 rounded-xl border border-black/5 mb-4">
                  <code className="text-[11px] font-mono leading-relaxed break-all">
                    {highlightDanger(approval.command)}
                  </code>
                </div>

                <div className="flex items-center gap-2 mb-4 text-[10px] text-[#5e5e61]">
                  <FolderOpen className="w-3 h-3" />
                  <span className="font-mono">{approval.workingDir}</span>
                </div>

                {(approval.riskLevel === 'high' || approval.riskLevel === 'critical') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-start gap-2 p-3 rounded-xl mb-4 bg-red-50 border border-red-100"
                  >
                    <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-600 leading-relaxed">
                      此命令包含高风险操作，可能对系统造成不可逆更改
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => resolveApproval(approval.id, true)}
                    className="flex-1 py-2.5 rounded-xl bg-[#1a1c1f] text-white text-[11px] font-bold hover:opacity-90 transition-opacity active:scale-95"
                  >
                    允许一次
                  </button>
                  <button
                    onClick={() => resolveApproval(approval.id, false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/20 text-[#1a1c1f] text-[11px] font-bold border border-white/40 hover:bg-white/40 transition-colors active:scale-95"
                  >
                    拒绝
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

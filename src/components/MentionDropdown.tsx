import { motion } from 'framer-motion';
import { Brain, Terminal, GitBranch, Wrench } from 'lucide-react';

interface MentionTarget {
  id: string;
  name: string;
  type: 'ai' | 'cli';
  icon: string;
  color: string;
}

const mentionTargets: MentionTarget[] = [
  { id: 'kimi', name: 'Kimi', type: 'ai', icon: 'brain', color: '#10b981' },
  { id: 'claude', name: 'Claude Code', type: 'ai', icon: 'sparkles', color: '#f59e0b' },
  { id: 'codex', name: 'Codex', type: 'ai', icon: 'code', color: '#8b5cf6' },
  { id: 'deepseek', name: 'DeepSeek', type: 'ai', icon: 'zap', color: '#3b82f6' },
  { id: 'gpt4o', name: 'GPT-4o', type: 'ai', icon: 'message', color: '#06b6d4' },
  { id: 'git', name: 'git', type: 'cli', icon: 'git', color: '#ef4444' },
  { id: 'npm', name: 'npm', type: 'cli', icon: 'wrench', color: '#cb3837' },
  { id: 'python', name: 'python', type: 'cli', icon: 'terminal', color: '#3776ab' },
];

interface MentionDropdownProps {
  onSelect: (target: MentionTarget) => void;
  filter?: string;
}

export function MentionDropdown({ onSelect, filter = '' }: MentionDropdownProps) {
  const filtered = filter
    ? mentionTargets.filter(
        (t) =>
          t.name.toLowerCase().includes(filter.toLowerCase()) ||
          t.id.toLowerCase().includes(filter.toLowerCase())
      )
    : mentionTargets;

  const getIcon = (target: MentionTarget) => {
    const props = { className: 'w-3.5 h-3.5', style: { color: target.color } };
    switch (target.icon) {
      case 'brain':
        return <Brain {...props} />;
      case 'git':
        return <GitBranch {...props} />;
      case 'wrench':
        return <Wrench {...props} />;
      case 'terminal':
        return <Terminal {...props} />;
      default:
        return <Brain {...props} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className="absolute bottom-full left-0 mb-2 w-56 bg-[#27272a] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl overflow-hidden z-50"
    >
      <div className="px-2 py-1.5 border-b border-[rgba(255,255,255,0.05)]">
        <span className="text-[10px] text-[#52525b] uppercase tracking-wider font-medium">
          AI 模型
        </span>
      </div>
      {filtered
        .filter((t) => t.type === 'ai')
        .map((target) => (
          <button
            key={target.id}
            onClick={() => onSelect(target)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            {getIcon(target)}
            <span>{target.name}</span>
          </button>
        ))}

      <div className="px-2 py-1.5 border-t border-b border-[rgba(255,255,255,0.05)]">
        <span className="text-[10px] text-[#52525b] uppercase tracking-wider font-medium">
          CLI 工具
        </span>
      </div>
      {filtered
        .filter((t) => t.type === 'cli')
        .map((target) => (
          <button
            key={target.id}
            onClick={() => onSelect(target)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            {getIcon(target)}
            <span>{target.name}</span>
          </button>
        ))}
    </motion.div>
  );
}

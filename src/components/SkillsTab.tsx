import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import type { Skill } from '@/types';
import {
  Plus,
  Search,
  Code,
  FileText,
  BarChart3,
  PenTool,
  Trash2,
  Edit3,
  X,
  Zap,
} from 'lucide-react';

const categoryLabels: Record<string, string> = {
  coding: '编程开发',
  writing: '文档写作',
  analysis: '分析推理',
  creative: '创意生成',
  custom: '自定义',
};

const categoryIcons: Record<string, React.ReactNode> = {
  coding: <Code className="w-3.5 h-3.5" />,
  writing: <FileText className="w-3.5 h-3.5" />,
  analysis: <BarChart3 className="w-3.5 h-3.5" />,
  creative: <PenTool className="w-3.5 h-3.5" />,
  custom: <Zap className="w-3.5 h-3.5" />,
};

export function SkillsTab() {
  const { skills, removeSkill, addSkill, updateSkill } = useAppStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filtered = skills.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'all' || s.category === filter;
    return matchSearch && matchFilter;
  });

  const categories = ['all', ...Array.from(new Set(skills.map((s) => s.category)))];

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1a1c1f]">技能模板</h2>
          <p className="text-[11px] text-[#5e5e61] mt-0.5">
            管理可复用的 AI 提示词模板，快速调用预设能力
          </p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingSkill(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1c1f] text-white text-[12px] font-bold rounded-full hover:opacity-90 transition-opacity active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          新建技能
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5e5e61]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索技能名称、描述或标签..."
            className="w-full bg-white/30 border border-white/40 rounded-xl pl-9 pr-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                filter === cat
                  ? 'bg-[#1a1c1f] text-white'
                  : 'bg-white/30 text-[#5e5e61] hover:bg-white/50'
              }`}
            >
              {cat === 'all' ? '全部' : categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="flex-1 overflow-y-auto scroll-hide">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((skill, i) => (
              <motion.div
                key={skill.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                className="glass-panel rounded-2xl p-5 flex flex-col group hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl icon-glass"
                      style={{ color: skill.color }}
                    >
                      {categoryIcons[skill.category] || <Zap className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold text-[#1a1c1f]">
                        {skill.name}
                      </h3>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: skill.color }}
                      >
                        {categoryLabels[skill.category]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingSkill(skill); setIsCreating(false); }}
                      className="p-1.5 hover:bg-white/40 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-[#5e5e61]" />
                    </button>
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-[#5e5e61] hover:text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-[#5e5e61] leading-relaxed mb-3 flex-1">
                  {skill.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {skill.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white/30 rounded-full text-[9px] text-[#5e5e61] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/20">
                  <span className="text-[9px] text-[#5e5e61] font-mono">
                    使用 {skill.usageCount} 次
                  </span>
                  <span className="text-[9px] text-[#5e5e61]">
                    {new Date(skill.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <SkillEditModal
        skill={editingSkill}
        isOpen={isCreating || !!editingSkill}
        onClose={() => { setEditingSkill(null); setIsCreating(false); }}
        onSave={(skill) => {
          if (editingSkill) {
            updateSkill(editingSkill.id, skill);
          } else {
            addSkill({
              ...skill,
              id: `skill_${Date.now()}`,
              usageCount: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            } as Skill);
          }
          setEditingSkill(null);
          setIsCreating(false);
        }}
      />
    </div>
  );
}

function SkillEditModal({
  skill,
  isOpen,
  onClose,
  onSave,
}: {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: Partial<Skill>) => void;
}) {
  const [name, setName] = useState(skill?.name || '');
  const [description, setDescription] = useState(skill?.description || '');
  const [prompt, setPrompt] = useState(skill?.prompt || '');
  const [category, setCategory] = useState(skill?.category || 'custom');
  const [tags, setTags] = useState(skill?.tags.join(', ') || '');
  const [color, setColor] = useState(skill?.color || '#5e5e61');

  if (!isOpen) return null;

  const colors = ['#1d4ed8', '#c2410c', '#7e22ce', '#0369a1', '#059669', '#d97706', '#dc2626', '#5e5e61'];

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
        className="w-[560px] max-w-[90vw] max-h-[80vh] glass-panel-strong rounded-2xl overflow-hidden flex flex-col border border-white/60"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/30 shrink-0">
          <h3 className="text-sm font-bold text-[#1a1c1f]">
            {skill ? '编辑技能' : '新建技能'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/40 transition-colors">
            <X className="w-4 h-4 text-[#5e5e61]" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto scroll-hide p-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">技能名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：代码评审"
              className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">描述</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述这个技能的用途..."
              className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">提示词模板</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入 AI 的提示词模板..."
              rows={6}
              className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 font-mono leading-relaxed resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Skill['category'])}
                className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] focus:outline-none focus:border-white/60"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">标签（逗号分隔）</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="代码, 审查, 优化"
                className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">颜色标识</label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-1 ring-[#1a1c1f] scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-white/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/20 text-[#1a1c1f] text-[12px] font-bold border border-white/40 hover:bg-white/40 transition-colors active:scale-95"
          >
            取消
          </button>
          <button
            onClick={() =>
              onSave({
                name,
                description,
                prompt,
                category: category as Skill['category'],
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                color,
                icon: 'zap',
              })
            }
            disabled={!name.trim() || !prompt.trim()}
            className="px-4 py-2 rounded-xl bg-[#1a1c1f] text-white text-[12px] font-bold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {skill ? '保存修改' : '创建技能'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

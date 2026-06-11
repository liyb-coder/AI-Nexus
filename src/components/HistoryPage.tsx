import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import type { Task, TaskEvent } from '@/types';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  PauseCircle,
  Loader2,
  FileText,
  Code2,
  MessageSquare,
  ShieldCheck,
  Terminal,
  Package,
  Download,
  Plus,
  Search,
  Zap,
} from 'lucide-react';

const eventIcons: Record<TaskEvent['type'], React.ReactNode> = {
  query: <MessageSquare className="w-3.5 h-3.5" />,
  ai_response: <Code2 className="w-3.5 h-3.5" />,
  review: <FileText className="w-3.5 h-3.5" />,
  approval: <ShieldCheck className="w-3.5 h-3.5" />,
  material_added: <Package className="w-3.5 h-3.5" />,
  cli_executed: <Terminal className="w-3.5 h-3.5" />,
};

const eventLabels: Record<TaskEvent['type'], string> = {
  query: '用户发起',
  ai_response: 'AI 输出',
  review: '总结对比',
  approval: '命令审批',
  material_added: '素材收集',
  cli_executed: 'CLI 执行',
};

export function HistoryPage() {
  const { tasks, selectedTaskId, selectTask, setCurrentView } = useAppStore();
  const [search, setSearch] = useState('');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const filteredTasks = tasks.filter((t) =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.query.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
    >
      {/* Top Bar */}
      <header className="h-14 xl:h-16 flex items-center px-5 xl:px-6 glass-panel border-b border-white/40 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('workbench')}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/30 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#5e5e61]" />
          </button>
          <div className="h-6 w-px bg-white/30" />
          <div className="flex items-center gap-3">
            <h1 className="text-lg xl:text-xl font-semibold text-[#1a1c1f] tracking-tight">
              任务与素材
            </h1>
            <div className="px-3 py-1 rounded-full bg-white/40 border border-white/60 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[11px] font-medium text-[#47464b]">
                过程可追溯 · 素材可复用
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 glass-panel rounded-lg text-[11px] font-bold text-[#1a1c1f] hover:bg-white/50 transition-colors active:scale-95">
            <FileText className="w-3.5 h-3.5" />
            总结对比
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1c1f] text-white rounded-lg text-[11px] font-bold hover:opacity-90 transition-opacity active:scale-95">
            <Plus className="w-3.5 h-3.5" />
            新任务
          </button>
        </div>
      </header>

      {/* Three-column layout */}
      <div className="flex-1 flex gap-4 xl:gap-5 p-4 xl:p-5 overflow-hidden">
        {/* Left: Task List */}
        <TaskListColumn
          tasks={filteredTasks}
          selectedTaskId={selectedTaskId}
          onSelect={selectTask}
          search={search}
          onSearch={setSearch}
        />

        {/* Center: Task Process Timeline */}
        <TaskTimelineColumn task={selectedTask} />

        {/* Right: Task Assets */}
        <TaskAssetsColumn task={selectedTask} />
      </div>
    </motion.div>
  );
}

/* ===== Left Column: Task List ===== */
function TaskListColumn({
  tasks,
  selectedTaskId,
  onSelect,
  search,
  onSearch,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="w-64 xl:w-72 shrink-0 glass-panel rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/20 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5e5e61]" />
            <h2 className="text-sm font-bold text-[#1a1c1f]">任务列表</h2>
          </div>
          <span className="px-1.5 py-0.5 bg-white/30 rounded text-[9px] font-bold text-[#5e5e61]">
            {tasks.length} 个任务
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#5e5e61]" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="搜索任务..."
            className="w-full bg-white/30 border border-white/40 rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60"
          />
        </div>
      </div>

      {/* Task Cards */}
      <div className="flex-1 overflow-y-auto scroll-hide p-3 space-y-2">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.button
              key={task.id}
              layout
              onClick={() => onSelect(task.id)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                selectedTaskId === task.id
                  ? 'bg-white/40 border border-white/60 shadow-sm'
                  : 'bg-white/20 border border-white/30 hover:bg-white/30'
              }`}
            >
              <h3 className="text-[12px] font-bold text-[#1a1c1f] mb-1 line-clamp-1">
                {task.title}
              </h3>
              <div className="flex items-center gap-2 text-[9px] text-[#5e5e61]">
                <span>{task.modelNames.join(' · ')}</span>
                <span>·</span>
                <span>{task.materials.length} 条素材</span>
                {task.finalResult && (
                  <>
                    <span>·</span>
                    <span className="text-blue-600">已生成引用包</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                {task.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                    <span className="text-[9px] text-[#10b981] font-medium">已完成</span>
                  </>
                ) : task.status === 'in_progress' ? (
                  <>
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                    <span className="text-[9px] text-blue-500 font-medium">任务进行中</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3 h-3 text-red-400" />
                    <span className="text-[9px] text-red-400 font-medium">已终止</span>
                  </>
                )}
                <span className="text-[9px] text-[#5e5e61]">· {formatTime(task.timestamp)}</span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ===== Center Column: Task Timeline ===== */
function TaskTimelineColumn({ task }: { task: Task }) {
  return (
    <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden min-w-0">
      {/* Header */}
      <div className="p-4 border-b border-white/20 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#5e5e61]" />
          <h2 className="text-sm font-bold text-[#1a1c1f]">任务过程</h2>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/30 rounded-lg text-[10px] font-bold text-[#5e5e61] hover:bg-white/50 transition-colors active:scale-95">
          <Download className="w-3 h-3" />
          导出
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto scroll-hide p-5">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-white/30" />

          <div className="space-y-5">
            {task.events.map((event) => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </div>
        </div>

        {/* Query detail at bottom */}
        <div className="mt-6 p-4 bg-white/20 rounded-xl border border-white/30">
          <h4 className="text-[10px] font-bold text-[#5e5e61] uppercase tracking-wider mb-1">
            原始问题
          </h4>
          <p className="text-[12px] text-[#1a1c1f] leading-relaxed">{task.query}</p>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ event }: { event: TaskEvent }) {
  return (
    <div className="relative flex items-start gap-3 pl-1">
      {/* Dot */}
      <div
        className={`relative z-10 w-9 h-9 rounded-lg icon-glass shrink-0 ${
          event.type === 'query' ? 'active-tab' : ''
        }`}
        style={event.modelColor ? { color: event.modelColor } : {}}
      >
        {eventIcons[event.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12px] font-bold text-[#1a1c1f]">
            {event.modelName || eventLabels[event.type]}
          </span>
          <span className="text-[9px] text-[#5e5e61]">
            {formatTime(event.timestamp)}
          </span>
        </div>
        {event.content && (
          <p className="text-[11px] text-[#5e5e61] leading-relaxed">
            {event.content}
          </p>
        )}
        {event.status === 'pending' && (
          <span className="inline-flex items-center gap-1 text-[9px] text-[#f59e0b] mt-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            等待审批
          </span>
        )}
      </div>
    </div>
  );
}

/* ===== Right Column: Task Assets ===== */
function TaskAssetsColumn({ task }: { task: Task }) {
  return (
    <div className="w-64 xl:w-72 shrink-0 flex flex-col gap-4">
      {/* Assets Panel */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/20 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#5e5e61]" />
            <h2 className="text-sm font-bold text-[#1a1c1f]">任务资产</h2>
          </div>
          {task.materials.length > 0 && (
            <button className="px-2.5 py-1 bg-[#1a1c1f] text-white rounded-full text-[9px] font-bold hover:opacity-90 transition-opacity active:scale-95">
              生成引用包
            </button>
          )}
        </div>

        {/* Materials */}
        <div className="flex-1 overflow-y-auto scroll-hide p-3 space-y-2">
          {task.materials.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-6 h-6 text-[#5e5e61]/30 mx-auto mb-2" />
              <p className="text-[11px] text-[#5e5e61]/50">暂无素材</p>
            </div>
          )}
          {task.materials.map((mat) => (
            <div
              key={mat.id}
              className="p-2.5 bg-white/20 border border-white/30 rounded-xl hover:bg-white/40 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg icon-glass shrink-0">
                  <span className="text-[9px] font-bold" style={{ color: mat.sourceModelColor }}>
                    {mat.sourceModel[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#1a1c1f] truncate">
                    {mat.sourceModel} / {mat.label || '片段'}
                  </p>
                  <p className="text-[9px] text-[#5e5e61]">
                    {mat.content.slice(0, 40)}...
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Result */}
      {task.finalResult && (
        <div className="glass-dark text-white rounded-2xl p-4 shadow-xl shrink-0">
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
            最终结果
          </h3>
          <p className="text-[11px] text-white/80 leading-relaxed">
            {task.finalResult}
          </p>
        </div>
      )}
    </div>
  );
}

/* ===== Helper ===== */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

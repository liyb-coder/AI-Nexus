import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  BookmarkPlus,
  BarChart3,
  Layers,
  Sparkles,
  FileText,
  ExternalLink,
  Plus,
  Upload,
  ClipboardPaste,
  X,
  Highlighter,
} from 'lucide-react';

const reviewPreset = `## 评审报告

### 总体摘要
四个 AI 都认同 **Tauri + React + Rust Runtime** 的技术栈方向，架构思路高度一致。分歧主要在于交互设计的哲学和实现细节的侧重。

### 共同点
- 一致推荐 Tauri 作为桌面框架
- 都强调 SSE 流式处理和多并发连接管理
- 都指出 CLI 安全审批是核心模块
- 素材库的引用包概念得到一致认可

### 差异点
| 维度 | Kimi | Claude | Codex | DeepSeek |
|------|------|--------|-------|----------|
| 关注重心 | 技术架构图 | 交互体验 | 代码实现 | 工程难点 |
| 流式策略 | Promise.allSettled | 渐进式披露 | 多 WebView 隔离 | rAF 批量渲染 |
| 审批设计 | 传统弹窗 | 非阻塞通知 | - | 权限分级模型 |

### 每个 AI 的亮点
- **Kimi**：架构图最清晰，给出了具体的数据库选型和并发策略
- **Claude**：交互设计洞察最深，提出"认知工作台"的定位
- **Codex**：提供了可落地的 Rust 和 TypeScript 代码片段
- **DeepSeek**：工程视角最全面，权限分级模型最为严谨

### 风险或不足
- 产品复杂度较高，MVP 需要严格控制范围
- 多模型并发可能触发各厂商的速率限制
- 审批流程若设计不当会严重影响用户体验

### 推荐采用方向
**综合四个方案**，建议采用：
1. **Tauri v2** 桌面框架 + 多 WebView 面板隔离
2. **渐进式披露**交互模式，默认折叠长输出
3. **Capability-based 权限分级**审批系统
4. **引用包 v1.0** 格式标准化，token 控制在 2K 以内`;

interface OutputDoc {
  id: string;
  title: string;
  type: 'local' | 'feishu' | 'link';
  path?: string;
  url?: string;
  createdAt: number;
}

const mockOutputDocs: OutputDoc[] = [
  {
    id: 'doc_001',
    title: '广告片脚本_评审总结.md',
    type: 'local',
    path: '/Users/dev/Documents/汇智台/广告片脚本_评审总结.md',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'doc_002',
    title: '飞书文档 · 技术选型分析',
    type: 'feishu',
    url: 'https://feishu.cn/docx/AdVxcdEfGhIj',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'doc_003',
    title: 'PRD评审_多模型对比.html',
    type: 'link',
    url: 'file:///Users/dev/Documents/汇智台/PRD评审.html',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
];

export function ReviewPanel() {
  const {
    reviewContent,
    reviewExpanded,
    setReviewContent,
    setReviewExpanded,
    materials,
    removeMaterial,
    selectedMaterials,
    toggleMaterialSelection,
    responses,
    addMaterial,
  } = useAppStore();
  const [generating, setGenerating] = useState(false);

  const canGenerateReview = responses.length > 0 && responses.every(
    (r) => r.status === 'done' || r.status === 'error'
  );

  const handleGenerateReview = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      setReviewContent(reviewPreset);
      setGenerating(false);
    }, 800);
  }, [setReviewContent]);

  const addReviewToLibrary = useCallback(() => {
    if (!reviewContent) return;
    addMaterial({
      id: `mat_review_${Date.now()}`,
      content: reviewContent,
      sourceModel: '评审总结',
      sourceModelColor: '#5e5e61',
      sourceResponseId: 'review',
      timestamp: Date.now(),
    });
  }, [reviewContent, addMaterial]);

  const [outputDocs] = useState<OutputDoc[]>(mockOutputDocs);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global text selection fallback — when AI panel floating button doesn't trigger,
  // show a button in ReviewPanel to add selected text to library
  const [globalSelection, setGlobalSelection] = useState<{ text: string; visible: boolean }>({ text: '', visible: false });
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      // Delay to let selection settle
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setGlobalSelection({ text: '', visible: false });
          return;
        }
        const text = sel.toString().trim();
        if (text.length >= 1) {
          setGlobalSelection({ text, visible: true });
        } else {
          setGlobalSelection({ text: '', visible: false });
        }
      }, 80);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't clear if clicking the global selection button
      if (target.closest('[data-global-selection-btn]')) return;
      // Don't clear if clicking inside the add menu
      if (target.closest('[data-add-menu]')) return;
      // Defer clearing — let mouseup re-evaluate
      setGlobalSelection((prev) => ({ ...prev, visible: false }));
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
    };
  }, []);

  const addGlobalSelectionToLibrary = useCallback(() => {
    if (!globalSelection.text) return;
    addMaterial({
      id: `mat_global_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      content: globalSelection.text,
      sourceModel: '手动选中',
      sourceModelColor: '#5e5e61',
      sourceResponseId: 'global-selection',
      timestamp: Date.now(),
    });
    setGlobalSelection({ text: '', visible: false });
    window.getSelection()?.removeAllRanges();
  }, [globalSelection.text, addMaterial]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        addMaterial({
          id: `mat_file_${Date.now()}`,
          content: text.slice(0, 2000),
          sourceModel: `附件: ${file.name}`,
          sourceModelColor: '#5e5e61',
          sourceResponseId: 'file-upload',
          timestamp: Date.now(),
        });
      }
    };
    reader.readAsText(file);
    setShowAddMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [addMaterial]);

  const handlePasteSubmit = useCallback(() => {
    if (!pasteText.trim()) return;
    addMaterial({
      id: `mat_paste_${Date.now()}`,
      content: pasteText.trim(),
      sourceModel: '粘贴文本',
      sourceModelColor: '#5e5e61',
      sourceResponseId: 'paste',
      timestamp: Date.now(),
    });
    setPasteText('');
    setPasteOpen(false);
    setShowAddMenu(false);
  }, [pasteText, addMaterial]);

  return (
    <aside className="w-72 h-full flex flex-col gap-4 overflow-hidden shrink-0">
      {/* Assets Library */}
      <div className="flex-1 glass-panel rounded-2xl p-5 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-sm font-bold text-[#1a1c1f] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#5e5e61]" />
            素材库
          </h2>
          <div className="flex items-center gap-1.5">
            {materials.length > 0 && (
              <span className="px-1.5 py-0.5 bg-white/30 rounded text-[9px] font-bold text-[#5e5e61]">
                {materials.length}
              </span>
            )}
            <div className="relative" data-add-menu>
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/40 transition-colors"
              >
                <Plus className="w-4 h-4 text-[#5e5e61]" />
              </button>
              <AnimatePresence>
                {showAddMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => { setShowAddMenu(false); setPasteOpen(false); }} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-8 z-50 w-40 glass-panel-strong rounded-xl border border-white/60 shadow-xl overflow-hidden"
                    >
                      {!pasteOpen ? (
                        <>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-[#1a1c1f] hover:bg-white/40 transition-colors text-left"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#5e5e61]" />
                            上传附件
                          </button>
                          <button
                            onClick={() => setPasteOpen(true)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-[#1a1c1f] hover:bg-white/40 transition-colors text-left border-t border-white/20"
                          >
                            <ClipboardPaste className="w-3.5 h-3.5 text-[#5e5e61]" />
                            粘贴文本
                          </button>
                        </>
                      ) : (
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[#1a1c1f]">粘贴文本</span>
                            <button onClick={() => setPasteOpen(false)} className="p-0.5 hover:bg-white/30 rounded">
                              <X className="w-3 h-3 text-[#5e5e61]" />
                            </button>
                          </div>
                          <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder="Ctrl+V 粘贴文本..."
                            rows={4}
                            className="w-full bg-white/30 border border-white/40 rounded-lg px-2.5 py-2 text-[11px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 resize-none font-mono leading-relaxed"
                            autoFocus
                          />
                          <button
                            onClick={handlePasteSubmit}
                            disabled={!pasteText.trim()}
                            className="w-full mt-2 py-1.5 bg-[#1a1c1f] text-white rounded-lg text-[10px] font-bold hover:opacity-90 transition-opacity disabled:opacity-30"
                          >
                            加入素材库
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.rs,.go,.java,.c,.cpp,.h,.html,.css,.sql,.yaml,.yml,.xml,.sh,.zsh,.bash"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Global selection fallback — horizontal toolbar style */}
        <AnimatePresence>
          {globalSelection.visible && globalSelection.text && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              data-global-selection-btn
              className="mb-3 glass-panel-strong rounded-xl border border-white/60 shadow-md overflow-hidden"
            >
              {/* Top: selected text quote */}
              <div className="px-3 py-2 bg-white/20 border-b border-white/20">
                <p className="text-[10px] text-[#5e5e61] leading-relaxed line-clamp-2 italic">
                  <span className="text-[#5e5e61]/40 mr-1">"</span>
                  {globalSelection.text.slice(0, 80)}{globalSelection.text.length > 80 ? '...' : ''}
                  <span className="text-[#5e5e61]/40 ml-1">"</span>
                </p>
              </div>
              {/* Bottom: horizontal action bar */}
              <div className="px-2 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Highlighter className="w-3 h-3 text-amber-500/70" />
                  <span className="text-[9px] text-[#5e5e61]/60">已选中 {globalSelection.text.length} 字</span>
                </div>
                <button
                  onClick={addGlobalSelectionToLibrary}
                  className="px-3 py-1 rounded-lg bg-[#1a1c1f]/90 hover:bg-[#1a1c1f] text-white text-[10px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  加入素材库
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 space-y-2 overflow-y-auto scroll-hide min-h-0">
          {materials.length === 0 && !globalSelection.visible && (
            <div className="text-center py-8">
              <BookmarkPlus className="w-6 h-6 text-[#5e5e61]/30 mx-auto mb-2" />
              <p className="text-[11px] text-[#5e5e61]/50">从 AI 面板中选中文字</p>
              <p className="text-[11px] text-[#5e5e61]/50">或选中后点击上方按钮</p>
            </div>
          )}
          <AnimatePresence>
            {materials.map((mat) => (
              <motion.div
                key={mat.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => toggleMaterialSelection(mat.id)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all group relative ${
                  selectedMaterials.includes(mat.id)
                    ? 'bg-white/40 border border-white/60 shadow-sm'
                    : 'bg-white/20 border border-white/30 hover:bg-white/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg icon-glass shrink-0">
                    <span className="text-[10px] font-bold" style={{ color: mat.sourceModelColor }}>
                      {mat.sourceModel[0]}
                    </span>
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#1a1c1f] truncate">
                      {mat.sourceModel} / 片段
                    </p>
                    <p className="text-[9px] text-[#5e5e61] font-mono">
                      {new Date(mat.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-[#1a1c1f]/60 mt-1 line-clamp-2 leading-relaxed">
                      {mat.content}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeMaterial(mat.id); }}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/40 transition-all"
                >
                  <span className="text-[10px] text-[#5e5e61]">×</span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Generate Review Button */}
      {!reviewContent && canGenerateReview && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="shrink-0">
          <button
            onClick={handleGenerateReview}
            disabled={generating}
            className="w-full glass-dark text-white rounded-2xl p-4 shadow-xl flex items-center justify-center gap-2 hover:bg-black/40 transition-all active:scale-95 disabled:opacity-60"
          >
            {generating ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Sparkles className="w-4 h-4" />
              </motion.div>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="text-[12px] font-bold">
              {generating ? '生成中...' : '生成评审总结'}
            </span>
          </button>
        </motion.div>
      )}

      {/* Review Summary Card */}
      <AnimatePresence>
        {reviewContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-dark text-white rounded-2xl p-5 shadow-xl flex flex-col shrink-0 overflow-hidden"
            style={{ maxHeight: '40%' }}
          >
            <button
              onClick={() => setReviewExpanded(!reviewExpanded)}
              className="flex items-center gap-2 mb-3 text-white/90 shrink-0"
            >
              <BarChart3 className="w-4 h-4" />
              <h3 className="text-xs font-bold">评审总结</h3>
              <span className="text-[9px] text-white/40 ml-auto">
                {reviewExpanded ? '收起' : '展开'}
              </span>
            </button>
            <div className="space-y-3 overflow-y-auto scroll-hide flex-1 min-h-0">
              {reviewExpanded
                ? renderReviewContent(reviewContent)
                : renderReviewContent(reviewContent.split('\n').slice(0, 6).join('\n'))
              }
            </div>
            {/* Add to library button */}
            <button
              onClick={addReviewToLibrary}
              className="mt-3 flex items-center justify-center gap-1.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold text-white/70 hover:text-white transition-all active:scale-95 shrink-0"
            >
              <BookmarkPlus className="w-3 h-3" />
              加入素材库
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output Documents */}
      <div className="shrink-0 glass-panel rounded-2xl p-4 flex flex-col overflow-hidden" style={{ maxHeight: '28%' }}>
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h2 className="text-sm font-bold text-[#1a1c1f] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#5e5e61]" />
            输出文档
          </h2>
          <span className="px-1.5 py-0.5 bg-white/30 rounded text-[9px] font-bold text-[#5e5e61]">
            {outputDocs.length}
          </span>
        </div>
        <div className="space-y-1.5 overflow-y-auto scroll-hide min-h-0">
          {outputDocs.map((doc) => (
            <a
              key={doc.id}
              href={doc.url || '#'}
              target={doc.url ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2.5 bg-white/20 border border-white/30 rounded-xl hover:bg-white/40 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg icon-glass shrink-0">
                <DocTypeIcon type={doc.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#1a1c1f] truncate">{doc.title}</p>
                <p className="text-[8px] text-[#5e5e61] font-mono truncate">
                  {doc.type === 'local' ? doc.path : doc.url}
                </p>
              </div>
              <ExternalLink className="w-3 h-3 text-[#5e5e61] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}

function DocTypeIcon({ type }: { type: OutputDoc['type'] }) {
  const colors = { local: '#5e5e61', feishu: '#3370ff', link: '#10b981' };
  return (
    <div className="flex items-center justify-center w-full h-full" style={{ color: colors[type] }}>
      {type === 'local' && <FileText className="w-3.5 h-3.5" />}
      {type === 'feishu' && <span className="text-[9px] font-bold">飞</span>}
      {type === 'link' && <ExternalLink className="w-3.5 h-3.5" />}
    </div>
  );
}

function renderReviewContent(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-xs font-bold text-white/90 mt-3 mb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-2 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={key++} className="text-[10px] text-white/70 leading-relaxed ml-2 list-disc list-inside">{line.slice(2)}</li>);
    } else if (line.startsWith('|') && line.includes('|')) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length > 0 && !line.includes('---')) {
        elements.push(<div key={key++} className="grid gap-0 my-0.5" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
          {cells.map((cell, ci) => <div key={ci} className="px-1.5 py-0.5 text-[8px] text-white/60 font-mono border border-white/10">{cell}</div>)}
        </div>);
      }
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1" />);
    } else if (line.startsWith('> ')) {
      elements.push(<p key={key++} className="text-[10px] text-blue-300/90 font-medium leading-relaxed">{line.slice(2)}</p>);
    } else {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(<p key={key++} className="text-[10px] text-white/70 leading-relaxed">
        {parts.map((part, i) => part.startsWith('**') && part.endsWith('**') ?
          <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>
        )}
      </p>);
    }
  }
  return elements;
}

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import type { AIResponse } from '@/types';
import {
  Copy,
  BookmarkPlus,
  Maximize2,
  Check,
  X,
} from 'lucide-react';

interface AIStreamPanelProps {
  response: AIResponse;
  index: number;
  onFullscreen: (response: AIResponse) => void;
  onClose: (id: string) => void;
  highlightedText?: string;
}

// Extend Window interface for our custom event
declare global {
  interface WindowEventMap {
    'panel-text-selected': CustomEvent<{ text: string; sourceId: string }>;
  }
}

const modelInitials: Record<string, string> = {
  kimi: 'K', claude: 'C', codex: 'X', deepseek: 'D', openai: 'G',
};

const statusLabelMap: Record<string, { text: string; color: string }> = {
  loading: { text: '任务进行中', color: 'text-blue-600' },
  streaming: { text: '任务进行中', color: 'text-blue-600' },
  done: { text: '已完成', color: 'text-green-600' },
  error: { text: '已终止', color: 'text-red-500' },
};

export function AIStreamPanel({
  response, index, onFullscreen, onClose, highlightedText,
}: AIStreamPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addMaterial } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Text selection state — local to this panel
  const [selectionMenu, setSelectionMenu] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // Auto-scroll on streaming
  useEffect(() => {
    if (scrollRef.current && response.status === 'streaming') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response.content, response.status]);

  // Handle text selection on mouseup inside content area
  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelectionMenu(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length < 1) {
      setSelectionMenu(null);
      return;
    }

    // Verify selection is within this panel
    const range = sel.getRangeAt(0);
    const container = scrollRef.current?.querySelector('.content-root');
    if (!container) { setSelectionMenu(null); return; }
    if (!container.contains(range.commonAncestorContainer) &&
        !container.contains(range.startContainer) &&
        !container.contains(range.endContainer)) {
      setSelectionMenu(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = scrollRef.current?.getBoundingClientRect();
    if (!containerRect) { setSelectionMenu(null); return; }

    // Get the best possible rect — fallback to node element rect if range rect is empty
    let useRect = rect;
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      // Try to get rect from the common ancestor element
      const node = range.commonAncestorContainer;
      const elem = node.nodeType === 3 ? node.parentElement : (node as Element);
      if (elem && elem !== container) {
        useRect = elem.getBoundingClientRect();
      }
      // If still empty, try startContainer
      if (!useRect || (useRect.width === 0 && useRect.height === 0)) {
        const startNode = range.startContainer;
        const startElem = startNode.nodeType === 3 ? startNode.parentElement : (startNode as Element);
        if (startElem) {
          useRect = startElem.getBoundingClientRect();
        }
      }
    }

    // Final guard
    if (!useRect || (useRect.width === 0 && useRect.height === 0)) {
      setSelectionMenu(null);
      return;
    }

    window.dispatchEvent(
      new CustomEvent('panel-text-selected', { detail: { text, sourceId: response.id } })
    );

    const panelHeight = containerRect.height;
    const btnHeight = 36; // estimated floating button height
    const spacing = 52;

    const x = Math.max(8, Math.min(useRect.left + useRect.width / 2 - 60, containerRect.width - 130));
    let y = useRect.top - containerRect.top - spacing;

    // If too close to top, show below selection
    if (y < 4) {
      y = useRect.bottom - containerRect.top + 8;
    }
    // If would go below panel, clamp
    if (y + btnHeight > panelHeight) {
      y = panelHeight - btnHeight - 4;
    }

    setSelectionMenu({ text, x, y });
  }, [response.id]);

  const handleContentMouseUp = useCallback(() => {
    // Use setTimeout — more reliable for pre/code blocks
    setTimeout(checkSelection, 50);
  }, [checkSelection]);

  // Handle selectionchange for code blocks and drag selections
  useEffect(() => {
    let mouseDown = false;
    const onMouseDown = () => { mouseDown = true; };
    const onMouseUp = () => {
      mouseDown = false;
      setTimeout(() => {
        if (!mouseDown) checkSelection();
      }, 50);
    };
    const onSelectionChange = () => {
      // Only process if mouse is not down (drag ended)
      if (!mouseDown) {
        setTimeout(checkSelection, 50);
      }
    };

    const panel = scrollRef.current;
    if (panel) {
      panel.addEventListener('mousedown', onMouseDown);
      panel.addEventListener('mouseup', onMouseUp);
    }
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      if (panel) {
        panel.removeEventListener('mousedown', onMouseDown);
        panel.removeEventListener('mouseup', onMouseUp);
      }
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [checkSelection]);

  const saveSelectionToLibrary = useCallback(() => {
    if (!selectionMenu) return;
    addMaterial({
      id: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      content: selectionMenu.text,
      sourceModel: response.modelName,
      sourceModelColor: response.modelColor,
      sourceResponseId: response.id,
      timestamp: Date.now(),
    });
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
  }, [selectionMenu, response, addMaterial]);

  // Clear selection when clicking outside the panel or on non-text areas
  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If clicking the floating button, don't clear
      if (target.closest('[data-selection-btn]')) return;
      // If clicking inside the content area, let mouseup handle it
      if (scrollRef.current?.contains(target)) return;
      // Clicking outside — clear selection menu
      setSelectionMenu(null);
    };
    document.addEventListener('mousedown', handleDocMouseDown);
    return () => document.removeEventListener('mousedown', handleDocMouseDown);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(response.fullContent);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = response.fullContent; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  }, [response.fullContent]);

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code.slice(0, 20)); setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      setCopiedCode(code.slice(0, 20)); setTimeout(() => setCopiedCode(null), 2000);
    }
  }, []);

  const isLoading = response.status === 'loading';
  const isStreaming = response.status === 'streaming';
  const isDone = response.status === 'done';
  const statusInfo = statusLabelMap[response.status] || { text: '任务进行中', color: 'text-blue-600' };
  const initial = modelInitials[response.modelId] || response.modelName[0];

  const shouldHighlight = (text: string) => {
    if (!highlightedText || highlightedText.length < 3) return false;
    const nh = highlightedText.toLowerCase().replace(/\s+/g, ' ').trim();
    const nt = text.toLowerCase().replace(/\s+/g, ' ').trim();
    return nt.includes(nh) || nh.includes(nt.slice(0, 30));
  };

  const renderContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLang = '';
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true; codeLang = line.slice(3).trim(); codeContent = '';
        } else {
          inCodeBlock = false;
          const fullCode = codeContent;
          elements.push(
            <div key={key++} className="my-3 rounded-xl border border-black/5 overflow-hidden group/code bg-black/5">
              <div className="px-3 py-1.5 bg-black/5 border-b border-black/5 flex items-center justify-between">
                <span className="text-[10px] text-[#5e5e61] font-mono uppercase">{codeLang || 'code'}</span>
                <button onClick={() => handleCopyCode(fullCode)}
                  className="opacity-0 group-hover/code:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-[#5e5e61] hover:text-[#1a1c1f] hover:bg-white/40 transition-all">
                  {copiedCode === fullCode.slice(0, 20) ? <Check className="w-2.5 h-2.5 text-green-600" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedCode === fullCode.slice(0, 20) ? '已复制' : '复制'}</span>
                </button>
              </div>
              <pre className="p-3 overflow-x-auto" onMouseUp={(e) => { e.stopPropagation(); handleContentMouseUp(); }}><code className="text-[12px] text-[#1a1c1f] font-mono leading-relaxed whitespace-pre">{fullCode}</code></pre>
            </div>
          );
          codeContent = ''; codeLang = '';
        }
        continue;
      }
      if (inCodeBlock) { codeContent += line + '\n'; continue; }

      if (line.includes('`') && !line.startsWith('```')) {
        const parts = line.split(/(`[^`]+`)/g);
        const isHL = shouldHighlight(line);
        elements.push(
          <p key={key++} className={`text-[13px] leading-relaxed my-1 transition-colors ${isHL ? 'text-[#1a1c1f] bg-white/30 rounded px-1' : 'text-[#1a1c1f]/80'}`}>
            {parts.map((part, pi) => part.startsWith('`') && part.endsWith('`') ?
              <code key={pi} className="px-1 py-0.5 bg-black/5 rounded text-[12px] text-[#1a1c1f] font-mono">{part.slice(1, -1)}</code> :
              <span key={pi}>{renderInline(part)}</span>
            )}
            {isStreaming && i === lines.length - 1 && <span className="typing-cursor" />}
          </p>
        );
        continue;
      }

      if (line.startsWith('### ')) { elements.push(<h3 key={key++} className="text-sm font-bold text-[#1a1c1f] mt-4 mb-2">{line.slice(4)}</h3>); continue; }
      if (line.startsWith('## ')) { elements.push(<h2 key={key++} className="text-base font-bold text-[#1a1c1f] mt-5 mb-3 border-l-4 pl-3" style={{ borderColor: response.modelColor }}>{line.slice(3)}</h2>); continue; }
      if (line.startsWith('# ')) { elements.push(<h1 key={key++} className="text-lg font-bold text-[#1a1c1f] mt-6 mb-4">{line.slice(2)}</h1>); continue; }
      if (line.startsWith('> ')) { elements.push(<blockquote key={key++} className="my-3 pl-3 border-l-2 border-black/10 text-[#1a1c1f]/70 italic text-[13px]">{line.slice(2)}</blockquote>); continue; }
      if (line.includes('|')) {
        const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
        if (cells.length > 0 && !line.includes('---')) {
          elements.push(<div key={key++} className="grid gap-0 my-0.5" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
            {cells.map((cell, ci) => <div key={ci} className="px-2 py-1 text-[11px] text-[#1a1c1f]/70 font-mono border border-black/5">{cell}</div>)}
          </div>);
        }
        continue;
      }
      if (line.startsWith('---')) { elements.push(<hr key={key++} className="my-4 border-t border-black/5" />); continue; }
      if (line.trim() === '') { elements.push(<div key={key++} className="h-2" />); continue; }

      const lineHL = shouldHighlight(line);
      elements.push(
        <p key={key++} className={`text-[13px] leading-relaxed my-0.5 transition-colors duration-300 ${lineHL ? 'text-[#1a1c1f] bg-white/30 rounded px-1' : 'text-[#1a1c1f]/80'}`}>
          {renderInline(line)}
          {isStreaming && i === lines.length - 1 && <span className="typing-cursor" />}
        </p>
      );
    }

    if (inCodeBlock && codeContent) {
      elements.push(
        <div key={key++} className="my-3 rounded-xl border border-black/5 overflow-hidden group/code bg-black/5">
          {codeLang && <div className="px-3 py-1.5 bg-black/5 border-b border-black/5 flex items-center justify-between">
            <span className="text-[10px] text-[#5e5e61] font-mono uppercase">{codeLang}</span>
            <button onClick={() => handleCopyCode(codeContent)} className="opacity-0 group-hover/code:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-[#5e5e61] hover:text-[#1a1c1f] hover:bg-white/40 transition-all">
              {copiedCode === codeContent.slice(0, 20) ? <Check className="w-2.5 h-2.5 text-green-600" /> : <Copy className="w-2.5 h-2.5" />}
              <span>复制</span>
            </button>
          </div>}
          <pre className="p-3 overflow-x-auto" onMouseUp={(e) => { e.stopPropagation(); handleContentMouseUp(); }}><code className="text-[12px] text-[#1a1c1f] font-mono leading-relaxed whitespace-pre">{codeContent}</code></pre>
        </div>
      );
    }
    return elements;
  };

  const renderInline = (text: string) => {
    const boldMatches = text.split(/(\*\*[^*]+\*\*)/g);
    if (boldMatches.length > 1) {
      return boldMatches.map((part, i) => part.startsWith('**') && part.endsWith('**') ?
        <strong key={i} className="text-[#1a1c1f] font-semibold">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>
      );
    }
    return text;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`glass-panel rounded-2xl flex flex-col overflow-hidden h-full ${isStreaming ? 'panel-breathe' : ''}`}
    >
      {/* Header */}
      <div className="p-3 xl:p-4 border-b border-white/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 xl:gap-3">
          <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-xl icon-glass font-bold text-xs xl:text-sm">{initial}</div>
          <div>
            <h3 className="text-[13px] xl:text-sm font-bold text-[#1a1c1f]">{response.modelName}</h3>
            <p className={`text-[10px] font-medium ${statusInfo.color}`}>{statusInfo.text}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 xl:gap-1">
          {isDone && response.latency && (
            <span className="text-[9px] xl:text-[10px] text-[#5e5e61] font-mono mr-1 xl:mr-2">{(response.latency / 1000).toFixed(1)}s</span>
          )}
          <button onClick={handleCopy} className="p-1 xl:p-1.5 hover:bg-white/30 rounded-lg transition-colors" title="复制全文">
            {copied ? <Check className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-green-600" /> : <Copy className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#5e5e61]" />}
          </button>
          <button onClick={() => onFullscreen(response)} className="p-1 xl:p-1.5 hover:bg-white/30 rounded-lg transition-colors" title="全屏查看">
            <Maximize2 className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#5e5e61]" />
          </button>
          <button onClick={() => onClose(response.id)} className="p-1 xl:p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="关闭面板">
            <X className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#5e5e61] hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 xl:p-5 text-sm text-[#1a1c1f] leading-relaxed overflow-y-auto scroll-hide min-h-0 relative"
        onMouseUp={handleContentMouseUp}
        style={{ borderLeft: `4px solid ${isDone ? response.modelColor : 'transparent'}` }}
      >
        {isLoading && !response.content ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: response.modelColor, animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: response.modelColor, animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: response.modelColor, animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <div className="font-mono content-root" onMouseUp={handleContentMouseUp}>{renderContent(response.content)}</div>
        )}

        {/* Selection Floating Button */}
        {selectionMenu && (
          <div
            data-selection-btn
            className="absolute z-50 glass-panel-strong rounded-lg shadow-lg overflow-hidden px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-white/60 transition-colors border border-white/60"
            style={{ left: selectionMenu.x, top: selectionMenu.y }}
            onClick={(e) => { e.stopPropagation(); saveSelectionToLibrary(); }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-[#5e5e61]" />
            <span className="text-[11px] font-medium text-[#1a1c1f] whitespace-nowrap">加入素材库</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <AnimatePresence>
        {(isDone || response.content.length > 100) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 xl:p-4 bg-white/10 flex items-center justify-between shrink-0"
          >
            <span className="text-[9px] xl:text-[10px] text-[#5e5e61] font-mono">
              {response.tokensUsed ? `${Math.round(response.tokensUsed)} tok · ` : ''}{response.content.length} chars
            </span>
            <button
              onClick={() => {
                if (response.content) {
                  addMaterial({
                    id: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    content: response.content.slice(0, 500),
                    sourceModel: response.modelName,
                    sourceModelColor: response.modelColor,
                    sourceResponseId: response.id,
                    timestamp: Date.now(),
                  });
                }
              }}
              className="px-2.5 xl:px-3 py-1 xl:py-1.5 bg-[#1a1c1f] text-white text-[10px] xl:text-xs font-medium rounded-full flex items-center gap-1.5 xl:gap-2 hover:opacity-90 transition-all active:scale-95"
            >
              <BookmarkPlus className="w-2.5 h-2.5 xl:w-3 xl:h-3" />
              加入素材库
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

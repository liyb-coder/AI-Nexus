import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import type { AIResponse } from '@/types';
import { X, Copy, Check, BookmarkPlus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface FullscreenModalProps {
  response: AIResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenModal({ response, isOpen, onClose }: FullscreenModalProps) {
  const { addMaterial } = useAppStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response.fullContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = response.fullContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [response]);

  const renderContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCode = false;
    let codeContent = '';
    let codeLang = '';
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('```')) {
        if (!inCode) { inCode = true; codeLang = line.slice(3).trim(); codeContent = ''; }
        else {
          inCode = false;
          elements.push(
            <div key={key++} className="my-4 rounded-xl border border-black/5 overflow-hidden bg-black/5">
              {codeLang && (
                <div className="px-4 py-2 bg-black/5 border-b border-black/5">
                  <span className="text-[11px] text-[#5e5e61] font-mono uppercase">{codeLang}</span>
                </div>
              )}
              <pre className="p-4 overflow-x-auto">
                <code className="text-[13px] text-[#1a1c1f] font-mono leading-relaxed whitespace-pre">{codeContent}</code>
              </pre>
            </div>
          );
          codeContent = ''; codeLang = '';
        }
        continue;
      }

      if (inCode) { codeContent += line + '\n'; continue; }

      if (line.startsWith('### ')) { elements.push(<h3 key={key++} className="text-base font-bold text-[#1a1c1f] mt-5 mb-2">{line.slice(4)}</h3>); continue; }
      if (line.startsWith('## ')) { elements.push(<h2 key={key++} className="text-lg font-bold text-[#1a1c1f] mt-6 mb-3">{line.slice(3)}</h2>); continue; }
      if (line.startsWith('# ')) { elements.push(<h1 key={key++} className="text-xl font-bold text-[#1a1c1f] mt-8 mb-4">{line.slice(2)}</h1>); continue; }
      if (line.startsWith('> ')) { elements.push(<blockquote key={key++} className="my-4 pl-4 border-l-2 border-black/10 text-[#1a1c1f]/70 italic text-[14px]">{line.slice(2)}</blockquote>); continue; }
      if (line.startsWith('---')) { elements.push(<hr key={key++} className="my-5 border-t border-black/5" />); continue; }
      if (line.trim() === '') { elements.push(<div key={key++} className="h-2" />); continue; }

      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <p key={key++} className="text-[14px] text-[#1a1c1f]/80 leading-relaxed my-0.5">
          {parts.map((part, i) => part.startsWith('**') && part.endsWith('**') ?
            <strong key={i} className="text-[#1a1c1f] font-semibold">{part.slice(2, -2)}</strong> :
            <span key={i}>{part}</span>
          )}
        </p>
      );
    }

    if (inCode && codeContent) {
      elements.push(
        <div key={key++} className="my-4 rounded-xl border border-black/5 overflow-hidden bg-black/5">
          {codeLang && <div className="px-4 py-2 bg-black/5 border-b border-black/5"><span className="text-[11px] text-[#5e5e61] font-mono uppercase">{codeLang}</span></div>}
          <pre className="p-4 overflow-x-auto"><code className="text-[13px] text-[#1a1c1f] font-mono leading-relaxed whitespace-pre">{codeContent}</code></pre>
        </div>
      );
    }
    return elements;
  };

  return (
    <AnimatePresence>
      {isOpen && response && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[900px] max-w-[92vw] h-[82vh] glass-panel-strong rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl icon-glass font-bold text-sm flex items-center justify-center">
                  {response.modelName[0]}
                </div>
                <div>
                  <span className="text-sm font-bold text-[#1a1c1f]">{response.modelName}</span>
                  <div className="flex items-center gap-2 text-[11px] text-[#5e5e61] font-mono">
                    {response.latency && <span>{(response.latency / 1000).toFixed(1)}s</span>}
                    {response.tokensUsed && <span>{Math.round(response.tokensUsed)} tok</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { addMaterial({ id: `mat_${Date.now()}`, content: response.content.slice(0, 500), sourceModel: response.modelName, sourceModelColor: response.modelColor, sourceResponseId: response.id, timestamp: Date.now() }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] text-[#5e5e61] hover:text-[#1a1c1f] hover:bg-white/40 transition-all"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  <span>收藏</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] text-[#5e5e61] hover:text-[#1a1c1f] hover:bg-white/40 transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? '已复制' : '复制'}</span>
                </button>
                <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/40 transition-colors">
                  <X className="w-4 h-4 text-[#5e5e61]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scroll-hide p-6">
              <div className="font-mono max-w-3xl" style={{ borderLeft: `4px solid ${response.modelColor}`, paddingLeft: '16px' }}>
                {renderContent(response.content)}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

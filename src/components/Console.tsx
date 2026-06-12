import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useRealStream } from '@/hooks/useRealStream';
import {
  Send,
  X,
  Sparkles,
} from 'lucide-react';

interface ConsoleProps {
  onFocusChange?: (focused: boolean) => void;
}

export function Console({ onFocusChange }: ConsoleProps) {
  const {
    inputValue,
    setInputValue,
    selectedMaterials,
    clearSelectedMaterials,
    models,
  } = useAppStore();
  const { startAllStreams } = useRealStream();
  const [selectedModels, setSelectedModels] = useState<Set<string>>(
    new Set(models.filter((m) => m.enabled).map((m) => m.id))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        if (next.size > 1) next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    let effectiveQuery = trimmed;
    if (selectedMaterials.length > 0) {
      effectiveQuery += `\n\n[引用 ${selectedMaterials.length} 个素材]`;
    }

    setInputValue('');
    clearSelectedMaterials();
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Enable only selected models
    const allModels = useAppStore.getState().models;
    allModels.forEach((m) => {
      const shouldEnable = selectedModels.has(m.id);
      if (m.enabled !== shouldEnable) {
        useAppStore.getState().toggleModel(m.id);
      }
    });

    startAllStreams(effectiveQuery);
  }, [inputValue, selectedMaterials, selectedModels, setInputValue, clearSelectedMaterials, startAllStreams]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const enabledModelsList = models.filter((m) => m.enabled);

  return (
    <div className="absolute bottom-8 left-0 right-0 px-10 flex flex-col items-center gap-3 z-40 pointer-events-none">
      {/* Selected Assets Preview */}
      <AnimatePresence>
        {selectedMaterials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="flex items-center gap-3 glass-panel px-4 py-2 rounded-2xl shadow-lg pointer-events-auto"
          >
            <div className="flex -space-x-1.5">
              {selectedMaterials.slice(0, 3).map((matId, i) => {
                const mat = useAppStore.getState().materials.find((m) => m.id === matId);
                return (
                  <div
                    key={matId}
                    className="w-5 h-5 rounded-md border border-white/80"
                    style={{
                      backgroundColor: mat?.sourceModelColor || '#ccc',
                      zIndex: 3 - i,
                    }}
                  />
                );
              })}
              {selectedMaterials.length > 3 && (
                <div className="w-5 h-5 rounded-md bg-[#5e5e61] text-white text-[8px] font-bold flex items-center justify-center border border-white/80">
                  +{selectedMaterials.length - 3}
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-[#1a1c1f]/80">
              {selectedMaterials.length} 个素材已引用
            </span>
            <button
              onClick={clearSelectedMaterials}
              className="text-[#5e5e61] hover:text-[#1a1c1f] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Input Area */}
      <div className="w-full max-w-4xl glass-panel-strong p-1.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-auto border border-white/60">
        <div className="flex-1 flex items-center px-4 gap-3">
          <Sparkles className="w-5 h-5 text-[#5e5e61] shrink-0" />
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            placeholder="输入任务，同时发送给多个 AI..."
            className="bg-transparent border-none focus:ring-0 focus:outline-none flex-1 text-sm text-[#1a1c1f] placeholder-[#1a1c1f]/30"
          />
        </div>

        {/* AI Selector Toggle */}
        <div className="flex items-center gap-1 bg-white/20 p-1 rounded-full">
          {enabledModelsList.map((model) => {
            const isSelected = selectedModels.has(model.id);
            return (
              <button
                key={model.id}
                onClick={() => toggleModel(model.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                  isSelected
                    ? 'bg-white/70 text-[#1a1c1f] shadow-sm'
                    : 'text-[#5e5e61] hover:bg-white/20'
                }`}
              >
                {model.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Send Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0 ${
            inputValue.trim()
              ? 'bg-[#1a1c1f] text-white hover:scale-105'
              : 'bg-[#1a1c1f]/20 text-white/40'
          } disabled:cursor-not-allowed`}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}

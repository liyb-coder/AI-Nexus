import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import type { AIModel } from '@/types';
import {
  Eye,
  EyeOff,
  Edit3,
  X,
  Zap,
  Thermometer,
  Hash,
  Globe,
  Key,
  AlertCircle,
} from 'lucide-react';

export function ModelsTab() {
  const { models, toggleModel, updateModel } = useAppStore();
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1a1c1f]">模型配置</h2>
          <p className="text-[11px] text-[#5e5e61] mt-0.5">
            {models.filter((m) => m.enabled).length} 个模型已启用
          </p>
        </div>
      </div>

      {/* Models List */}
      <div className="flex-1 overflow-y-auto scroll-hide space-y-3">
        <AnimatePresence>
          {models.map((model, i) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-panel rounded-2xl p-5 group"
            >
              <div className="flex items-start justify-between">
                {/* Left */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl icon-glass shrink-0 font-bold text-sm"
                    style={{ color: model.color }}
                  >
                    {model.name[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[13px] font-bold text-[#1a1c1f]">
                        {model.name}
                      </h3>
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          model.enabled ? 'bg-[#10b981]' : 'bg-[#c4c4c4]'
                        }`}
                        style={
                          model.enabled
                            ? { boxShadow: `0 0 6px ${model.color}40` }
                            : {}
                        }
                      />
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/30 text-[#5e5e61]"
                      >
                        {model.id}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#5e5e61]">
                        <Globe className="w-3 h-3" />
                        <span className="font-mono truncate">{model.endpoint || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5e5e61]">
                        <Thermometer className="w-3 h-3" />
                        <span>Temperature: {model.temperature ?? '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5e5e61]">
                        <Hash className="w-3 h-3" />
                        <span>Max Tokens: {model.maxTokens?.toLocaleString() ?? '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5e5e61]">
                        <Key className="w-3 h-3" />
                        <span className="font-mono">
                          {model.apiKey ? '••••' + model.apiKey.slice(-4) : '未配置'}
                        </span>
                      </div>
                    </div>

                    {/* Latency & tokens if available */}
                    {(model.latency || model.tokensUsed) && (
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-[#5e5e61] font-mono">
                        {model.latency && <span>延迟: {(model.latency / 1000).toFixed(2)}s</span>}
                        {model.tokensUsed && <span>Token: {Math.round(model.tokensUsed)}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {/* Enable toggle */}
                  <button
                    onClick={() => toggleModel(model.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                      model.enabled
                        ? 'bg-white/40 text-[#1a1c1f] border border-white/60'
                        : 'bg-white/20 text-[#5e5e61] border border-white/30'
                    }`}
                  >
                    {model.enabled ? (
                      <>
                        <Zap className="w-3 h-3" />
                        已启用
                      </>
                    ) : (
                      '已禁用'
                    )}
                  </button>
                  <button
                    onClick={() => setEditingModel(model)}
                    className="p-1.5 hover:bg-white/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#5e5e61]" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <ModelEditModal
        model={editingModel}
        isOpen={!!editingModel}
        onClose={() => setEditingModel(null)}
        onSave={(updates) => {
          if (editingModel) {
            updateModel(editingModel.id, updates);
          }
          setEditingModel(null);
        }}
      />
    </div>
  );
}

function ModelEditModal({
  model,
  isOpen,
  onClose,
  onSave,
}: {
  model: AIModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<AIModel>) => void;
}) {
  const [endpoint, setEndpoint] = useState(model?.endpoint || '');
  const [apiKey, setApiKey] = useState(model?.apiKey || '');
  const [temperature, setTemperature] = useState(model?.temperature?.toString() || '0.7');
  const [maxTokens, setMaxTokens] = useState(model?.maxTokens?.toString() || '4096');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen || !model) return null;

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
        className="w-[520px] max-w-[90vw] glass-panel-strong rounded-2xl overflow-hidden flex flex-col border border-white/60"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/30 shrink-0">
          <div
            className="w-8 h-8 rounded-lg icon-glass font-bold text-xs"
            style={{ color: model.color }}
          >
            {model.name[0]}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1a1c1f]">{model.name}</h3>
            <p className="text-[10px] text-[#5e5e61] font-mono">{model.id}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-white/40 transition-colors">
            <X className="w-4 h-4 text-[#5e5e61]" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto scroll-hide p-5 space-y-4">
          {/* Endpoint */}
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              API 端点
            </label>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 font-mono"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 flex items-center gap-1.5">
              <Key className="w-3 h-3" />
              API 密钥
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 pr-9 text-[12px] text-[#1a1c1f] placeholder:text-[#5e5e61]/50 focus:outline-none focus:border-white/60 font-mono"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5e5e61] hover:text-[#1a1c1f]"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[9px] text-[#5e5e61] mt-1">密钥将存储在系统钥匙串中</p>
          </div>

          {/* Temperature & Max Tokens */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 flex items-center gap-1.5">
                <Thermometer className="w-3 h-3" />
                Temperature
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="flex-1 accent-[#1a1c1f]"
                />
                <span className="text-[12px] font-mono text-[#1a1c1f] w-10 text-right">{temperature}</span>
              </div>
              <div className="flex justify-between text-[8px] text-[#5e5e61] mt-0.5">
                <span>精确</span>
                <span>平衡</span>
                <span>创意</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                Max Tokens
              </label>
              <input
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                type="number"
                min="256"
                max="128000"
                step="256"
                className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-[12px] text-[#1a1c1f] focus:outline-none focus:border-white/60 font-mono"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-[11px] font-bold text-[#1a1c1f] mb-1.5 block">快速预设</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: '精确模式', temp: '0.2', tokens: '2048' },
                { name: '平衡模式', temp: '0.7', tokens: '4096' },
                { name: '创意模式', temp: '1.0', tokens: '4096' },
                { name: '长输出模式', temp: '0.7', tokens: '8192' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => { setTemperature(preset.temp); setMaxTokens(preset.tokens); }}
                  className="px-2.5 py-1 bg-white/20 border border-white/30 rounded-lg text-[10px] text-[#5e5e61] hover:bg-white/40 hover:text-[#1a1c1f] transition-all"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-white/20">
          <div className="flex items-center gap-1.5 text-[10px] text-[#5e5e61]">
            <AlertCircle className="w-3 h-3" />
            <span>修改后立即生效</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/20 text-[#1a1c1f] text-[12px] font-bold border border-white/40 hover:bg-white/40 transition-colors active:scale-95"
            >
              取消
            </button>
            <button
              onClick={() =>
                onSave({
                  endpoint,
                  apiKey,
                  temperature: parseFloat(temperature),
                  maxTokens: parseInt(maxTokens),
                })
              }
              className="px-4 py-2 rounded-xl bg-[#1a1c1f] text-white text-[12px] font-bold hover:opacity-90 transition-opacity active:scale-95"
            >
              保存配置
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

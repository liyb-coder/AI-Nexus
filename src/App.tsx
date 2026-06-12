import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from '@/components/Sidebar';
import { AIStreamPanel } from '@/components/AIStreamPanel';
import { ReviewPanel } from '@/components/ReviewPanel';
import { Console } from '@/components/Console';
import { ApprovalModal } from '@/components/ApprovalModal';
import { FullscreenModal } from '@/components/FullscreenModal';
import { ManagementPage } from '@/components/ManagementPage';
import { HistoryPage } from '@/components/HistoryPage';
import { SplashScreen } from '@/components/SplashScreen';
import type { AIResponse, AIModel } from '@/types';
import './App.css';

function useDemoApprovals() {
  const { addApproval, approvals } = useAppStore();

  const triggerDemoApproval = useCallback(() => {
    if (approvals.filter((a) => !a.resolved).length > 0) return;
    addApproval({
      id: `approval_${Date.now()}`,
      tool: 'lark-cli',
      command: 'lark-cli doc create --title "项目架构方案" --content "# 多AI协作平台..." --folder project_docs',
      workingDir: '/Users/dev/projects/huizhitai',
      riskLevel: 'medium',
      purpose: 'AI 请求创建飞书文档以保存当前评审结果',
      timestamp: Date.now(),
      resolved: false,
    });
  }, [addApproval, approvals]);

  const triggerDangerousApproval = useCallback(() => {
    if (approvals.filter((a) => !a.resolved).length > 0) return;
    addApproval({
      id: `approval_${Date.now()}`,
      tool: 'npm',
      command: 'npm install && rm -rf node_modules/.cache && npm run build',
      workingDir: '/Users/dev/projects/huizhitai',
      riskLevel: 'high',
      purpose: 'Codex 请求清理缓存并重新构建项目',
      timestamp: Date.now(),
      resolved: false,
    });
  }, [addApproval, approvals]);

  return { triggerDemoApproval, triggerDangerousApproval };
}

// Brand gradient background — ethereal periwinkle, replaces Unsplash mountain photo

function App() {
  const { responses, removeResponse, currentQuery, currentView, models } = useAppStore();
  const { triggerDemoApproval, triggerDangerousApproval } = useDemoApprovals();

  const [fullscreenResponse, setFullscreenResponse] = useState<AIResponse | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const [bgBlur, setBgBlur] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Cross-panel highlight
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.text) {
        setHighlightedText(ce.detail.text);
        setTimeout(() => setHighlightedText(''), 3000);
      }
    };
    window.addEventListener('panel-text-selected', handler);
    return () => window.removeEventListener('panel-text-selected', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        triggerDemoApproval();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        triggerDangerousApproval();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerDemoApproval, triggerDangerousApproval]);

  const handleFullscreen = useCallback((response: AIResponse) => {
    setFullscreenResponse(response);
    setIsFullscreenOpen(true);
  }, []);

  const handleClosePanel = useCallback((id: string) => removeResponse(id), [removeResponse]);
  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
    setTimeout(() => setFullscreenResponse(null), 300);
  }, []);

  const hasResponses = responses.length > 0;
  const activeCount = responses.filter((r) => r.status === 'loading' || r.status === 'streaming').length;
  const doneCount = responses.filter((r) => r.status === 'done').length;
  const enabledModels = models.filter((m) => m.enabled);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden relative">
      {/* Brand Gradient Background — ethereal periwinkle cloud */}
      <div
        className="fixed inset-0 z-0 transition-all duration-700"
        style={{
          background: bgBlur
            ? 'linear-gradient(135deg, #e8e5f5 0%, #dcdcf2 25%, #f1eef6 50%, #e0ddf5 75%, #d8d4f0 100%)'
            : 'linear-gradient(135deg, #f1eef6 0%, #e8e5f8 20%, #dcdcf2 40%, #f0edf5 60%, #e5e2f6 80%, #f1eef6 100%)',
          filter: bgBlur ? 'blur(20px)' : 'none',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f1eef6]/20" />

      {/* Sidebar Rail */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-20 flex flex-col relative z-10 max-h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === 'workbench' ? (
            <WorkbenchView
              key="workbench"
              hasResponses={hasResponses}
              activeCount={activeCount}
              doneCount={doneCount}
              currentQuery={currentQuery}
              responses={responses}
              enabledModels={enabledModels}
              highlightedText={highlightedText}
              handleFullscreen={handleFullscreen}
              handleClosePanel={handleClosePanel}
              setBgBlur={setBgBlur}
            />
          ) : currentView === 'management' ? (
            <ManagementPage key="management" />
          ) : (
            <HistoryPage key="history" />
          )}
        </AnimatePresence>

        {/* Approval Modal - always rendered */}
        <ApprovalModal />

        {/* Fullscreen Modal */}
        <FullscreenModal
          response={fullscreenResponse}
          isOpen={isFullscreenOpen}
          onClose={handleCloseFullscreen}
        />
      </main>
    </div>
  );
}

// Adaptive AI Grid — changes layout based on panel count
function AIGrid({
  responses,
  highlightedText,
  handleFullscreen,
  handleClosePanel,
}: {
  responses: AIResponse[];
  highlightedText: string;
  handleFullscreen: (r: AIResponse) => void;
  handleClosePanel: (id: string) => void;
}) {
  const count = responses.length;

  // Determine grid layout based on panel count
  const getGridClass = () => {
    if (count <= 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-2 grid-rows-2'; // 田字形
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-3 grid-rows-3';
  };

  return (
    <div
      className={`grid ${getGridClass()} gap-3 xl:gap-4 h-full`}
    >
      <AnimatePresence mode="popLayout">
        {responses.map((response, index) => (
          <AIStreamPanel
            key={response.id}
            response={response}
            index={index}
            onFullscreen={handleFullscreen}
            onClose={handleClosePanel}
            highlightedText={highlightedText}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Extracted Workbench View
function WorkbenchView({
  hasResponses,
  activeCount,
  doneCount,
  currentQuery,
  responses,
  enabledModels,
  highlightedText,
  handleFullscreen,
  handleClosePanel,
  setBgBlur,
}: {
  hasResponses: boolean;
  activeCount: number;
  doneCount: number;
  currentQuery: string;
  responses: AIResponse[];
  enabledModels: AIModel[];
  highlightedText: string;
  handleFullscreen: (r: AIResponse) => void;
  handleClosePanel: (id: string) => void;
  setBgBlur: (v: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      {/* Top App Bar */}
      <header className="h-14 xl:h-16 flex items-center px-5 xl:px-6 glass-panel border-b border-white/40 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg xl:text-xl font-semibold text-[#1a1c1f] tracking-tight truncate max-w-[300px] xl:max-w-[400px]">
            {currentQuery || 'AI Nexus 汇智'}
          </h1>
          {hasResponses && (
            <div className="px-3 py-1 rounded-full bg-white/40 border border-white/60 flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeCount > 0 ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                }`}
              />
              <span className="text-[11px] font-medium text-[#47464b]">
                {activeCount > 0 ? `${activeCount} 个 AI 活跃中` : `${doneCount} 个已完成`}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Workbench Canvas — pb-28 reserves space for absolute-positioned Console */}
      <div className="flex-1 p-4 xl:p-6 pb-28 xl:pb-32 flex gap-4 xl:gap-6 overflow-hidden min-h-0">
        {/* Comparison Grid — adaptive layout */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {hasResponses ? (
              <AIGrid
                responses={responses}
                highlightedText={highlightedText}
                handleFullscreen={handleFullscreen}
                handleClosePanel={handleClosePanel}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="mx-auto mb-3 rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{ width: 110, height: 110 }}
                  >
                    <img src="/logo.png" className="w-full h-full object-contain scale-[2.2]" alt="Logo" />
                  </motion.div>
                  <h2 className="text-lg xl:text-xl font-semibold mb-2" style={{ color: '#1a1c1f' }}>
                    多 AI 并行，灵感交汇
                  </h2>
                  <p className="text-[12px] xl:text-[13px] max-w-md mx-auto leading-relaxed" style={{ color: '#9a9aa0' }}>
                    一次输入，多维智慧同时回应
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-6">
                    {enabledModels.map((m) => (
                      <div key={m.id} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-[10px] xl:text-[11px]" style={{ color: '#9a9aa0' }}>{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Assets & Summary Panel */}
        <ReviewPanel />
      </div>

      {/* Bottom Input Bar */}
      <Console onFocusChange={setBgBlur} />
    </motion.div>
  );
}

export default App;

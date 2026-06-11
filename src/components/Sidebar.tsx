import { useAppStore } from '@/store/useAppStore';
import { SettingsPanel } from './SettingsPanel';
import { useState } from 'react';
import {
  Bot,
  ClipboardList,
  SlidersHorizontal,
  Settings,
  Terminal,
} from 'lucide-react';

export function Sidebar() {
  const { currentView, setCurrentView, setManagementTab } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const runtimeOnline = true;

  return (
    <>
      <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-6 glass-panel border-r border-white/40 z-50">
        {/* Logo */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-xl icon-glass shadow-sm mb-2">
            <Terminal className="w-5 h-5 text-[#374151]" strokeWidth={1.5} />
          </div>
          <div className="text-[10px] text-center font-bold text-[#1a1c1f] tracking-tighter opacity-70">
            PRO
          </div>
        </div>

        {/* Main Nav */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Workbench */}
          <button
            onClick={() => setCurrentView('workbench')}
            className={`w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center ${
              currentView === 'workbench'
                ? 'active-tab text-[#1a1c1f]'
                : 'bg-transparent text-[#5e5e61] hover:bg-white/20'
            }`}
            title="工作台"
          >
            <Bot className="w-5 h-5" strokeWidth={currentView === 'workbench' ? 2 : 1.5} />
          </button>

          {/* History Tasks — moved before Management */}
          <button
            onClick={() => setCurrentView('history')}
            className={`w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center ${
              currentView === 'history'
                ? 'active-tab text-[#1a1c1f]'
                : 'bg-transparent text-[#5e5e61] hover:bg-white/20'
            }`}
            title="任务与素材"
          >
            <ClipboardList className="w-5 h-5" strokeWidth={currentView === 'history' ? 2 : 1.5} />
          </button>

          {/* Management */}
          <button
            onClick={() => {
              setCurrentView('management');
              setManagementTab('skills');
            }}
            className={`w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center ${
              currentView === 'management'
                ? 'active-tab text-[#1a1c1f]'
                : 'bg-transparent text-[#5e5e61] hover:bg-white/20'
            }`}
            title="管理控制台"
          >
            <SlidersHorizontal className="w-5 h-5" strokeWidth={currentView === 'management' ? 2 : 1.5} />
          </button>
        </div>

        {/* Bottom */}
        <div className="mt-auto flex flex-col gap-4 items-center">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-12 h-12 rounded-xl bg-transparent text-[#5e5e61] hover:bg-white/20 transition-colors flex items-center justify-center"
            title="设置"
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                runtimeOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'
              }`}
            />
            <span className="text-[8px] text-[#5e5e61] font-mono">
              {runtimeOnline ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/50 overflow-hidden ring-2 ring-white/20 bg-gradient-to-br from-blue-300 to-purple-400" />
        </div>
      </nav>

      {/* Settings Panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

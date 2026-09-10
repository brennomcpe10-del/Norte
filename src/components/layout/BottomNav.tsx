import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  Inbox,
  CheckSquare,
  MoreHorizontal,
  TrendingUp,
  BookOpen,
  Moon,
  FileText,
  Settings,
  X,
} from 'lucide-react';
import { useApp, ScreenTab } from '../../contexts/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, tasks } = useApp();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const inboxCount = tasks.filter((t) => t.status === 'inbox').length;

  const secondaryTabs: { id: ScreenTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'progress', label: 'Progresso e Gráficos', icon: TrendingUp },
    { id: 'journal', label: 'Diário Pessoal', icon: BookOpen },
    { id: 'sleep', label: 'Sono e Bem-estar', icon: Moon },
    { id: 'reports', label: 'Relatórios Semanais', icon: FileText },
    { id: 'settings', label: 'Configurações e Rotina', icon: Settings },
  ];

  const handleSelectTab = (tab: ScreenTab) => {
    setActiveTab(tab);
    setMoreMenuOpen(false);
  };

  const isSecondaryActive = secondaryTabs.some((t) => t.id === activeTab);

  return (
    <>
      {/* Drawer for secondary screens on mobile */}
      {moreMenuOpen && (
        <div
          id="mobile-more-menu-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div
            id="mobile-more-menu-drawer"
            className="absolute bottom-16 inset-x-0 bg-white rounded-t-3xl border-t border-slate-200 p-4 shadow-2xl space-y-1 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outras Telas</span>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {secondaryTabs.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main bottom bar */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 lg:hidden px-2 py-1.5 flex items-center justify-around shadow-sm"
      >
        <button
          id="nav-tab-today"
          type="button"
          onClick={() => handleSelectTab('today')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'today' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className={`w-5 h-5 ${activeTab === 'today' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">Hoje</span>
        </button>

        <button
          id="nav-tab-week"
          type="button"
          onClick={() => handleSelectTab('week')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'week' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className={`w-5 h-5 ${activeTab === 'week' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">Semana</span>
        </button>

        <button
          id="nav-tab-inbox"
          type="button"
          onClick={() => handleSelectTab('inbox')}
          className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'inbox' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Inbox className={`w-5 h-5 ${activeTab === 'inbox' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {inboxCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[9px] font-bold bg-slate-900 text-white rounded-full">
                {inboxCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Entrada</span>
        </button>

        <button
          id="nav-tab-tasks"
          type="button"
          onClick={() => handleSelectTab('tasks')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'tasks' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className={`w-5 h-5 ${activeTab === 'tasks' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">Tarefas</span>
        </button>

        <button
          id="nav-tab-more"
          type="button"
          onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-colors ${
            isSecondaryActive || moreMenuOpen ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 ${isSecondaryActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">Mais</span>
        </button>
      </nav>
    </>
  );
};

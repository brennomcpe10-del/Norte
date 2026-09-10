import React from 'react';
import {
  Compass,
  Calendar,
  Inbox,
  CheckSquare,
  TrendingUp,
  BookOpen,
  Moon,
  FileText,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useApp, ScreenTab } from '../../contexts/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, tasks, todayLog } = useApp();

  const inboxCount = tasks.filter((t) => t.status === 'inbox').length;
  const todayPendingCount = tasks.filter(
    (t) => t.status === 'planned' && t.plannedDate === new Date().toISOString().split('T')[0]
  ).length;

  const menuItems: { id: ScreenTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'today', label: 'Hoje', icon: Compass, badge: todayPendingCount > 0 ? todayPendingCount : undefined },
    { id: 'week', label: 'Semana', icon: Calendar },
    { id: 'inbox', label: 'Caixa de entrada', icon: Inbox, badge: inboxCount > 0 ? inboxCount : undefined },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'progress', label: 'Progresso', icon: TrendingUp },
    { id: 'journal', label: 'Diário', icon: BookOpen },
    { id: 'sleep', label: 'Sono e bem-estar', icon: Moon },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200/80 min-h-[calc(100vh-61px)] p-4">
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-link-${item.id}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Wellness summary widget on desktop sidebar */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-700" />
            <span>Direção Pessoal</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Produtividade humana e sustentável. Sem cobrança por 100%.
          </p>
        </div>
      </div>
    </aside>
  );
};

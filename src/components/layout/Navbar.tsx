import React from 'react';
import { Compass, Plus, LogOut, Moon, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { SyncBadge } from './SyncBadge';
import { getDayOfWeekName, formatDateToPtBR, getTodayString } from '../../utils/dateUtils';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { setQuickAddModalOpen, todayDate, todayLog } = useApp();

  const dayOfWeek = getDayOfWeekName(todayDate);
  const dateFormatted = formatDateToPtBR(todayDate);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand + Date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white shadow-xs">
            <Compass className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 tracking-tight">Meu Norte</span>
              <SyncBadge />
            </div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {dayOfWeek}, {dateFormatted}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Button */}
          <button
            id="navbar-quick-add-btn"
            type="button"
            onClick={() => setQuickAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Tarefa</span>
            <span className="sm:hidden">Nova</span>
          </button>

          {/* User profile / Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 uppercase"
                title={user.email || ''}
              >
                {(profile?.displayName || user.displayName || user.email || 'U')[0]}
              </div>
              <button
                id="navbar-signout-btn"
                type="button"
                onClick={() => signOut()}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

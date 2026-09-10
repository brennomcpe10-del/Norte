import React from 'react';
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const SyncBadge: React.FC = () => {
  const { syncStatus, syncMessage, isOnline } = useApp();

  if (!isOnline || syncStatus === 'offline') {
    return (
      <div
        id="sync-badge-offline"
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full transition-all"
        title="Modo offline: alterações serão sincronizadas assim que a conexão retornar"
      >
        <CloudOff className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Offline (salvo local)</span>
        <span className="sm:hidden">Offline</span>
      </div>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div
        id="sync-badge-syncing"
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>{syncMessage || 'Sincronizando...'}</span>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <div
        id="sync-badge-error"
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-full transition-all"
      >
        <CloudOff className="w-3.5 h-3.5" />
        <span>Erro ao sincronizar</span>
      </div>
    );
  }

  return (
    <div
      id="sync-badge-synced"
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200/70 rounded-full transition-all"
      title="Conectado e sincronizado com a nuvem"
    >
      <Check className="w-3 h-3 text-emerald-600" />
      <span className="text-slate-600">{syncMessage || 'Sincronizado'}</span>
    </div>
  );
};

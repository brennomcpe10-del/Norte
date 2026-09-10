import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  Plus,
  Moon,
  Heart,
  Zap,
  Sparkles,
  CloudRain,
  SunMedium,
  Check,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { TaskCard } from '../tasks/TaskCard';
import { getDayOfWeekName, formatDateToPtBR } from '../../utils/dateUtils';
import { filterTasksForBadDay } from '../../services/plannerAlgorithm';

export const TodayView: React.FC = () => {
  const {
    tasks,
    todayDate,
    todayLog,
    toggleBadDay,
    setQuickAddModalOpen,
    setActiveTab,
  } = useApp();

  const [badDayReasonText, setBadDayReasonText] = useState('');
  const [showBadDayPrompt, setShowBadDayPrompt] = useState(false);

  const dayOfWeek = getDayOfWeekName(todayDate);
  const formattedDate = formatDateToPtBR(todayDate);

  // Filter tasks for today
  const todayTasks = tasks.filter((t) => t.plannedDate === todayDate);
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');
  const pendingTasks = todayTasks.filter((t) => t.status === 'planned');

  const isBadDay = todayLog?.badDayActive || false;

  // If bad day is active, intelligently filter
  let displayTasks = todayTasks;
  let badDayMessage = '';
  if (isBadDay) {
    const { essentialTaskIds, reasonMessage } = filterTasksForBadDay(todayTasks);
    badDayMessage = reasonMessage;
    displayTasks = todayTasks.filter(
      (t) => t.status === 'completed' || essentialTaskIds.includes(t.id)
    );
  }

  const handleToggleBadDay = async () => {
    await toggleBadDay(badDayReasonText.trim() || undefined);
    setShowBadDayPrompt(false);
    setBadDayReasonText('');
  };

  return (
    <div id="today-view-container" className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {dayOfWeek}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
            {formattedDate}
          </h1>
        </div>

        {/* Daily progress indicator pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 rounded-full border border-slate-200/70 text-xs font-semibold text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Concluídas: {completedTasks.length}/{todayTasks.length}
            </span>
          </div>

          <button
            id="today-add-task-btn"
            type="button"
            onClick={() => setQuickAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Wellness and sleep snippet (if recorded today) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('sleep')}
          className="p-3 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-indigo-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sono</span>
            <Moon className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-slate-800">
            {todayLog?.sleepHours ? `${todayLog.sleepHours}h` : 'Registrar'}
          </div>
          <div className="text-[10px] text-slate-400">
            {todayLog?.bedTime && todayLog?.wakeTime ? `${todayLog.bedTime} às ${todayLog.wakeTime}` : 'Toque para preencher'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sleep')}
          className="p-3 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Energia</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-slate-800">
            {todayLog?.energy ? `${todayLog.energy}/5` : 'Não anotado'}
          </div>
          <div className="text-[10px] text-slate-400">
            {todayLog?.energy ? 'Nível corporal de hoje' : 'Avaliar energia'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sleep')}
          className="p-3 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-rose-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Humor</span>
            <Heart className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-slate-800">
            {todayLog?.mood ? `${todayLog.mood}/5` : 'Não anotado'}
          </div>
          <div className="text-[10px] text-slate-400">
            {todayLog?.mood ? 'Disposição psicológica' : 'Avaliar humor'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className="p-3 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-blue-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Diário</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-sm font-bold text-slate-800 truncate">
            Abrir Diário
          </div>
          <div className="text-[10px] text-slate-400">
            Poucas linhas sobre o dia
          </div>
        </button>
      </div>

      {/* "Se hoje estiver difícil" / "Dia ruim" Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-100/90 to-amber-50/60 border border-slate-200/90 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100/80 text-amber-800 mt-0.5">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Se hoje estiver difícil</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Você não precisa ser perfeito. O Meu Norte adapta a carga para o que for essencial, sem cobranças.
              </p>
            </div>
          </div>

          <button
            id="toggle-bad-day-btn"
            type="button"
            onClick={() => {
              if (isBadDay) {
                toggleBadDay();
              } else {
                setShowBadDayPrompt(true);
              }
            }}
            className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer ${
              isBadDay
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isBadDay ? 'Modo Suave Ativo (Desativar)' : 'Hoje não estou bem'}
          </button>
        </div>

        {/* Modal/Prompt to confirm bad day */}
        {showBadDayPrompt && (
          <div className="mt-4 pt-3 border-t border-amber-200/60 space-y-3">
            <p className="text-xs text-slate-700">
              O sistema selecionará automaticamente as 1 ou 2 metas mais fundamentais e guardará o restante para outro momento sem gerar sentimento de culpa.
            </p>
            <input
              type="text"
              value={badDayReasonText}
              onChange={(e) => setBadDayReasonText(e.target.value)}
              placeholder="Opcional: Por que hoje está difícil? (Cansaço, dores, imprevisto...)"
              className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowBadDayPrompt(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleToggleBadDay}
                className="px-4 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-xs"
              >
                Confirmar Modo Suave
              </button>
            </div>
          </div>
        )}

        {isBadDay && badDayMessage && (
          <div className="mt-3 text-xs font-medium text-amber-800 bg-amber-100/60 px-3 py-2 rounded-xl">
            🌿 {badDayMessage}
          </div>
        )}
      </div>

      {/* Main Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🎯 Tarefas de hoje</span>
            {isBadDay && (
              <span className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Carga reduzida
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {pendingTasks.length} pendente(s)
          </span>
        </div>

        {displayTasks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <SunMedium className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Nenhuma tarefa planejada para hoje</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Aproveite para descansar, fazer uma revisão leve ou adicionar uma meta concreta pelo botão abaixo.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setQuickAddModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs"
              >
                Adicionar Tarefa
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('week')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Ver Planejamento Semanal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

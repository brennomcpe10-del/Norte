import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle,
  Inbox,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { TaskCard } from '../tasks/TaskCard';
import { getWeekDays, getTodayString } from '../../utils/dateUtils';
import { DAYS_OF_WEEK } from '../../constants/defaults';
import { calculateWeekCapacities } from '../../services/plannerAlgorithm';

export const WeekView: React.FC = () => {
  const {
    tasks,
    routine,
    saveTask,
    distributeWeek,
    setQuickAddModalOpen,
  } = useApp();

  const [referenceDate, setReferenceDate] = useState<string>(getTodayString());
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(new Date().getDay());
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionNotice, setDistributionNotice] = useState<{ message: string; isOverloaded: boolean } | null>(null);

  const weekDays = getWeekDays(referenceDate);
  const selectedDay = weekDays[selectedDayIndex] || weekDays[0];

  // Tasks in inbox waiting to be planned
  const inboxTasks = tasks.filter((t) => t.status === 'inbox');

  // Capacities calculation
  const capacities = calculateWeekCapacities(weekDays, routine, tasks);

  const handlePrevWeek = () => {
    const [y, m, d] = referenceDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 7);
    setReferenceDate(date.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const [y, m, d] = referenceDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 7);
    setReferenceDate(date.toISOString().split('T')[0]);
  };

  const handleRunDistribution = async () => {
    setIsDistributing(true);
    setDistributionNotice(null);
    try {
      const result = await distributeWeek();
      setDistributionNotice({
        message: result.message,
        isOverloaded: result.isOverloaded,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDistributing(false);
    }
  };

  const handleMoveTaskToDay = async (taskId: string, targetDate: string) => {
    await saveTask({
      id: taskId,
      status: 'planned',
      plannedDate: targetDate,
    });
  };

  return (
    <div id="week-view-container" className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header with week navigation and action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Planejamento Semanal</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {weekDays[0].label} – {weekDays[6].label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribuição realista que respeita seus compromissos fixos e capacidade humana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setReferenceDate(getTodayString())}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id="run-distribution-btn"
            type="button"
            onClick={handleRunDistribution}
            disabled={isDistributing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isDistributing ? 'Distribuindo...' : 'Sugerir Distribuição'}</span>
          </button>
        </div>
      </div>

      {/* Distribution feedback notice banner */}
      {distributionNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 transition-all ${
            distributionNotice.isOverloaded
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {distributionNotice.isOverloaded ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">
              {distributionNotice.isOverloaded ? 'Atenção ao volume planejado' : 'Semana Equilibrada'}
            </span>
            {distributionNotice.message}
          </div>
        </div>
      )}

      {/* Week Day Selector Strip (Mobile-first responsive tabs) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          const dayCapacity = capacities[day.date];
          const dayTasks = tasks.filter((t) => t.plannedDate === day.date);
          const completedCount = dayTasks.filter((t) => t.status === 'completed').length;
          const isHeavy = dayCapacity?.intensity === 'heavy';

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDayIndex(idx)}
              className={`p-2 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                {DAYS_OF_WEEK[day.dayIndex]?.short}
              </div>
              <div className="text-base sm:text-lg font-bold my-0.5">
                {day.date.split('-')[2]}
              </div>

              {/* Intensity indicator dot */}
              <div className="flex items-center justify-center gap-1 mt-1">
                {isHeavy && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`}
                    title="Dia de rotina pesada (escola/curso)"
                  />
                )}
                <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {dayTasks.length}/{dayCapacity?.maxTasks || 4}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day View + Fixed Routine Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Selected Day's Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {DAYS_OF_WEEK[selectedDay.dayIndex]?.full} ({selectedDay.date})
              </h2>
              <p className="text-xs text-slate-500">
                Capacidade recomendada: até {capacities[selectedDay.date]?.maxTasks || 4} metas
              </p>
            </div>

            <button
              type="button"
              onClick={() => setQuickAddModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar neste dia</span>
            </button>
          </div>

          {/* Fixed Routine commitments for this selected day */}
          {routine.filter((r) => r.dayOfWeek === selectedDay.dayIndex).length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Compromissos Fixos deste Dia
              </span>
              <div className="flex flex-wrap gap-2">
                {routine
                  .filter((r) => r.dayOfWeek === selectedDay.dayIndex)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 font-medium text-slate-700"
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{r.title}</span>
                      {r.startTime && r.endTime && (
                        <span className="text-slate-400 text-[11px]">
                          ({r.startTime} - {r.endTime})
                        </span>
                      )}
                      {r.intensity === 'heavy' && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded font-semibold">
                          Pesado
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tasks for the selected day */}
          {tasks.filter((t) => t.plannedDate === selectedDay.date).length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500">
                Nenhuma tarefa alocada para este dia. Adicione ou mova tarefas da Caixa de Entrada.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks
                .filter((t) => t.plannedDate === selectedDay.date)
                .map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
            </div>
          )}
        </div>

        {/* Right Col: Quick Inbox Pool & Move to this day */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Caixa de Entrada</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {inboxTasks.length}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Ideias e metas ainda não agendadas. Clique em "Alocar" para trazer para o dia selecionado.
          </p>

          {inboxTasks.length === 0 ? (
            <div className="p-5 text-center bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-400">
              Caixa de entrada vazia. Todas as tarefas foram planejadas!
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {inboxTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="text-xs font-semibold text-slate-800 line-clamp-2">
                    {t.title}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {t.category || 'Geral'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMoveTaskToDay(t.id, selectedDay.date)}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                    >
                      <span>Colocar no dia</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

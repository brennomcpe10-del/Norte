import React, { useState } from 'react';
import { X, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { FAILURE_REASONS } from '../../constants/defaults';
import { FailureReason } from '../../types';
import { getTodayString } from '../../utils/dateUtils';

export const TaskFailureModal: React.FC = () => {
  const { taskToReportIncomplete, setTaskToReportIncomplete, markTaskIncomplete } = useApp();
  const [selectedReason, setSelectedReason] = useState<FailureReason>('Faltou tempo');
  const [notes, setNotes] = useState('');
  const [actionChoice, setActionChoice] = useState<'tomorrow' | 'custom_date' | 'mark_incomplete'>('tomorrow');

  const today = getTodayString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [customDate, setCustomDate] = useState(tomorrowStr);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!taskToReportIncomplete) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToReportIncomplete) return;

    setIsSubmitting(true);
    try {
      let replanDate: string | null = null;
      if (actionChoice === 'tomorrow') {
        replanDate = tomorrowStr;
      } else if (actionChoice === 'custom_date') {
        replanDate = customDate;
      }

      await markTaskIncomplete(taskToReportIncomplete, selectedReason, notes, replanDate);
      setTaskToReportIncomplete(null);
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="task-failure-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={() => setTaskToReportIncomplete(null)}
    >
      <div
        id="task-failure-modal-container"
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              O que aconteceu com esta tarefa?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sem cobrança. Identificar o que ocorreu ajuda o sistema a calibrar sua semana.
            </p>
          </div>
          <button
            id="close-failure-modal-btn"
            onClick={() => setTaskToReportIncomplete(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Task */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500 block mb-1">Tarefa:</span>
            <p className="text-sm font-semibold text-slate-800">{taskToReportIncomplete.title}</p>
            {taskToReportIncomplete.category && (
              <span className="inline-block mt-1.5 px-2 py-0.5 text-xs rounded-md bg-slate-200 text-slate-700 font-medium">
                {taskToReportIncomplete.category}
              </span>
            )}
          </div>

          {/* Quick Reasons Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Selecione o motivo principal
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FAILURE_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observação pessoal (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Aula atrasou, imprevisto em casa..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
            />
          </div>

          {/* Action Destination */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              O que deseja fazer com ela agora?
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  actionChoice === 'tomorrow'
                    ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="actionChoice"
                  checked={actionChoice === 'tomorrow'}
                  onChange={() => setActionChoice('tomorrow')}
                  className="accent-slate-900"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-slate-800">Mover para amanhã</div>
                  <div className="text-slate-500">A tarefa será replanejada para o próximo dia</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  actionChoice === 'custom_date'
                    ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="actionChoice"
                  checked={actionChoice === 'custom_date'}
                  onChange={() => setActionChoice('custom_date')}
                  className="accent-slate-900"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-slate-800">Replanejar para outra data</div>
                  <div className="text-slate-500">Escolha o dia ideal para retomar</div>
                </div>
              </label>

              {actionChoice === 'custom_date' && (
                <div className="pl-8 pt-1">
                  <input
                    type="date"
                    value={customDate}
                    min={today}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  actionChoice === 'mark_incomplete'
                    ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="actionChoice"
                  checked={actionChoice === 'mark_incomplete'}
                  onChange={() => setActionChoice('mark_incomplete')}
                  className="accent-slate-900"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-slate-800">Guardar apenas como não concluída</div>
                  <div className="text-slate-500">Mantém no histórico para relatórios, sem agendar agora</div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTaskToReportIncomplete(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar Replanejamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

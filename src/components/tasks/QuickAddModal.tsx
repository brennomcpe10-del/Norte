import React, { useState } from 'react';
import { X, Plus, Calendar, Bookmark, Repeat } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { getTodayString } from '../../utils/dateUtils';

interface QuickAddModalProps {
  defaultPlannedDate?: string;
  defaultStatus?: 'inbox' | 'planned';
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  defaultPlannedDate,
  defaultStatus = 'planned',
}) => {
  const { quickAddModalOpen, setQuickAddModalOpen, saveTask, categories, objectives } = useApp();
  const today = getTodayString();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Matemática');
  const [targetPlacement, setTargetPlacement] = useState<'today' | 'inbox' | 'custom'>(
    defaultPlannedDate ? 'custom' : defaultStatus === 'inbox' ? 'inbox' : 'today'
  );
  const [customDate, setCustomDate] = useState(defaultPlannedDate || today);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [objectiveId, setObjectiveId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'weekly' | 'daily' | 'biweekly'>('weekly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!quickAddModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      let status: 'inbox' | 'planned' = 'planned';
      let plannedDate: string | undefined = undefined;

      if (targetPlacement === 'inbox') {
        status = 'inbox';
        plannedDate = undefined;
      } else if (targetPlacement === 'today') {
        status = 'planned';
        plannedDate = today;
      } else {
        status = 'planned';
        plannedDate = customDate;
      }

      await saveTask({
        title: title.trim(),
        category,
        status,
        plannedDate,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        objectiveId: objectiveId || undefined,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
      });

      // Reset
      setTitle('');
      setNotes('');
      setDueDate('');
      setIsRecurring(false);
      setQuickAddModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="quick-add-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={() => setQuickAddModalOpen(false)}
    >
      <div
        id="quick-add-modal-container"
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Nova Tarefa</h3>
            <p className="text-xs text-slate-500">
              Descreva um objetivo concreto (ex: “Fazer 20 questões de Física”)
            </p>
          </div>
          <button
            id="close-quick-add-btn"
            onClick={() => setQuickAddModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              O que precisa ou gostaria de fazer? *
            </label>
            <input
              id="new-task-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Fazer 20 questões de Matemática..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Category & Placement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Matéria / Categoria
              </label>
              <select
                id="new-task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Onde colocar?
              </label>
              <select
                id="new-task-placement-select"
                value={targetPlacement}
                onChange={(e) => setTargetPlacement(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              >
                <option value="today">Hoje</option>
                <option value="inbox">📥 Caixa de Entrada (organizar depois)</option>
                <option value="custom">Data específica...</option>
              </select>
            </div>
          </div>

          {targetPlacement === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Data planejada
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          {/* Due date & Major Objective */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Prazo final (opcional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {objectives.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Objetivo Maior (opcional)
                </label>
                <select
                  value={objectiveId}
                  onChange={(e) => setObjectiveId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Nenhum</option>
                  {objectives.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Tarefa Recorrente?</span>
                <span className="text-[11px] text-slate-500">Gera nova meta semanal ao concluir</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRecurring && (
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value as any)}
                  className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">A cada 2 semanas</option>
                  <option value="daily">Diária</option>
                </select>
              )}
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-slate-900 rounded"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Capítulo 4, foco em exercícios ímpares..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setQuickAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="confirm-quick-add-btn"
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

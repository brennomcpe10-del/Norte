import React, { useState } from 'react';
import { Check, Clock, Calendar, MoreVertical, RotateCcw, Trash2, Edit3, AlertCircle } from 'lucide-react';
import { UserTask } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface TaskCardProps {
  task: UserTask;
  showDate?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, showDate = false }) => {
  const { completeTask, setTaskToReportIncomplete, deleteTask, saveTask, categories } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const categoryObj = (categories || []).find((c) => c?.name?.toLowerCase() === task?.category?.toLowerCase());
  const categoryColor = categoryObj?.color || '#475569';

  const isCompleted = task.status === 'completed';
  const isPostponed = (task.postponedCount || 0) > 0;

  const handleToggle = async () => {
    if (isCompleted) {
      // Un-complete (move back to planned)
      await saveTask({
        id: task.id,
        status: 'planned',
        completedAt: undefined,
      });
    } else {
      await completeTask(task);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTitle.trim()) return;
    await saveTask({
      id: task.id,
      title: editedTitle.trim(),
    });
    setIsEditing(false);
  };

  return (
    <div
      id={`task-card-${task.id}`}
      className={`group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-slate-50/60 border-slate-200/60 text-slate-400 opacity-80'
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs text-slate-800'
      }`}
    >
      {/* Checkbox Touch Target (at least 44px area) */}
      <button
        id={`task-checkbox-${task.id}`}
        type="button"
        onClick={handleToggle}
        className="shrink-0 flex items-center justify-center w-7 h-7 mt-0.5 rounded-lg border transition-all cursor-pointer focus:outline-hidden"
        style={{
          borderColor: isCompleted ? '#10b981' : '#cbd5e1',
          backgroundColor: isCompleted ? '#10b981' : 'transparent',
        }}
        aria-label={isCompleted ? 'Marcar como não concluída' : 'Concluir tarefa'}
      >
        {isCompleted && <Check className="w-4 h-4 text-white stroke-[3]" />}
      </button>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="flex items-center gap-2">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-2.5 py-1 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              autoFocus
            />
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 rounded-lg"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {task.category && (
                <span
                  className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md tracking-tight"
                  style={{
                    backgroundColor: `${categoryColor}18`,
                    color: categoryColor,
                  }}
                >
                  {task.category}
                </span>
              )}

              {isPostponed && !isCompleted && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 rounded-md border border-amber-200/80">
                  <RotateCcw className="w-2.5 h-2.5" />
                  Replanejada {task.postponedCount}x
                </span>
              )}

              {task.dueDate && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 rounded-md">
                  <Calendar className="w-2.5 h-2.5 text-slate-400" />
                  Prazo: {task.dueDate}
                </span>
              )}

              {task.isRecurring && (
                <span className="inline-flex items-center text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                  Recorrente
                </span>
              )}
            </div>

            <p
              className={`text-sm font-medium leading-snug break-words ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
              }`}
            >
              {task.title}
            </p>

            {task.notes && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {task.notes}
              </p>
            )}

            {task.failureReason && !isCompleted && (
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 italic">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Anterior: {task.failureReason}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action triggers */}
      <div className="relative shrink-0 flex items-center gap-1">
        {!isCompleted && (
          <button
            id={`postpone-task-${task.id}`}
            type="button"
            onClick={() => setTaskToReportIncomplete(task)}
            title="Hoje não deu / Replanejar tarefa"
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <div className="relative">
          <button
            id={`task-menu-btn-${task.id}`}
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Mais opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-36 py-1 bg-white rounded-xl shadow-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteTask(task.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Inbox, Plus, Calendar, ArrowRight, Trash2, Tag } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { getTodayString } from '../../utils/dateUtils';

export const InboxView: React.FC = () => {
  const { tasks, saveTask, deleteTask, categories, setActiveTab } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Matemática');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inboxTasks = tasks.filter((t) => t.status === 'inbox');

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await saveTask({
        title: title.trim(),
        category,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        status: 'inbox',
      });
      setTitle('');
      setNotes('');
      setDueDate('');
      setShowMoreFields(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveToToday = async (taskId: string) => {
    await saveTask({
      id: taskId,
      status: 'planned',
      plannedDate: getTodayString(),
    });
  };

  return (
    <div id="inbox-view-container" className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Caixa de Entrada</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture pensamentos e tarefas imediatamente. Organize no planejamento semanal.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
          {inboxTasks.length} {inboxTasks.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Ultra-rapid input field */}
      <form
        onSubmit={handleQuickAdd}
        className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
      >
        <div className="flex items-center gap-2">
          <input
            id="inbox-task-title-input"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que você precisa fazer? (Ex: Fazer trabalho de História)"
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all placeholder:text-slate-400"
            autoFocus
          />
          <button
            id="inbox-submit-btn"
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Capturar</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowMoreFields(!showMoreFields)}
              className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
            >
              {showMoreFields ? 'Menos detalhes' : '+ Prazo e observações'}
            </button>
          </div>
        </div>

        {showMoreFields && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Prazo final (opcional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Observação pessoal (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: Entrega na sexta, consultar livro..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        )}
      </form>

      {/* Inbox List */}
      <div className="space-y-3">
        {inboxTasks.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/80 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Sua Caixa de Entrada está vazia</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Quando surgir qualquer nova ideia ou tarefa na sua cabeça, anote rapidamente aqui pelo campo acima.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {inboxTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] px-2 py-0.5 font-medium rounded-md bg-slate-100 text-slate-700">
                      {task.category || 'Geral'}
                    </span>
                    {task.dueDate && (
                      <span className="text-[10px] text-amber-700 font-medium">
                        Prazo: {task.dueDate}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                  {task.notes && <p className="text-xs text-slate-500 truncate">{task.notes}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveToToday(task.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Fazer hoje</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {inboxTasks.length > 0 && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('week')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-950 underline underline-offset-4"
          >
            <span>Ir para o Planejamento Semanal para distribuir todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

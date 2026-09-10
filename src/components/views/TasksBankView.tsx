import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Repeat,
  Tag,
  Copy,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Filter,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { TaskCard } from '../tasks/TaskCard';
import { getTodayString } from '../../utils/dateUtils';
import { CategoryItem, UserTask } from '../../types';

export const TasksBankView: React.FC = () => {
  const {
    tasks,
    saveTask,
    categories,
    saveCategory,
    deleteCategory,
    setQuickAddModalOpen,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'planned' | 'completed' | 'recurring'>('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#2563eb');

  // Recurring tasks
  const recurringTasks = tasks.filter((t) => t.isRecurring);

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (filterStatus === 'planned' && t.status !== 'planned') return false;
    if (filterStatus === 'completed' && t.status !== 'completed') return false;
    if (filterStatus === 'recurring' && !t.isRecurring) return false;
    return true;
  });

  const handleDuplicateTask = async (task: UserTask) => {
    await saveTask({
      title: task.title,
      category: task.category,
      status: 'inbox',
      notes: task.notes,
      objectiveId: task.objectiveId,
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const id = `cat-${Date.now()}`;
    await saveCategory({
      id,
      name: newCatName.trim(),
      color: newCatColor,
    });
    setNewCatName('');
    setShowCategoryModal(false);
  };

  return (
    <div id="tasks-bank-container" className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Banco de Tarefas</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize por matérias, crie recorrências semanais e reutilize metas frequentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Gerenciar Categorias</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Categorias / Matérias</h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Fechar
              </button>
            </div>

            {/* List of current categories */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs font-semibold text-slate-800">{c.name}</span>
                  </div>
                  {!c.isDefault && (
                    <button
                      type="button"
                      onClick={() => deleteCategory(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new category form */}
            <form onSubmit={handleCreateCategory} className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nome da matéria / categoria..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  title="Cor da categoria"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                Salvar Nova Categoria
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Recurrent Goals Section */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Metas Recorrentes Ativas</h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {recurringTasks.length} cadastrada(s)
          </span>
        </div>

        {recurringTasks.length === 0 ? (
          <p className="text-xs text-slate-400">
            Nenhuma meta com repetição configurada. Marque a opção "Tarefa Recorrente" ao criar uma meta (ex: Fazer 1 redação por semana).
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recurringTasks.map((t) => (
              <div
                key={t.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                    {t.category}
                  </span>
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                    {t.recurrenceRule === 'weekly' ? 'Semanal' : t.recurrenceRule === 'biweekly' ? 'Quinzenal' : 'Diária'}
                  </span>
                </div>
                <p className="font-semibold text-slate-800 line-clamp-1">{t.title}</p>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Status: {t.status === 'completed' ? 'Concluída esta rodada' : 'Pendente'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({tasks.length})
          </button>
          {categories.map((cat) => {
            const count = tasks.filter((t) => t.category === cat.name).length;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded-lg ${
              filterStatus === 'all' ? 'font-bold text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('planned')}
            className={`px-2.5 py-1 rounded-lg ${
              filterStatus === 'planned' ? 'font-bold text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Planejadas
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`px-2.5 py-1 rounded-lg ${
              filterStatus === 'completed' ? 'font-bold text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Concluídas
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
            Nenhuma meta encontrada para os filtros selecionados.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="relative group">
              <TaskCard task={task} />
              {/* Duplicate frequent task quick action */}
              <button
                type="button"
                onClick={() => handleDuplicateTask(task)}
                className="hidden group-hover:flex absolute right-16 top-3 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Reutilizar / Duplicar para Caixa de Entrada"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

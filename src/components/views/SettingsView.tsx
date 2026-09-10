import React, { useState } from 'react';
import {
  Settings,
  Clock,
  Target,
  User,
  Trash2,
  Plus,
  Download,
  Database,
  Check,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { DAYS_OF_WEEK } from '../../constants/defaults';
import { FixedRoutineItem, UserObjective } from '../../types';

export const SettingsView: React.FC = () => {
  const { user, profile, updateUserProfile, signOut } = useAuth();
  const {
    routine,
    saveRoutineItem,
    deleteRoutineItem,
    objectives,
    saveObjective,
    deleteObjective,
    tasks,
    dailyLogs,
    journalEntries,
    categories,
    seedDemoData,
  } = useApp();

  // Profile Form
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [primaryGoal, setPrimaryGoal] = useState(profile?.primaryGoal || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // New Routine Item Form
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDay, setRoutineDay] = useState<number>(1);
  const [routineStart, setRoutineStart] = useState('07:30');
  const [routineEnd, setRoutineEnd] = useState('12:50');
  const [routineIntensity, setRoutineIntensity] = useState<'light' | 'moderate' | 'heavy'>('heavy');

  // New Objective Form
  const [showObjModal, setShowObjModal] = useState(false);
  const [objTitle, setObjTitle] = useState('');
  const [objDesc, setObjDesc] = useState('');
  const [objTargetDate, setObjTargetDate] = useState('');

  // Status flags
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      displayName: displayName.trim(),
      primaryGoal: primaryGoal.trim(),
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitle.trim()) return;

    await saveRoutineItem({
      title: routineTitle.trim(),
      dayOfWeek: routineDay,
      startTime: routineStart,
      endTime: routineEnd,
      intensity: routineIntensity,
    });

    setRoutineTitle('');
    setShowRoutineModal(false);
  };

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objTitle.trim()) return;

    await saveObjective({
      title: objTitle.trim(),
      description: objDesc.trim() || undefined,
      targetDate: objTargetDate || undefined,
      active: true,
    });

    setObjTitle('');
    setObjDesc('');
    setObjTargetDate('');
    setShowObjModal(false);
  };

  const handleExportData = () => {
    const fullBackup = {
      exportDate: new Date().toISOString(),
      user: { email: user?.email, name: profile?.displayName },
      tasks,
      routine,
      objectives,
      dailyLogs,
      journalEntries,
      categories,
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meu-norte-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div id="settings-view-container" className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-900" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configurações e Rotina</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Personalize seu perfil, defina seus horários fixos e cadastre seus objetivos maiores.
        </p>
      </div>

      {/* Profile Section */}
      <section className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <User className="w-5 h-5 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">Perfil Pessoal</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome ou Apelido
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Cadastrado
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Objetivo Principal Vigente
            </label>
            <input
              type="text"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="Ex.: ENEM 2026, Estágio, Hábitos saudáveis..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Perfil atualizado com sucesso!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </section>

      {/* Routine Section (Tempo Já Comprometido) */}
      <section className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Rotina Fixa (Tempo Comprometido)</h2>
              <p className="text-[11px] text-slate-500">
                Compromissos fixos que consomem energia e definem os dias pesados.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRoutineModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>

        {routine.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Nenhum compromisso fixo cadastrado. Adicione seus horários de aula, curso ou esportes.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {routine.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{item.title}</span>
                    {item.intensity === 'heavy' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                        Pesado
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {DAYS_OF_WEEK[item.dayOfWeek]?.full} • {item.startTime} às {item.endTime}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteRoutineItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Major Objectives (Objetivos Maiores) */}
      <section className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Objetivos Maiores</h2>
              <p className="text-[11px] text-slate-500">
                O propósito por trás das suas metas diárias (ENEM, vestibulares, leitura).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowObjModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Objetivo</span>
          </button>
        </div>

        {objectives.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Nenhum objetivo maior cadastrado. Adicione um objetivo para dar direção às suas tarefas.
          </p>
        ) : (
          <div className="space-y-2.5">
            {objectives.map((obj) => (
              <div
                key={obj.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{obj.title}</h3>
                  {obj.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{obj.description}</p>
                  )}
                  {obj.targetDate && (
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Data-alvo: {obj.targetDate}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteObjective(obj.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Backup & Demo Data */}
      <section className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Database className="w-5 h-5 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">Gerenciamento de Dados e Demonstração</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Exportar Cópia Completa (JSON)</span>
            <span className="text-[11px] text-slate-500">
              Baixe todas as suas tarefas, diários, relatórios e rotinas em um único arquivo.
            </span>
          </div>
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Backup</span>
          </button>
        </div>

        {/* Demo data seeding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
          <div>
            <span className="text-xs font-bold text-indigo-950 block">
              Carregar Dados de Exemplo Realistas (ENEM / Rotina)
            </span>
            <span className="text-[11px] text-indigo-800">
              Insere tarefas concretas de Matemática, Redação, histórico de sono e reflexões para testar todos os gráficos e relatórios.
            </span>
          </div>
          <button
            id="seed-demo-btn"
            type="button"
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Carregando...' : 'Carregar Exemplo'}</span>
          </button>
        </div>

        {seedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
            ✨ Dados de demonstração carregados e sincronizados com sucesso no Firestore!
          </div>
        )}
      </section>

      {/* Logout button */}
      <div className="pt-4 flex justify-center">
        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Encerrar Sessão no Meu Norte</span>
        </button>
      </div>

      {/* Routine Item Modal */}
      {showRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Adicionar Compromisso Fixo</h3>
            <form onSubmit={handleCreateRoutine} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                  placeholder="Ex.: Escola, Cursinho, Natação..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Dia da Semana</label>
                  <select
                    value={routineDay}
                    onChange={(e) => setRoutineDay(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.index} value={d.index}>
                        {d.full}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Impacto de Energia</label>
                  <select
                    value={routineIntensity}
                    onChange={(e) => setRoutineIntensity(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="heavy">Pesado (escola/trabalho)</option>
                    <option value="moderate">Moderado</option>
                    <option value="light">Leve</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Início</label>
                  <input
                    type="time"
                    value={routineStart}
                    onChange={(e) => setRoutineStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fim</label>
                  <input
                    type="time"
                    value={routineEnd}
                    onChange={(e) => setRoutineEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoutineModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Objective Modal */}
      {showObjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Novo Objetivo Maior</h3>
            <form onSubmit={handleCreateObjective} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objetivo *</label>
                <input
                  type="text"
                  required
                  value={objTitle}
                  onChange={(e) => setObjTitle(e.target.value)}
                  placeholder="Ex.: Passar no ENEM, Ler 12 livros..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={objDesc}
                  onChange={(e) => setObjDesc(e.target.value)}
                  placeholder="Ex.: Foco em Medicina ou 900+ na redação"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Data-Alvo (opcional)</label>
                <input
                  type="date"
                  value={objTargetDate}
                  onChange={(e) => setObjTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowObjModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Criar Objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

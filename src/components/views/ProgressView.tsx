import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Moon,
  Zap,
  Tag,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../../contexts/AppContext';
import { detectBehavioralPatterns } from '../../services/insightsEngine';
import { getTodayString } from '../../utils/dateUtils';

export const ProgressView: React.FC = () => {
  const { tasks, dailyLogs, routine } = useApp();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const incompleteTasks = tasks.filter((t) => t.status === 'not_completed');
  const plannedTasks = tasks.filter((t) => t.status === 'planned');

  const overallRate =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Patterns from engine
  const { patterns, hasEnoughData, message } = detectBehavioralPatterns(
    tasks,
    routine,
    dailyLogs
  );

  // Group by category for chart
  const categoryMap: Record<string, { total: number; completed: number }> = {};
  tasks.forEach((t) => {
    const cat = t.category || 'Geral';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, completed: 0 };
    categoryMap[cat].total += 1;
    if (t.status === 'completed') categoryMap[cat].completed += 1;
  });

  const categoryChartData = Object.entries(categoryMap).map(([name, val]) => ({
    name,
    Concluídas: val.completed,
    Total: val.total,
  }));

  // Non-completion reasons breakdown
  const reasonMap: Record<string, number> = {};
  incompleteTasks.forEach((t) => {
    const r = t.failureReason || 'Não especificado';
    reasonMap[r] = (reasonMap[r] || 0) + 1;
  });

  const reasonChartData = Object.entries(reasonMap).map(([name, count]) => ({
    name,
    count,
  }));

  // Sleep & Energy trend over recent logs (up to 7 days)
  const recentLogs = [...dailyLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const wellnessChartData = recentLogs.map((l) => ({
    date: l.date.substring(5), // MM-DD
    sono: l.sleepHours || null,
    energia: l.energy || null,
    humor: l.mood || null,
  }));

  const COLORS = ['#2563eb', '#db2777', '#16a34a', '#7c3aed', '#ea580c', '#0891b2', '#64748b'];

  return (
    <div id="progress-view-container" className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Progresso e Padrões</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evolução realista focada em aprendizado pessoal, nunca em cobrança ou culpa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
            Conclusão Geral: {overallRate}%
          </div>
        </div>
      </div>

      {/* Behavioral Patterns & Insights Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl text-white shadow-md space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h2 className="text-sm font-bold tracking-wide">Padrões Observados pelo Sistema</h2>
        </div>

        {!hasEnoughData ? (
          <p className="text-xs text-slate-300 leading-relaxed">
            {message || 'O sistema precisa de mais alguns dias de histórico para identificar correlações confiáveis entre sono, dias pesados e execução.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {patterns.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs space-y-1"
              >
                <div className="text-xs font-bold text-amber-300">{p.title}</div>
                <p className="text-xs text-slate-200 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key Metric Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Registrado
          </span>
          <span className="text-2xl font-bold text-slate-900">{totalTasks}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">metas no sistema</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            Concluídas
          </span>
          <span className="text-2xl font-bold text-emerald-700">{completedTasks.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">metas alcançadas</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block mb-1">
            Planejadas
          </span>
          <span className="text-2xl font-bold text-blue-700">{plannedTasks.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">aguardando o dia</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block mb-1">
            Replanejadas
          </span>
          <span className="text-2xl font-bold text-amber-700">{incompleteTasks.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">ajustadas com calma</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Metas por Matéria / Categoria</h3>
            <span className="text-xs text-slate-400">Total vs Concluídas</span>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Sem dados de tarefas ainda.
            </div>
          ) : (
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="Total" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Concluídas" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Wellness & Sleep Trend */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Sono e Energia Recentes</h3>
            <span className="text-xs text-slate-400">Horas de sono vs Energia</span>
          </div>

          {wellnessChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Registre sono e energia na tela correspondente para ver a correlação.
            </div>
          ) : (
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wellnessChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="sono" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} name="Sono (h)" />
                  <Line type="monotone" dataKey="energia" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Energia (1-5)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Failure Reasons Breakdown */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/90 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Motivos de Replanejamento Mais Frequentes</h3>
        <p className="text-xs text-slate-500">
          Identificar onde o atrito acontece permite que você e o algoritmo ajustem os dias mais carregados.
        </p>

        {reasonChartData.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Nenhum motivo registrado até o momento. Excelente!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {reasonChartData.map((r, i) => (
              <div
                key={r.name}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-700">{r.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold">
                  {r.count}x
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Lightbulb,
  Moon,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { generateWeeklyReport, formatReportForAI } from '../../services/insightsEngine';
import { getWeekDays, getTodayString } from '../../utils/dateUtils';

export const ReportsView: React.FC = () => {
  const { tasks, dailyLogs, routine } = useApp();
  const [referenceDate, setReferenceDate] = useState<string>(getTodayString());
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const weekDays = getWeekDays(referenceDate);
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[6].date;

  const report = generateWeeklyReport(weekDays, tasks, dailyLogs, routine);

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

  const handlePrint = () => {
    window.print();
  };

  const handleCopyForAI = async () => {
    const text = formatReportForAI(report);
    await navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const topCompletedCats = [...report.categoryDistribution]
    .filter((c) => c.completed > 0)
    .sort((a, b) => b.completed - a.completed);

  const strugglingCats = [...report.categoryDistribution]
    .filter((c) => c.completed < c.count)
    .sort((a, b) => b.count - b.completed - (a.count - a.completed));

  return (
    <div id="reports-view-container" className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Relatório Semanal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Balanço equilibrado com métricas, padrões de sono e recomendações acionáveis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Week navigator */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 text-xs font-semibold text-slate-700">
              {weekStart} a {weekEnd}
            </span>
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
            id="copy-for-ai-btn"
            type="button"
            onClick={handleCopyForAI}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Copiar texto estruturado para colar no ChatGPT ou outra IA"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Exportar para IA / ChatGPT</span>
              </>
            )}
          </button>

          <button
            id="print-report-btn"
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Title bar */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Meu Norte • Relatório Pessoal
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Período: {weekStart} a {weekEnd}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Direção e Rendimento da Semana</h2>
        </div>

        {/* Executive Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Planejadas
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {report.plannedCount}
            </span>
            <span className="text-[10px] text-slate-400">metas na semana</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Concluídas
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              {report.completedCount}
            </span>
            <span className="text-[10px] text-slate-400">metas alcançadas</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Taxa de Conclusão
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {report.completionRate}%
            </span>
            <span className="text-[10px] text-slate-400">do volume planejado</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
              Média de Sono
            </span>
            <span className="text-2xl font-bold text-indigo-700 mt-1 block">
              {report.avgSleep ? `${report.avgSleep}h` : '–'}
            </span>
            <span className="text-[10px] text-slate-400">por noite</span>
          </div>
        </div>

        {/* Category Breakdown Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              🏆 Matérias Mais Concluídas
            </div>
            {topCompletedCats.length === 0 ? (
              <p className="text-xs text-emerald-700">Sem conclusões registradas nesta semana.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {topCompletedCats.map((c) => (
                  <span
                    key={c.category}
                    className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-semibold text-xs"
                  >
                    {c.category}: {c.completed}/{c.count}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              ⚠️ Matérias Mais Adiadas ou Negligenciadas
            </div>
            {strugglingCats.length === 0 ? (
              <p className="text-xs text-amber-700">Nenhum acúmulo de tarefas pendentes identificado.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {strugglingCats.map((c) => (
                  <span
                    key={c.category}
                    className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-semibold text-xs"
                  >
                    {c.category} ({c.count - c.completed} pendentes)
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top reasons for non-completion */}
        {report.topReasons.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Motivos de Não Conclusão Mais Frequentes Nesta Semana
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.topReasons.map((item) => (
                <span
                  key={item.reason}
                  className="px-3 py-1 bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200"
                >
                  • {item.reason} ({item.count}x)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Insights & Recommendations */}
        <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm font-bold tracking-wide">
              Padrões Observados e Recomendações
            </h3>
          </div>

          <div className="space-y-2.5">
            {report.insights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 border border-white/10 text-xs leading-relaxed text-slate-100"
              >
                <span className="w-5 h-5 shrink-0 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-[11px]">
                  {i + 1}
                </span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

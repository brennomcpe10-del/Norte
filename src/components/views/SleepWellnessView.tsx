import React, { useState } from 'react';
import { Moon, Sun, Zap, Heart, AlertCircle, Save, Sparkles, Clock, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { getTodayString, formatDateToPtBR } from '../../utils/dateUtils';
import { calculateSleepHours } from '../../utils/dateUtils';

export const SleepWellnessView: React.FC = () => {
  const { todayLog, saveDailyLog, dailyLogs, tasks, todayDate } = useApp();

  const [date, setDate] = useState(todayDate);
  const [bedTime, setBedTime] = useState(todayLog?.bedTime || '23:00');
  const [wakeTime, setWakeTime] = useState(todayLog?.wakeTime || '06:30');
  const [sleepQuality, setSleepQuality] = useState<number>(todayLog?.sleepQuality || 3);
  const [energy, setEnergy] = useState<number>(todayLog?.energy || 3);
  const [mood, setMood] = useState<number>(todayLog?.mood || 3);
  const [stress, setStress] = useState<number>(todayLog?.stress || 2);
  const [notes, setNotes] = useState(todayLog?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auto calculate sleep hours
  const calculatedHours = calculateSleepHours(bedTime, wakeTime);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await saveDailyLog({
        date,
        bedTime,
        wakeTime,
        sleepHours: calculatedHours,
        sleepQuality,
        energy,
        mood,
        stress,
        notes: notes.trim() || undefined,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Correlation analysis
  const logsWithShortSleep = dailyLogs.filter((l) => (l.sleepHours || 0) < 6);
  const datesShortSleep = new Set(logsWithShortSleep.map((l) => l.date));
  const tasksOnShortSleep = tasks.filter((t) => t.plannedDate && datesShortSleep.has(t.plannedDate));
  const incompleteOnShortSleep = tasksOnShortSleep.filter((t) => t.status === 'not_completed');

  const shortSleepCorrelationText =
    tasksOnShortSleep.length > 3
      ? `Em dias com menos de 6 horas de sono, você registrou ${incompleteOnShortSleep.length} replanejamentos. Priorizar seu sono é o maior acelerador de foco.`
      : 'O sistema comparará automaticamente a taxa de conclusão de metas em dias de sono curto com dias de descanso pleno.';

  return (
    <div id="sleep-wellness-container" className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Moon className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sono e Bem-Estar</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Descanso adequado é a base de qualquer rotina de estudos sustentável.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* Correlation Insight */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 leading-relaxed">
          <span className="font-semibold block mb-0.5">Correlação Sono x Execução:</span>
          {shortSleepCorrelationText}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        {/* Sleep times */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            1. Horários de Sono
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 block mb-1">Hora de Dormir</span>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="w-full text-base font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 block mb-1">Hora de Acordar</span>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full text-base font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-center text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Tempo Total Calculado</span>
              <span className="text-2xl font-bold text-slate-900 mt-1">{calculatedHours} horas</span>
            </div>
          </div>
        </div>

        {/* Quality, Energy, Mood, Stress Sliders / Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sleep Quality */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">Qualidade do Sono</span>
              <span className="text-xs font-bold text-slate-900">{sleepQuality}/5</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSleepQuality(val)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    sleepQuality === val
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Muito ruim</span>
              <span>Excelente</span>
            </div>
          </div>

          {/* Energy */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Nível de Energia
              </span>
              <span className="text-xs font-bold text-slate-900">{energy}/5</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEnergy(val)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    energy === val
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Sem energia</span>
              <span>Disposição total</span>
            </div>
          </div>

          {/* Mood */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Humor e Disposição
              </span>
              <span className="text-xs font-bold text-slate-900">{mood}/5</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMood(val)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    mood === val
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Desanimado</span>
              <span>Excelente</span>
            </div>
          </div>

          {/* Stress */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">Nível de Estresse</span>
              <span className="text-xs font-bold text-slate-900">{stress}/5</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStress(val)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    stress === val
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Tranquilo</span>
              <span>Muito tenso</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Observações sobre o sono ou corpo (opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: Acordei no meio da noite, tomei café tarde, dor de cabeça leve..."
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" />
              Salvo com sucesso!
            </span>
          )}
          <button
            id="save-wellness-btn"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Registro de Bem-estar'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { Compass, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

export const OnboardingModal: React.FC = () => {
  const { user, profile, updateUserProfile } = useAuth();
  const { saveObjective, saveRoutineItem } = useApp();

  const [step, setStep] = useState<number>(1);
  const [nickname, setNickname] = useState(profile?.displayName || user?.displayName || '');
  const [routineType, setRoutineType] = useState<'morning_school' | 'afternoon_school' | 'flexible'>('morning_school');
  const [primaryGoal, setPrimaryGoal] = useState('Preparação para o ENEM');
  const [isSaving, setIsSaving] = useState(false);

  // If already onboarded, don't show
  if (!user || profile?.onboarded) return null;

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // 1. Update user profile
      await updateUserProfile({
        displayName: nickname || 'Usuário',
        onboarded: true,
        primaryGoal: primaryGoal.trim() || undefined,
      });

      // 2. Setup standard initial routine if not already there
      if (routineType === 'morning_school') {
        for (let day = 1; day <= 5; day++) {
          await saveRoutineItem({
            title: 'Escola / Manhã',
            dayOfWeek: day,
            startTime: '07:30',
            endTime: '12:50',
            intensity: 'heavy',
          });
        }
      } else if (routineType === 'afternoon_school') {
        for (let day = 1; day <= 5; day++) {
          await saveRoutineItem({
            title: 'Escola / Tarde',
            dayOfWeek: day,
            startTime: '13:00',
            endTime: '18:20',
            intensity: 'heavy',
          });
        }
      }

      // 3. Setup primary goal as major objective
      if (primaryGoal.trim()) {
        await saveObjective({
          title: `🎯 ${primaryGoal.trim()}`,
          description: 'Objetivo principal cadastrado no início da jornada',
          active: true,
        });
      }
    } catch (err) {
      console.error('Error finishing onboarding:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="onboarding-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div id="onboarding-card" className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Configuração Inicial</h2>
              <p className="text-xs text-slate-500">Apenas 3 perguntas rápidas para calibrar seu ritmo.</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200/70 text-slate-700 rounded-full">
            Passo {step} de 3
          </span>
        </div>

        {/* Step contents */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Como você prefere ser chamado(a)?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Seu nome ou apelido para personalizar as orientações diárias.
                </p>
              </div>
              <input
                id="onboarding-name-input"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex.: Maria, Lucas, etc."
                className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!nickname.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all shadow-xs"
              >
                <span>Avançar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Qual é a sua rotina fixa padrão?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Isso ajuda o algoritmo a não sobrecarregar dias em que você já tem compromissos longos.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setRoutineType('morning_school')}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    routineType === 'morning_school'
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-sm text-slate-800">Escola / Cursinho de Manhã</div>
                  <div className="text-xs text-slate-500">Segunda a Sexta (aprox. 07:30 às 13:00)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRoutineType('afternoon_school')}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    routineType === 'afternoon_school'
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-sm text-slate-800">Escola / Cursinho de Tarde</div>
                  <div className="text-xs text-slate-500">Segunda a Sexta (aprox. 13:00 às 18:30)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRoutineType('flexible')}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    routineType === 'flexible'
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-sm text-slate-800">Horários flexíveis / Estudos em casa</div>
                  <div className="text-xs text-slate-500">Configurarei horários específicos depois</div>
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs"
                >
                  <span>Avançar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Qual é o seu objetivo principal atual?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Opcional. Pode ser ENEM, vestibulares, leitura, aprovação escolar ou rotina pessoal.
                </p>
              </div>

              <input
                type="text"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                placeholder="Ex.: Preparação para o ENEM 2026, Passar em Medicina, etc."
                className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              />

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600">
                💡 Você poderá alterar todos estes dados, matérias e rotinas a qualquer momento em <strong>Configurações</strong>.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Voltar
                </button>
                <button
                  id="finish-onboarding-btn"
                  type="button"
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all shadow-xs"
                >
                  <span>{isSaving ? 'Salvando...' : 'Ir para o Meu Norte'}</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

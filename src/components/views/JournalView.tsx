import React, { useState } from 'react';
import { BookOpen, Plus, Calendar, Save, Trash2, Sparkles, Heart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { getTodayString, formatDateToPtBR } from '../../utils/dateUtils';
import { JournalEntry } from '../../types';

export const JournalView: React.FC = () => {
  const { journalEntries, saveJournalEntry, deleteJournalEntry, todayDate } = useApp();

  const [date, setDate] = useState(todayDate);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Check if an entry for the selected date already exists
  const existingTodayEntry = journalEntries.find((e) => e.date === todayDate);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      await saveJournalEntry({
        id: selectedEntry?.id,
        date,
        content: content.trim(),
        mood,
      });
      setContent('');
      setSelectedEntry(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setDate(entry.date);
    setContent(entry.text);
    setMood(entry.mood);
  };

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setDate(todayDate);
    setContent('');
    setMood(undefined);
  };

  return (
    <div id="journal-view-container" className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Diário Pessoal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Escreva poucas linhas sobre como foi seu dia. 2 ou 3 frases para clareza mental.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewEntry}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Escrever Hoje</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Form */}
        <div className="lg:col-span-2 space-y-4">
          <form
            onSubmit={handleSave}
            className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                />
              </div>

              {/* Mood chips */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 mr-1">Humor:</span>
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setMood(level)}
                    className={`w-6 h-6 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                      mood === level
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Como foi seu dia hoje?
              </label>
              <textarea
                id="journal-content-textarea"
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Exemplo: Hoje o rendimento de manhã foi ótimo em Matemática. À tarde senti mais cansaço, mas consegui ler 20 páginas. Amanhã quero focar em descansar mais cedo..."
                className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 leading-relaxed placeholder:text-slate-400 resize-y"
              />
            </div>

            {/* Guiding calm prompts */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>
                Ideias para anotar: O que deu certo? O que atrapalhou? O que você aprendeu sobre o seu ritmo hoje?
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              {selectedEntry && (
                <button
                  type="button"
                  onClick={async () => {
                    await deleteJournalEntry(selectedEntry.id);
                    handleNewEntry();
                  }}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir registro</span>
                </button>
              )}
              <div className="ml-auto flex items-center gap-2">
                {selectedEntry && (
                  <button
                    type="button"
                    onClick={handleNewEntry}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  id="save-journal-btn"
                  type="submit"
                  disabled={isSaving || !content.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Reflexão'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* History of entries */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Histórico de Registros</h2>

          {journalEntries.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-400">
              Nenhuma anotação anterior. Seu diário começará assim que você salvar a primeira reflexão.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {journalEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleSelectEntry(entry)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {formatDateToPtBR(entry.date)}
                      </span>
                      {entry.mood && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Humor {entry.mood}/5
                        </span>
                      )}
                    </div>
                    <p className={`text-xs line-clamp-3 leading-relaxed ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                      {entry.text}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

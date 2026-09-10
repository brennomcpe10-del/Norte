import { CategoryItem, FailureReason, FixedRoutineItem } from '../types';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-matematica', name: 'Matemática', color: '#2563eb', isDefault: true },
  { id: 'cat-redacao', name: 'Redação', color: '#db2777', isDefault: true },
  { id: 'cat-biologia', name: 'Biologia', color: '#16a34a', isDefault: true },
  { id: 'cat-fisica', name: 'Física', color: '#7c3aed', isDefault: true },
  { id: 'cat-quimica', name: 'Química', color: '#ea580c', isDefault: true },
  { id: 'cat-historia', name: 'História', color: '#b45309', isDefault: true },
  { id: 'cat-geografia', name: 'Geografia', color: '#0d9488', isDefault: true },
  { id: 'cat-linguagens', name: 'Linguagens', color: '#4f46e5', isDefault: true },
  { id: 'cat-enem', name: 'ENEM', color: '#dc2626', isDefault: true },
  { id: 'cat-leitura', name: 'Leitura', color: '#0891b2', isDefault: true },
  { id: 'cat-pessoal', name: 'Pessoal', color: '#64748b', isDefault: true },
];

export const FAILURE_REASONS: FailureReason[] = [
  'Faltou tempo',
  'Estava cansado',
  'Tive outra atividade',
  'Surgiu um imprevisto',
  'Não estava com cabeça',
  'Procrastinei',
  'A tarefa estava mais difícil do que imaginei',
  'Esqueci',
  'Outro',
];

export const DAYS_OF_WEEK = [
  { index: 0, short: 'Dom', full: 'Domingo' },
  { index: 1, short: 'Seg', full: 'Segunda-feira' },
  { index: 2, short: 'Ter', full: 'Terça-feira' },
  { index: 3, short: 'Qua', full: 'Quarta-feira' },
  { index: 4, short: 'Qui', full: 'Quinta-feira' },
  { index: 5, short: 'Sex', full: 'Sexta-feira' },
  { index: 6, short: 'Sáb', full: 'Sábado' },
];

export const DEFAULT_INITIAL_ROUTINE: Omit<FixedRoutineItem, 'id'>[] = [
  { dayOfWeek: 1, title: 'Escola / Turno Matutino', startTime: '07:30', endTime: '12:50', intensity: 'heavy' },
  { dayOfWeek: 2, title: 'Escola / Turno Matutino', startTime: '07:30', endTime: '12:50', intensity: 'heavy' },
  { dayOfWeek: 3, title: 'Escola / Turno Matutino', startTime: '07:30', endTime: '12:50', intensity: 'heavy' },
  { dayOfWeek: 4, title: 'Escola / Turno Matutino', startTime: '07:30', endTime: '12:50', intensity: 'heavy' },
  { dayOfWeek: 5, title: 'Escola / Turno Matutino', startTime: '07:30', endTime: '12:50', intensity: 'heavy' },
];

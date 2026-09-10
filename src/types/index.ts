export type TaskStatus = 'inbox' | 'planned' | 'completed' | 'not_completed';

export type FailureReason =
  | 'Faltou tempo'
  | 'Estava cansado'
  | 'Tive outra atividade'
  | 'Surgiu um imprevisto'
  | 'Não estava com cabeça'
  | 'Procrastinei'
  | 'A tarefa estava mais difícil do que imaginei'
  | 'Esqueci'
  | 'Outro';

export interface UserTask {
  id: string;
  title: string;
  category: string;
  status: TaskStatus;
  plannedDate?: string; // YYYY-MM-DD
  completedAt?: string; // ISO string
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  objectiveId?: string;
  isRecurring?: boolean;
  recurrenceRule?: 'weekly' | 'daily' | 'biweekly';
  recurrenceParentId?: string;
  failureReason?: FailureReason;
  failureNotes?: string;
  originalPlannedDate?: string;
  postponedCount?: number;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FixedRoutineItem {
  id: string;
  title: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime?: string; // "07:30"
  endTime?: string; // "13:00"
  intensity: 'heavy' | 'moderate' | 'light';
  notes?: string;
}

export interface DailyLog {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  bedTime?: string; // "23:00"
  wakeTime?: string; // "07:00"
  sleepHours?: number;
  sleepQuality?: number; // 1 (ruim) to 5 (excelente)
  stress?: number; // 1 (baixo) to 5 (alto)
  energy?: number; // 1 (muito baixa) to 5 (excelente)
  mood?: number; // 1 (péssimo) to 5 (muito bem)
  overload?: number; // 1 (tranquilo) to 5 (sobrecarregado)
  badDayActive?: boolean;
  badDayReason?: string;
  notes?: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title?: string;
  text: string;
  content?: string;
  mood?: number; // 1 to 5
  createdAt: string;
  updatedAt: string;
}

export interface UserObjective {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  color?: string;
  active: boolean;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  onboarded: boolean;
  primaryGoal?: string;
  targetWeeklyCapacity?: number; // estimated realistic tasks per week
  createdAt: string;
  updatedAt?: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isGuest?: boolean;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface WeeklyReportSummary {
  weekId: string;
  startDate: string;
  endDate: string;
  plannedCount: number;
  completedCount: number;
  incompleteCount: number;
  completionRate: number;
  topReasons: { reason: string; count: number }[];
  categoryDistribution: { category: string; count: number; completed: number }[];
  avgSleep: number | null;
  avgEnergy: number | null;
  avgMood: number | null;
  insights: string[];
  createdAt: string;
}

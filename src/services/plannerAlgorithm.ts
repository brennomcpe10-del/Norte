import { FixedRoutineItem, UserTask } from '../types';
import { getDayOfWeekIndex } from '../utils/dateUtils';

export interface PlanSuggestionResult {
  assignments: { taskId: string; assignedDate: string }[];
  overflowTaskIds: string[];
  explanation: string;
  isOverloaded: boolean;
  totalTasksToPlan: number;
  assignedCount: number;
}

export interface DayCapacity {
  date: string;
  dayIndex: number;
  maxTasks: number;
  currentCount: number;
  intensity: 'heavy' | 'moderate' | 'light';
}

/**
 * Calculates realistic daily capacity based on user's fixed commitments and historical trends.
 */
export function calculateWeekCapacities(
  weekDays: { date: string; dayIndex: number }[],
  routine: FixedRoutineItem[],
  existingTasks: UserTask[],
  historicalAvgPerDay?: Record<number, number>
): Record<string, DayCapacity> {
  const capacities: Record<string, DayCapacity> = {};

  weekDays.forEach(({ date, dayIndex }) => {
    // Check routine for that day
    const dayRoutines = routine.filter((r) => r.dayOfWeek === dayIndex);
    const hasHeavy = dayRoutines.some((r) => r.intensity === 'heavy');
    const hasModerate = dayRoutines.some((r) => r.intensity === 'moderate');

    let intensity: 'heavy' | 'moderate' | 'light' = 'light';
    let baseCapacity = 4; // realistic ceiling for healthy, humane day

    if (hasHeavy) {
      intensity = 'heavy';
      baseCapacity = 2; // on heavy school/work days, 2 concrete tasks is sustainable
    } else if (hasModerate) {
      intensity = 'moderate';
      baseCapacity = 3;
    } else if (dayIndex === 0) {
      // Sunday default: gentle planning / rest day
      intensity = 'light';
      baseCapacity = 2;
    }

    // If historical completion exists for this weekday, softly blend it
    if (historicalAvgPerDay && historicalAvgPerDay[dayIndex] !== undefined) {
      const hist = historicalAvgPerDay[dayIndex];
      if (hist > 0) {
        baseCapacity = Math.min(baseCapacity, Math.max(1, Math.round(hist)));
      }
    }

    // Count tasks already firmly planned for this date
    const currentCount = existingTasks.filter(
      (t) => t.plannedDate === date && t.status !== 'not_completed'
    ).length;

    capacities[date] = {
      date,
      dayIndex,
      maxTasks: baseCapacity,
      currentCount,
      intensity,
    };
  });

  return capacities;
}

/**
 * Deterministic, humane planning distribution
 */
export function distributeWeeklyTasks(
  tasksToDistribute: UserTask[],
  weekDays: { date: string; dayIndex: number }[],
  routine: FixedRoutineItem[],
  existingTasks: UserTask[],
  historicalAvgPerDay?: Record<number, number>
): PlanSuggestionResult {
  const capacities = calculateWeekCapacities(weekDays, routine, existingTasks, historicalAvgPerDay);

  // Score and sort tasks by urgency without asking user for manual difficulty/priority:
  // 1. Due date proximity
  // 2. Previously postponed tasks (need attention so they don't stagnate)
  // 3. Category diversity
  const sortedTasks = [...tasksToDistribute].sort((a, b) => {
    // 1. Due dates first
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // 2. Previously postponed tasks
    const aPostponed = a.postponedCount || 0;
    const bPostponed = b.postponedCount || 0;
    if (aPostponed !== bPostponed) {
      return bPostponed - aPostponed;
    }

    // 3. Creation date
    return a.createdAt.localeCompare(b.createdAt);
  });

  const assignments: { taskId: string; assignedDate: string }[] = [];
  const overflowTaskIds: string[] = [];

  // Track slots available per day
  const slotsRemaining: Record<string, number> = {};
  weekDays.forEach(({ date }) => {
    const cap = capacities[date];
    slotsRemaining[date] = Math.max(0, cap.maxTasks - cap.currentCount);
  });

  // Calculate total available capacity
  const totalSlots = Object.values(slotsRemaining).reduce((acc, val) => acc + val, 0);

  for (const task of sortedTasks) {
    let targetDate: string | null = null;

    // If task has a due date within this week, try to place it on or before the due date
    if (task.dueDate) {
      const eligibleDays = weekDays.filter((d) => d.date <= task.dueDate!);
      // find eligible day before deadline with available slot, preferring days with lower current load
      const candidate = eligibleDays
        .filter((d) => slotsRemaining[d.date] > 0)
        .sort((a, b) => (slotsRemaining[b.date] || 0) - (slotsRemaining[a.date] || 0))[0];

      if (candidate) {
        targetDate = candidate.date;
      }
    }

    // If no deadline or deadline match full, pick best day with space
    if (!targetDate) {
      // Pick day with largest remaining slot, avoiding Sunday if others have slots
      const candidateDays = weekDays
        .filter((d) => slotsRemaining[d.date] > 0)
        .sort((a, b) => {
          // Keep Sunday light if possible
          if (a.dayIndex === 0 && b.dayIndex !== 0) return 1;
          if (b.dayIndex === 0 && a.dayIndex !== 0) return -1;
          return slotsRemaining[b.date] - slotsRemaining[a.date];
        });

      if (candidateDays.length > 0) {
        targetDate = candidateDays[0].date;
      }
    }

    if (targetDate) {
      assignments.push({ taskId: task.id, assignedDate: targetDate });
      slotsRemaining[targetDate] -= 1;
    } else {
      overflowTaskIds.push(task.id);
    }
  }

  const isOverloaded = overflowTaskIds.length > 0;
  let explanation = '';

  if (isOverloaded) {
    explanation = `Esta semana está acima da sua capacidade habitual e saudável. Distribuímos realisticamente ${assignments.length} tarefas prioritárias respeitando sua rotina fixa. As outras ${overflowTaskIds.length} tarefas foram mantidas na Caixa de Entrada para evitar sobrecarga.`;
  } else {
    explanation = `Distribuição equilibrada gerada com sucesso (${assignments.length} tarefas distribuídas respeitando os dias mais pesados da sua rotina).`;
  }

  return {
    assignments,
    overflowTaskIds,
    explanation,
    isOverloaded,
    totalTasksToPlan: tasksToDistribute.length,
    assignedCount: assignments.length,
  };
}

/**
 * "Hoje não estou bem" (Bad Day) task reduction
 * Intelligently picks 1 or 2 core tasks to keep, gentle rest for the rest
 */
export function filterTasksForBadDay(todayTasks: UserTask[]): {
  essentialTaskIds: string[];
  restTaskIds: string[];
  reasonMessage: string;
} {
  const pending = todayTasks.filter((t) => t.status === 'planned');

  if (pending.length <= 1) {
    return {
      essentialTaskIds: pending.map((t) => t.id),
      restTaskIds: [],
      reasonMessage: 'Você já possui uma carga mínima para hoje. Faça no seu ritmo.',
    };
  }

  // Sort by urgency:
  // 1. Has due date today or tomorrow
  // 2. High postponed count
  const sorted = [...pending].sort((a, b) => {
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return (b.postponedCount || 0) - (a.postponedCount || 0);
  });

  // Keep at most 1 or 2 essential tasks
  const essentialCount = Math.min(2, Math.max(1, Math.floor(pending.length / 2)));
  const essentialTaskIds = sorted.slice(0, essentialCount).map((t) => t.id);
  const restTaskIds = sorted.slice(essentialCount).map((t) => t.id);

  return {
    essentialTaskIds,
    restTaskIds,
    reasonMessage: `Carga reduzida para ${essentialCount} tarefa(s) essencial(is). As outras ${restTaskIds.length} tarefas foram preservadas para replanejamento posterior sem cobrança.`,
  };
}

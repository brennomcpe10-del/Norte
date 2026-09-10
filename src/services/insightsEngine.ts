import { DailyLog, FixedRoutineItem, UserTask, WeeklyReportSummary } from '../types';
import { DAYS_OF_WEEK } from '../constants/defaults';
import { getDayOfWeekIndex } from '../utils/dateUtils';

export interface HabitPattern {
  id: string;
  type: 'day_of_week' | 'routine_overload' | 'category_friction' | 'sleep_performance' | 'general';
  title: string;
  description: string;
  confidence: 'high' | 'moderate' | 'preliminary';
}

export function detectBehavioralPatterns(
  allTasks: UserTask[],
  routine: FixedRoutineItem[],
  dailyLogs: DailyLog[]
): { patterns: HabitPattern[]; hasEnoughData: boolean; message?: string } {
  // We need at least ~7-10 closed tasks (completed or not_completed) to establish genuine patterns
  const closedTasks = allTasks.filter(
    (t) => t.status === 'completed' || t.status === 'not_completed' || (t.postponedCount || 0) > 0
  );

  if (closedTasks.length < 6) {
    return {
      patterns: [],
      hasEnoughData: false,
      message: 'O sistema ainda está observando sua rotina. Com mais algumas tarefas e dias registrados, começaremos a destacar seus padrões reais.',
    };
  }

  const patterns: HabitPattern[] = [];

  // 1. Pattern: Day of week completion rate
  const dayStats: Record<number, { total: number; completed: number; postponed: number }> = {};
  for (let i = 0; i < 7; i++) {
    dayStats[i] = { total: 0, completed: 0, postponed: 0 };
  }

  allTasks.forEach((task) => {
    const dateRef = task.plannedDate || task.originalPlannedDate;
    if (!dateRef) return;
    const dayIdx = getDayOfWeekIndex(dateRef);
    if (task.status === 'completed') {
      dayStats[dayIdx].total += 1;
      dayStats[dayIdx].completed += 1;
    } else if (task.status === 'not_completed') {
      dayStats[dayIdx].total += 1;
    }
    if ((task.postponedCount || 0) > 0) {
      dayStats[dayIdx].postponed += 1;
    }
  });

  // Find day with lowest completion if at least 4 tasks recorded
  let lowestDayIndex = -1;
  let lowestRate = 1;
  let lowestTotal = 0;

  let highestDayIndex = -1;
  let highestRate = 0;
  let highestTotal = 0;

  Object.entries(dayStats).forEach(([dayStr, stats]) => {
    const dayIdx = Number(dayStr);
    if (stats.total >= 3) {
      const rate = stats.completed / stats.total;
      if (rate < lowestRate) {
        lowestRate = rate;
        lowestDayIndex = dayIdx;
        lowestTotal = stats.total;
      }
      if (rate > highestRate && stats.total >= 3) {
        highestRate = rate;
        highestDayIndex = dayIdx;
        highestTotal = stats.total;
      }
    }
  });

  if (lowestDayIndex !== -1 && lowestRate < 0.55 && lowestTotal >= 3) {
    const dayName = DAYS_OF_WEEK[lowestDayIndex]?.full || '';
    patterns.push({
      id: 'pattern-low-day',
      type: 'day_of_week',
      title: `Ritmo reduzido às ${dayName}s`,
      description: `Você costuma concluir menos tarefas às ${dayName}s (${Math.round(lowestRate * 100)}% de conclusão). Considerar planejar menos itens para este dia.`,
      confidence: lowestTotal >= 6 ? 'high' : 'moderate',
    });
  }

  if (highestDayIndex !== -1 && highestDayIndex !== lowestDayIndex && highestRate >= 0.75 && highestTotal >= 3) {
    const dayName = DAYS_OF_WEEK[highestDayIndex]?.full || '';
    patterns.push({
      id: 'pattern-high-day',
      type: 'day_of_week',
      title: `Alta fluidez às ${dayName}s`,
      description: `Suas ${dayName}s apresentam excelente taxa de execução (${Math.round(highestRate * 100)}%). É um dia propício para metas mais estruturadas.`,
      confidence: highestTotal >= 6 ? 'high' : 'moderate',
    });
  }

  // 2. Pattern: Correlation with heavy routine days
  const heavyDays = new Set(routine.filter((r) => r.intensity === 'heavy').map((r) => r.dayOfWeek));
  if (heavyDays.size > 0) {
    let heavyDayTasks = 0;
    let heavyDayCompleted = 0;

    allTasks.forEach((task) => {
      const dateRef = task.plannedDate || task.originalPlannedDate;
      if (!dateRef) return;
      const dayIdx = getDayOfWeekIndex(dateRef);
      if (heavyDays.has(dayIdx)) {
        if (task.status === 'completed') {
          heavyDayTasks += 1;
          heavyDayCompleted += 1;
        } else if (task.status === 'not_completed') {
          heavyDayTasks += 1;
        }
      }
    });

    if (heavyDayTasks >= 4 && heavyDayCompleted / heavyDayTasks < 0.5) {
      patterns.push({
        id: 'pattern-heavy-routine',
        type: 'routine_overload',
        title: 'Carga em dias de compromisso intenso',
        description: 'Você costuma subestimar o cansaço em dias com compromissos pesados (escola/curso). O algoritmo agora recomenda manter no máximo 1 a 2 tarefas nesses dias.',
        confidence: 'high',
      });
    }
  }

  // 3. Pattern: Category friction / postponement
  const categoryStats: Record<string, { total: number; postponed: number; incomplete: number }> = {};
  allTasks.forEach((t) => {
    if (!t.category) return;
    if (!categoryStats[t.category]) {
      categoryStats[t.category] = { total: 0, postponed: 0, incomplete: 0 };
    }
    categoryStats[t.category].total += 1;
    if ((t.postponedCount || 0) > 0) {
      categoryStats[t.category].postponed += (t.postponedCount || 1);
    }
    if (t.status === 'not_completed') {
      categoryStats[t.category].incomplete += 1;
    }
  });

  Object.entries(categoryStats).forEach(([catName, st]) => {
    if (st.total >= 3 && (st.postponed >= 2 || st.incomplete / st.total >= 0.5)) {
      patterns.push({
        id: `pattern-cat-${catName}`,
        type: 'category_friction',
        title: `Atrito frequente com ${catName}`,
        description: `Tarefas de ${catName} costumam ser adiadas ou não concluídas com maior frequência. Experimente definir objetivos menores e mais específicos nesta matéria.`,
        confidence: 'moderate',
      });
    }
  });

  // 4. Pattern: Sleep & Energy relation
  const logsWithSleep = dailyLogs.filter((l) => (l.sleepHours || 0) > 0);
  if (logsWithSleep.length >= 4) {
    const avgSleep = logsWithSleep.reduce((sum, l) => sum + (l.sleepHours || 0), 0) / logsWithSleep.length;
    // Check days with sleep >= 7h vs sleep < 7h
    let highSleepCompleted = 0;
    let highSleepTotal = 0;
    let lowSleepCompleted = 0;
    let lowSleepTotal = 0;

    dailyLogs.forEach((log) => {
      const tasksOnDate = allTasks.filter((t) => t.plannedDate === log.date);
      const done = tasksOnDate.filter((t) => t.status === 'completed').length;
      const total = tasksOnDate.filter((t) => t.status === 'completed' || t.status === 'not_completed').length;

      if ((log.sleepHours || 0) >= 7) {
        highSleepCompleted += done;
        highSleepTotal += total;
      } else if ((log.sleepHours || 0) > 0 && (log.sleepHours || 0) < 6.5) {
        lowSleepCompleted += done;
        lowSleepTotal += total;
      }
    });

    if (highSleepTotal >= 3 && lowSleepTotal >= 3) {
      const highRate = highSleepCompleted / highSleepTotal;
      const lowRate = lowSleepCompleted / lowSleepTotal;

      if (highRate - lowRate >= 0.2) {
        patterns.push({
          id: 'pattern-sleep-boost',
          type: 'sleep_performance',
          title: 'Impacto direto das noites de sono',
          description: `Seu ritmo de realização foi visivelmente superior (+${Math.round((highRate - lowRate) * 100)}%) nos dias em que dormiu 7h ou mais (média geral: ${avgSleep.toFixed(1)}h).`,
          confidence: 'high',
        });
      }
    }
  }

  return {
    patterns,
    hasEnoughData: patterns.length > 0,
    message: patterns.length === 0 ? 'Padrões em consolidação. Conforme mais tarefas forem concluídas, novos insights aparecerão aqui.' : undefined,
  };
}

/**
 * Generate weekly summary report data
 */
export function generateWeeklyReport(
  weekDays: { date: string }[],
  allTasks: UserTask[],
  dailyLogs: DailyLog[],
  routine: FixedRoutineItem[]
): WeeklyReportSummary {
  const datesSet = new Set(weekDays.map((w) => w.date));
  const weekTasks = allTasks.filter((t) => t.plannedDate && datesSet.has(t.plannedDate));

  const completedTasks = weekTasks.filter((t) => t.status === 'completed');
  const incompleteTasks = weekTasks.filter((t) => t.status === 'not_completed');
  const plannedCount = weekTasks.length;
  const completedCount = completedTasks.length;
  const incompleteCount = incompleteTasks.length;
  const completionRate = plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0;

  // Reasons breakdown
  const reasonCounts: Record<string, number> = {};
  incompleteTasks.forEach((t) => {
    const r = t.failureReason || 'Não informado';
    reasonCounts[r] = (reasonCounts[r] || 0) + 1;
  });
  const topReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  // Categories breakdown
  const catCounts: Record<string, { count: number; completed: number }> = {};
  weekTasks.forEach((t) => {
    const c = t.category || 'Geral';
    if (!catCounts[c]) catCounts[c] = { count: 0, completed: 0 };
    catCounts[c].count += 1;
    if (t.status === 'completed') catCounts[c].completed += 1;
  });
  const categoryDistribution = Object.entries(catCounts).map(([category, st]) => ({
    category,
    count: st.count,
    completed: st.completed,
  }));

  // Sleep & Wellness
  const weekLogs = dailyLogs.filter((l) => datesSet.has(l.date));
  const sleepLogs = weekLogs.filter((l) => (l.sleepHours || 0) > 0);
  const avgSleep =
    sleepLogs.length > 0
      ? Number((sleepLogs.reduce((sum, l) => sum + (l.sleepHours || 0), 0) / sleepLogs.length).toFixed(1))
      : null;

  const energyLogs = weekLogs.filter((l) => (l.energy || 0) > 0);
  const avgEnergy =
    energyLogs.length > 0
      ? Number((energyLogs.reduce((sum, l) => sum + (l.energy || 0), 0) / energyLogs.length).toFixed(1))
      : null;

  const moodLogs = weekLogs.filter((l) => (l.mood || 0) > 0);
  const avgMood =
    moodLogs.length > 0
      ? Number((moodLogs.reduce((sum, l) => sum + (l.mood || 0), 0) / moodLogs.length).toFixed(1))
      : null;

  // Generate automated observations
  const insights: string[] = [];
  if (plannedCount > 0) {
    if (completionRate >= 75) {
      insights.push(`Excelente taxa de conclusão semanal (${completionRate}%). O volume planejado esteve compatível com sua rotina.`);
    } else if (completionRate <= 50) {
      insights.push(`A taxa de conclusão nesta semana foi de ${completionRate}%. O volume planejado pode ter sido superior ao tempo disponível real.`);
    } else {
      insights.push(`Semana com ritmo estável (${completionRate}% das tarefas concluídas).`);
    }
  }

  if (topReasons.length > 0) {
    insights.push(`O principal motivo de tarefas não concluídas foi "${topReasons[0].reason}" (${topReasons[0].count}x).`);
  }

  if (avgSleep !== null) {
    if (avgSleep < 6.5) {
      insights.push(`Média de sono reduzida (${avgSleep}h/noite). Noites curtas costumam refletir em maior cansaço nos dias seguintes.`);
    } else {
      insights.push(`Média de sono saudável registrada (${avgSleep}h/noite).`);
    }
  }

  const startDate = weekDays[0]?.date || '';
  const endDate = weekDays[weekDays.length - 1]?.date || '';

  return {
    weekId: `week-${startDate}`,
    startDate,
    endDate,
    plannedCount,
    completedCount,
    incompleteCount,
    completionRate,
    topReasons,
    categoryDistribution,
    avgSleep,
    avgEnergy,
    avgMood,
    insights,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Format report for copying into ChatGPT or plain text
 */
export function formatReportForAI(summary: WeeklyReportSummary): string {
  return `=== RELATÓRIO SEMANAL: MEU NORTE ===
Período: ${summary.startDate} a ${summary.endDate}

1. VISÃO GERAL DE EXECUÇÃO
- Tarefas planejadas: ${summary.plannedCount}
- Tarefas concluídas: ${summary.completedCount}
- Tarefas não concluídas: ${summary.incompleteCount}
- Taxa de conclusão: ${summary.completionRate}%

2. BEM-ESTAR E ROTINA
- Média de sono: ${summary.avgSleep ? `${summary.avgSleep} horas/noite` : 'Não registrado'}
- Nível de energia médio: ${summary.avgEnergy ? `${summary.avgEnergy}/5` : 'Não registrado'}
- Humor médio: ${summary.avgMood ? `${summary.avgMood}/5` : 'Não registrado'}

3. MOTIVOS DE NÃO CONCLUSÃO
${summary.topReasons.length > 0 ? summary.topReasons.map((r) => `- ${r.reason}: ${r.count} ocorrência(s)`).join('\n') : '- Nenhum motivo registrado (todas as tarefas foram concluídas ou não houve pendências).'}

4. DISTRIBUIÇÃO POR MATÉRIA / CATEGORIA
${summary.categoryDistribution.length > 0 ? summary.categoryDistribution.map((c) => `- ${c.category}: ${c.completed}/${c.count} concluídas`).join('\n') : '- Nenhuma tarefa categorizada'}

5. PADRÕES OBSERVADOS
${summary.insights.map((ins) => `- ${ins}`).join('\n')}

====================================
Instrução para a IA:
"Analise este relatório semanal do meu planejador pessoal 'Meu Norte'. Identifique gargalos na minha rotina, sugira ajustes realistas para a próxima semana e proponha como posso manter um ritmo sustentável de estudos/tarefas sem sobrecarga."
`;
}

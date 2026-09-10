export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToPtBR(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });
}

export function getDayOfWeekName(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
}

export function getDayOfWeekIndex(dateString: string): number {
  if (!dateString) return 0;
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay(); // 0 = Domingo, 1 = Segunda, ...
}

export function getWeekDays(referenceDate: string = getTodayString()): { date: string; dayIndex: number; label: string; isToday: boolean }[] {
  const [y, m, d] = referenceDate.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  const dayOfWeek = current.getDay(); // 0 is Sunday
  // Let week start on Sunday or current week's Sunday
  const sunday = new Date(current);
  sunday.setDate(current.getDate() - dayOfWeek);

  const todayStr = getTodayString();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const itemDate = new Date(sunday);
    itemDate.setDate(sunday.getDate() + i);
    const year = itemDate.getFullYear();
    const month = String(itemDate.getMonth() + 1).padStart(2, '0');
    const day = String(itemDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    days.push({
      date: dateStr,
      dayIndex: i,
      label: itemDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' }),
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

export function calculateSleepHours(bedTime?: string, wakeTime?: string): number | undefined {
  if (!bedTime || !wakeTime) return undefined;
  const [bedH, bedM] = bedTime.split(':').map(Number);
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);

  if (isNaN(bedH) || isNaN(bedM) || isNaN(wakeH) || isNaN(wakeM)) return undefined;

  let bedMinutes = bedH * 60 + bedM;
  let wakeMinutes = wakeH * 60 + wakeM;

  if (wakeMinutes < bedMinutes) {
    // crossing midnight
    wakeMinutes += 24 * 60;
  }

  const diffMinutes = wakeMinutes - bedMinutes;
  const hours = Number((diffMinutes / 60).toFixed(1));
  return hours > 0 && hours <= 24 ? hours : undefined;
}

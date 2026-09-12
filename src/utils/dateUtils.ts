export function getTodayString(): string {
  const d = new Date();
  return formatDateKey(d);
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatFriendlyDate(dateStr: string): string {
  const todayStr = getTodayString();
  const date = parseDateKey(dateStr);
  const today = parseDateKey(todayStr);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(dateStr: string): string {
  const date = parseDateKey(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function shiftDate(dateStr: string, daysOffset: number): string {
  const d = parseDateKey(dateStr);
  d.setDate(d.getDate() + daysOffset);
  return formatDateKey(d);
}

export function getDaysList(centerDateStr: string, pastDays = 14, futureDays = 7): string[] {
  const dates: string[] = [];
  for (let i = -pastDays; i <= futureDays; i++) {
    dates.push(shiftDate(centerDateStr, i));
  }
  return dates;
}

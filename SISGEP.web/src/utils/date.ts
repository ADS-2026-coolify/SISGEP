const millisecondsPerDay = 24 * 60 * 60 * 1000;
const saoPauloDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getCalendarDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = saoPauloDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export function getInclusiveCalendarDays(start: string | Date, end: string | Date): number {
  const startKey = getCalendarDateKey(start);
  const endKey = getCalendarDateKey(end);
  const startDay = Date.parse(`${startKey}T00:00:00Z`);
  const endDay = Date.parse(`${endKey}T00:00:00Z`);

  return Math.max(1, Math.floor((endDay - startDay) / millisecondsPerDay) + 1);
}

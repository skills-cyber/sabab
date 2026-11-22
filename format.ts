import { format, parseISO, differenceInCalendarDays } from 'date-fns';

/** Prototype "today" — Monday, 2 Nov 2026 (Sun–Thu school week, Fri/Sat weekend). */
export const TODAY = '2026-11-02';
export const NOW_TIME = '10:05';

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export function toBnDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatBDT(amount: number, bn = false): string {
  const s = `৳${Math.round(amount).toLocaleString('en-IN')}`;
  return bn ? toBnDigits(s) : s;
}

export function formatDate(iso: string, pattern = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function daysFromToday(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), parseISO(TODAY));
}

export function relativeDay(iso: string): string {
  const d = daysFromToday(iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d > 1) return `In ${d} days`;
  return `${Math.abs(d)} days ago`;
}

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round(part / total * 100);
}

export function isValidBdPhone(phone: string): boolean {
  return /^(\+?880)?01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ''));
}

export function initials(name: string): string {
  return name.
  replace(/^(Md\.|Dr\.|Prof\.|Maulana|Alhaj)\s+/i, '').
  split(' ').
  slice(0, 2).
  map((p) => p[0]).
  join('').
  toUpperCase();
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function nowStamp(): string {
  return `${formatDate(TODAY)} · ${format(new Date(), 'HH:mm')}`;
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
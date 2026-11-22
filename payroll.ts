import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import type { SalaryStructure } from '../types/staff';

/** Sun–Thu school days in a month (Fri/Sat weekend). */
export function workingDaysIn(month: string): number {
  const start = parseISO(`${month}-01`);
  return eachDayOfInterval({ start: startOfMonth(start), end: endOfMonth(start) }).filter((d) => d.getDay() !== 5 && d.getDay() !== 6).length;
}

/** Sun–Thu days between two ISO dates (inclusive), optionally clipped to a month. */
export function workingDaysBetween(from: string, to: string, month?: string): number {
  if (!from || !to || to < from) return 0;
  let s = parseISO(from);
  let e = parseISO(to);
  if (month) {
    const ms = startOfMonth(parseISO(`${month}-01`));
    const me = endOfMonth(ms);
    if (e < ms || s > me) return 0;
    if (s < ms) s = ms;
    if (e > me) e = me;
  }
  return eachDayOfInterval({ start: s, end: e }).filter((d) => d.getDay() !== 5 && d.getDay() !== 6).length;
}

export const monthLabel = (month: string) => format(parseISO(`${month}-01`), 'MMM yyyy');

export const allowanceTotal = (s: SalaryStructure) => s.allowances.reduce((t, l) => t + l.amount, 0);
export const deductionTotal = (s: SalaryStructure) => s.deductions.reduce((t, l) => t + l.amount, 0);
export const grossOf = (s: SalaryStructure) => s.basic + allowanceTotal(s);

export function nextMonth(month: string): string {
  const d = parseISO(`${month}-01`);
  d.setMonth(d.getMonth() + 1);
  return format(d, 'yyyy-MM');
}
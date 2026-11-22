import type { Concession } from '../types/concessions';
import type { FeeHead } from '../types/finance';
import type { Student } from '../types/school';
import { gradeOf } from './fees';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'Dec 2026' → '2026-12'. Returns '' when the label can't be parsed. */
export function periodToMonth(period: string): string {
  const [m, y] = period.split(' ');
  const i = MONTHS.indexOf(m?.slice(0, 3));
  return i >= 0 && /^\d{4}$/.test(y ?? '') ? `${y}-${String(i + 1).padStart(2, '0')}` : '';
}

export function monthToLabel(month: string): string {
  const [y, m] = month.split('-');
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

export function tuitionFor(student: Student | undefined, heads: FeeHead[]): number {
  if (!student) return 0;
  return heads.find((h) => h.id === 'TUI')?.amounts[String(gradeOf(student.sectionId))] ?? 0;
}

/** ৳ per month this concession takes off tuition (never more than the tuition itself). */
export function concessionAmount(c: Pick<Concession, 'basis' | 'value'>, tuition: number): number {
  const raw = c.basis === 'percent' ? Math.round(tuition * c.value / 100) : c.value;
  return Math.max(0, Math.min(tuition, raw));
}

export function concessionActiveIn(c: Concession, month: string): boolean {
  return c.status === 'approved' && c.from <= month && (!c.to || c.to >= month);
}
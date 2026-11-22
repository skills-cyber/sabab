import { parseISO, getDay } from 'date-fns';
import type { Day, TimetableCell } from '../types/academic';
import { routineGrid, teacherAllocation } from '../data/timetable';
import { sections } from '../data/school';

export const DAYS: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
export const DAY_LABEL: Record<Day, string> = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday' };

export function roomFor(sectionId: string, subjectId: string): string {
  if (subjectId === 'ICT') return 'LAB-ICT';
  if (subjectId === 'PE') return 'FIELD';
  return sections.find((s) => s.id === sectionId)?.room ?? 'R201';
}

export function buildTimetable(): TimetableCell[] {
  const cells: TimetableCell[] = [];
  routineGrid.forEach((row) => {
    row.subjects.forEach((subjectId, i) => {
      cells.push({
        id: `${row.sectionId}-${row.day}-${i + 1}`,
        sectionId: row.sectionId,
        day: row.day,
        period: i + 1,
        subjectId,
        teacherId: teacherAllocation[row.sectionId]?.[subjectId] ?? 'T01',
        roomId: roomFor(row.sectionId, subjectId)
      });
    });
  });
  return cells;
}

export interface Clash {
  id: string;
  day: Day;
  period: number;
  kind: 'teacher' | 'room';
  resourceId: string;
  cellIds: string[];
}

export function detectClashes(cells: TimetableCell[]): Clash[] {
  const clashes: Clash[] = [];
  const groups = new Map<string, TimetableCell[]>();
  cells.forEach((c) => {
    const tk = `teacher|${c.teacherId}|${c.day}|${c.period}`;
    const rk = `room|${c.roomId}|${c.day}|${c.period}`;
    groups.set(tk, [...(groups.get(tk) ?? []), c]);
    if (c.roomId !== 'FIELD') groups.set(rk, [...(groups.get(rk) ?? []), c]);
  });
  groups.forEach((list, key) => {
    if (list.length > 1) {
      const [kind, resourceId, day, period] = key.split('|');
      clashes.push({ id: key, kind: kind as Clash['kind'], resourceId, day: day as Day, period: Number(period), cellIds: list.map((c) => c.id) });
    }
  });
  return clashes;
}

export interface SlotCheck {
  sectionId: string;
  day: Day;
  period: number;
  teacherId: string;
  roomId: string;
  excludeId?: string;
}

/** Returns human-readable conflicts for a proposed slot (empty = clear). */
export function checkSlot(cells: TimetableCell[], check: SlotCheck, extra: TimetableCell[] = []): string[] {
  const all = [...cells, ...extra].filter((c) => c.id !== check.excludeId && c.day === check.day && c.period === check.period);
  const issues: string[] = [];
  const t = all.find((c) => c.teacherId === check.teacherId);
  if (t) issues.push(`Teacher already teaching ${sectionLabel(t.sectionId)} ${t.subjectId} at this time`);
  const r = all.find((c) => c.roomId === check.roomId && check.roomId !== 'FIELD');
  if (r) issues.push(`Room in use by ${sectionLabel(r.sectionId)} ${r.subjectId}`);
  const s = all.find((c) => c.sectionId === check.sectionId);
  if (s) issues.push(`${sectionLabel(s.sectionId)} already has ${s.subjectId} in this period`);
  return issues;
}

export function sectionLabel(id: string): string {
  const known = sections.find((s) => s.id === id)?.label;
  if (known) return known;
  // Sections added later (Settings / promotion) use `${grade}${letter}` or `${grade}U` for Uttara.
  const uttara = /^(\d{1,2})U$/.exec(id);
  if (uttara) return `${uttara[1]}-A (Uttara)`;
  const m = /^(\d{1,2})([A-Z])$/.exec(id);
  return m ? `${m[1]}-${m[2]}` : id;
}

export function dayOfDate(iso: string): Day | null {
  const map: Array<Day | null> = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', null, null];
  return map[getDay(parseISO(iso))];
}
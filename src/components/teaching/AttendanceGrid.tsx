import React from 'react';
import { CheckCheck, RotateCcw } from 'lucide-react';
import type { AttendanceMark } from '../../types/academic';
import type { Student } from '../../types/school';
import { cn } from '../../utils/cn';

const MARKS: Array<{id: AttendanceMark;label: string;full: string;cls: string;}> = [
{ id: 'P', label: 'P', full: 'Present', cls: 'bg-success text-white dark:text-background border-success' },
{ id: 'A', label: 'A', full: 'Absent', cls: 'bg-danger text-white dark:text-background border-danger' },
{ id: 'L', label: 'L', full: 'Late', cls: 'bg-warning text-white dark:text-background border-warning' },
{ id: 'LV', label: 'Lv', full: 'On leave', cls: 'bg-info text-white dark:text-background border-info' }];


interface AttendanceGridProps {
  students: Student[];
  value: Record<string, AttendanceMark>;
  onChange: (v: Record<string, AttendanceMark>) => void;
  disabled?: boolean;
}

/** Bulk-first period attendance: one tap marks everyone present, then tap exceptions. Large touch targets on mobile. */
export function AttendanceGrid({ students, value, onChange, disabled }: AttendanceGridProps) {
  const counts = MARKS.map((m) => ({ ...m, n: students.filter((s) => value[s.id] === m.id).length }));
  const unmarked = students.filter((s) => !value[s.id]).length;
  const setAll = () => onChange(Object.fromEntries(students.map((s) => [s.id, value[s.id] && value[s.id] !== 'P' ? value[s.id] : 'P'])) as Record<string, AttendanceMark>);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" disabled={disabled} onClick={setAll} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
          <CheckCheck className="size-4" /> Mark rest present
        </button>
        <button type="button" disabled={disabled} onClick={() => onChange({})} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-[13px] text-muted-foreground hover:bg-muted disabled:opacity-50">
          <RotateCcw className="size-3.5" /> Reset
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs tabular" aria-live="polite">
          {counts.map((c) =>
          <span key={c.id} className="text-muted-foreground"><b className="font-semibold text-foreground">{c.n}</b> {c.full}</span>
          )}
          {unmarked > 0 && <span className="font-medium text-warning">{unmarked} unmarked</span>}
        </div>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
        {students.map((s) =>
        <li key={s.id} className={cn('flex items-center gap-2 rounded-lg border px-2 py-1.5', value[s.id] === 'A' ? 'border-danger/30 bg-danger-bg/50' : value[s.id] === 'L' ? 'border-warning/30 bg-warning-bg/50' : 'border-border')}>
            <span className="w-6 text-right text-xs text-subtle tabular">{s.roll}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{s.name}</span>
            <div className="flex gap-1" role="radiogroup" aria-label={`Attendance for ${s.name}`}>
              {MARKS.map((m) =>
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={value[s.id] === m.id}
              aria-label={m.full}
              title={m.full}
              disabled={disabled}
              onClick={() => onChange({ ...value, [s.id]: m.id })}
              className={cn('grid size-8 place-items-center rounded-md border text-[11px] font-semibold transition-colors sm:size-7', value[s.id] === m.id ? m.cls : 'border-border text-muted-foreground hover:bg-muted')}>
              
                  {m.label}
                </button>
            )}
            </div>
          </li>
        )}
      </ul>
    </div>);

}
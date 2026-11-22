import React from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { Panel } from '../common/Panel';
import type { Student } from '../../types/school';
import { TODAY } from '../../utils/format';
import { cn } from '../../utils/cn';

type Mark = 'P' | 'A' | 'L' | 'H';
const style: Record<Mark, string> = {
  P: 'bg-success-bg text-success',
  A: 'bg-danger-bg text-danger',
  L: 'bg-warning-bg text-warning',
  H: 'bg-muted text-subtle'
};
const label: Record<Mark, string> = { P: 'Present', A: 'Absent', L: 'Late', H: 'Weekend / holiday' };

/** Deterministic 4-week sample history for the linked child (Fri/Sat are weekends). */
function history(child: Student): Array<{date: string;mark: Mark;}> {
  const start = parseISO('2026-10-04');
  return Array.from({ length: 30 }).map((_, i) => {
    const d = addDays(start, i);
    const iso = format(d, 'yyyy-MM-dd');
    const dow = d.getDay();
    if (dow === 5 || dow === 6 || iso === '2026-10-13') return { date: iso, mark: 'H' as Mark };
    const seed = (i * 7 + child.roll * 3) % 23;
    return { date: iso, mark: (seed === 4 && child.attendancePct < 95 ? 'A' : seed === 9 ? 'L' : 'P') as Mark };
  }).filter((x) => x.date <= TODAY);
}

export function ParentAttendance({ child }: {child: Student;}) {
  const days = history(child);
  const school = days.filter((d) => d.mark !== 'H');
  const n = (m: Mark) => school.filter((d) => d.mark === m).length;
  return (
    <Panel title="Attendance" description={`AY 2026: ${child.attendancePct}% · last 4 weeks shown`}>
      <dl className="mb-3 grid grid-cols-3 gap-2 text-center text-[13px]">
        {(['P', 'A', 'L'] as Mark[]).map((m) =>
        <div key={m} className={cn('rounded-md px-2 py-1.5', style[m])}><dt className="text-[11px]">{label[m]}</dt><dd className="font-semibold tabular">{n(m)}</dd></div>
        )}
      </dl>
      <div className="grid grid-cols-7 gap-1" role="list" aria-label="Daily attendance">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d} className="text-center text-[10.5px] text-muted-foreground">{d}</span>)}
        {days.map((d) =>
        <span key={d.date} role="listitem" title={`${format(parseISO(d.date), 'EEE d MMM')}: ${label[d.mark]}`} className={cn('grid h-8 place-items-center rounded-md text-[11px] font-medium tabular', style[d.mark], d.date === TODAY && 'ring-2 ring-primary')}>
            {format(parseISO(d.date), 'd')}
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Absence SMS is sent the same morning when the class teacher confirms the roll call.</p>
    </Panel>);

}
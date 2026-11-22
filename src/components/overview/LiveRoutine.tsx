import React from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../common/Panel';
import { useAcademic } from '../../contexts/AcademicContext';
import { periodSlots, teachers } from '../../data/school';
import { NOW_TIME } from '../../utils/format';
import { sectionLabel } from '../../utils/timetable';
import { cn } from '../../utils/cn';

type CellState = 'delivered' | 'not-logged' | 'uncovered' | 'now' | 'scheduled' | 'substitute';

const legend: Array<{s: CellState;label: string;cls: string;}> = [
{ s: 'delivered', label: 'Delivered', cls: 'bg-success-bg text-success' },
{ s: 'not-logged', label: 'Not logged', cls: 'bg-warning-bg text-warning' },
{ s: 'uncovered', label: 'No teacher', cls: 'bg-danger-bg text-danger' },
{ s: 'substitute', label: 'Substitute', cls: 'bg-info-bg text-info' },
{ s: 'scheduled', label: 'Scheduled', cls: 'bg-muted text-muted-foreground' }];


/** Today (Monday) across sections: what was delivered, what's unlogged, which classes lack a teacher. */
export function LiveRoutine() {
  const { timetable, periods, substitutions } = useAcademic();
  const secs = ['7A', '8A', '8B', '9A'];
  const slots = periodSlots.filter((s) => s.n <= 7);

  const stateOf = (sectionId: string, n: number): {state: CellState;subject: string;} => {
    const cell = timetable.find((c) => c.sectionId === sectionId && c.day === 'Mon' && c.period === n);
    if (!cell) return { state: 'scheduled', subject: '—' };
    const slot = slots.find((s) => s.n === n)!;
    const t = teachers.find((x) => x.id === cell.teacherId);
    const sub = substitutions[cell.id];
    if (t?.status === 'on-leave' && !sub) return { state: 'uncovered', subject: cell.subjectId };
    if (sub) return { state: 'substitute', subject: cell.subjectId };
    if (slot.end > NOW_TIME) return { state: 'scheduled', subject: cell.subjectId };
    const tp = periods.find((p) => p.sectionId === sectionId && p.period === n);
    if (tp && tp.status !== 'submitted') return { state: 'not-logged', subject: cell.subjectId };
    return { state: 'delivered', subject: cell.subjectId };
  };

  return (
    <Panel title="Today's routine · Monday" description={`Live at ${NOW_TIME} · Mirpur sample sections`} actions={<Link to="/timetable" className="text-xs font-medium text-primary hover:underline">Timetable</Link>} flush>
      <div className="overflow-x-auto p-3 scrollbar-thin">
        <table className="w-full min-w-[520px] border-separate border-spacing-1 text-center">
          <thead>
            <tr>
              <th className="w-12" />
              {slots.map((s) =>
              <th key={s.n} scope="col" className="text-[11px] font-medium text-muted-foreground">
                  P{s.n}<span className="block text-[10px] font-normal text-subtle tabular">{s.start}</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {secs.map((sid) =>
            <tr key={sid}>
                <th scope="row" className="text-left text-[12px] font-semibold">{sectionLabel(sid)}</th>
                {slots.map((s) => {
                const { state, subject } = stateOf(sid, s.n);
                const cls = legend.find((l) => l.s === state)?.cls;
                return (
                  <td key={s.n} className={cn('h-8 rounded-md text-[11px] font-medium', cls)} title={`${sectionLabel(sid)} P${s.n} ${subject} · ${legend.find((l) => l.s === state)?.label}`}>
                      {subject}
                    </td>);

              })}
              </tr>
            )}
          </tbody>
        </table>
        <div className="mt-2 flex flex-wrap gap-3 px-1">
          {legend.map((l) =>
          <span key={l.s} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className={cn('size-2.5 rounded-sm', l.cls)} />{l.label}</span>
          )}
        </div>
      </div>
    </Panel>);

}
import React, { useMemo, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { Panel } from '../common/Panel';
import { Segmented } from '../common/Segmented';
import { SelectField } from '../common/SelectField';
import { StatusBadge } from '../common/StatusBadge';
import { useAcademic } from '../../contexts/AcademicContext';
import { courses } from '../../data/academic';
import { periodSlots, subjects, teachers } from '../../data/school';
import { subjectToneClass } from '../../utils/tones';
import { DAYS, sectionLabel } from '../../utils/timetable';
import { TODAY, initials } from '../../utils/format';
import { cn } from '../../utils/cn';

const WEEKS = [
{ id: 'w44', label: 'This week · 1–5 Nov', sunday: '2026-11-01' },
{ id: 'w45', label: 'Next week · 8–12 Nov', sunday: '2026-11-08' }];


/** Week view of the lesson schedule: the topic map is laid onto real routine slots. */
export function WeeklyPlan() {
  const { timetable, topics, progress, periods, makeups, events } = useAcademic();
  const [sectionId, setSectionId] = useState('8B');
  const [weekId, setWeekId] = useState('w44');
  const week = WEEKS.find((w) => w.id === weekId)!;
  const tracked = courses.find((c) => c.sectionId === sectionId && c.syllabusId)!;

  // Lay remaining planned periods of the tracked course onto future routine slots, in order.
  const plannedTopicBySlot = useMemo(() => {
    const queue: string[] = [];
    topics.filter((t) => t.syllabusId === tracked.syllabusId).forEach((t) => {
      const rem = Math.max(0, t.plannedPeriods - (progress[tracked.id]?.[t.id] ?? 0));
      for (let i = 0; i < rem; i++) queue.push(t.id);
    });
    const map: Record<string, string> = {};
    WEEKS.forEach((w) => {
      DAYS.forEach((day, di) => {
        const date = format(addDays(parseISO(w.sunday), di), 'yyyy-MM-dd');
        timetable.filter((c) => c.sectionId === sectionId && c.day === day && c.subjectId === tracked.subjectId).sort((a, b) => a.period - b.period).forEach((c) => {
          const tp = periods.find((p) => p.sectionId === sectionId && p.period === c.period);
          const done = date < TODAY || date === TODAY && tp?.status === 'submitted';
          if (!done && queue.length) map[`${date}-${c.period}`] = queue.shift()!;
        });
      });
    });
    return map;
  }, [topics, progress, tracked, timetable, sectionId, periods]);

  const slots = periodSlots.filter((s) => s.n <= 7);

  return (
    <Panel
      title={`Weekly lesson plan · ${sectionLabel(sectionId)}`}
      description={`${subjects.find((s) => s.id === tracked.subjectId)?.name} topics are auto-laid onto routine slots from the approved topic map`}
      actions={
      <>
          <SelectField size="sm" className="w-24" ariaLabel="Section" value={sectionId} onValueChange={setSectionId} options={['7A', '8A', '8B', '9A'].map((s) => ({ value: s, label: sectionLabel(s) }))} />
          <Segmented ariaLabel="Week" value={weekId} onChange={setWeekId} options={WEEKS.map((w) => ({ value: w.id, label: w.id === 'w44' ? 'This week' : 'Next week' }))} />
        </>
      }
      flush>
      
      <div className="overflow-x-auto p-3 scrollbar-thin">
        <table className="w-full min-w-[860px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-16" />
              {DAYS.map((d, di) => {
                const date = format(addDays(parseISO(week.sunday), di), 'yyyy-MM-dd');
                const evs = events.filter((e) => date >= e.start && date <= e.end);
                return (
                  <th key={d} scope="col" className={cn('rounded-md px-2 py-1 text-left align-top text-xs font-semibold', date === TODAY ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>
                    {d} {format(parseISO(date), 'd MMM')}
                    {evs.map((e) => <span key={e.id} className="mt-0.5 block truncate text-[10px] font-normal">{e.title}</span>)}
                  </th>);

              })}
            </tr>
          </thead>
          <tbody>
            {slots.map((s) =>
            <tr key={s.n}>
                <th scope="row" className="text-left text-[11px] font-medium text-muted-foreground">P{s.n}<span className="block text-[10px] font-normal text-subtle tabular">{s.start}</span></th>
                {DAYS.map((d, di) => {
                const date = format(addDays(parseISO(week.sunday), di), 'yyyy-MM-dd');
                const cell = timetable.find((c) => c.sectionId === sectionId && c.day === d && c.period === s.n);
                if (!cell) return <td key={d} />;
                const subj = subjects.find((x) => x.id === cell.subjectId)!;
                const isTracked = cell.subjectId === tracked.subjectId;
                const topicId = plannedTopicBySlot[`${date}-${s.n}`];
                const topic = topics.find((t) => t.id === topicId);
                const tp = date === TODAY ? periods.find((p) => p.sectionId === sectionId && p.period === s.n) : undefined;
                const missed = makeups.find((m) => m.sectionId === sectionId && m.originalDate === date && m.originalPeriod === s.n);
                return (
                  <td key={d} className={cn('h-14 rounded-md border p-1.5 align-top text-[11px]', subjectToneClass[subj.tone], !isTracked && 'opacity-70')}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold">{subj.short}</span>
                        <span className="text-[10px] opacity-70">{initials(teachers.find((t) => t.id === cell.teacherId)?.name ?? '')}</span>
                      </div>
                      {isTracked && (
                    missed ? <StatusBadge status="missed" className="mt-0.5" /> :
                    tp?.status === 'submitted' ? <StatusBadge status={tp.outcome ?? 'completed'} className="mt-0.5" /> :
                    date < TODAY ? <span className="mt-0.5 block text-[10px] opacity-80">Delivered</span> :
                    topic ? <span className="mt-0.5 line-clamp-2 block leading-tight">{topic.title}</span> :
                    <span className="mt-0.5 block text-[10px] opacity-80">Revision</span>)
                    }
                    </td>);

              })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>);

}
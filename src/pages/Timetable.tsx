import React, { useMemo, useState } from 'react';
import { AlertTriangle, Printer, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { Segmented } from '../components/common/Segmented';
import { SelectField } from '../components/common/SelectField';
import { StatusBadge } from '../components/common/StatusBadge';
import { Notice } from '../components/common/Notice';
import { Button } from '../components/ui/Button';
import { CellEditorDialog } from '../components/timetable/CellEditorDialog';
import { useAcademic } from '../contexts/AcademicContext';
import { useApp } from '../contexts/AppContext';
import { periodSlots, rooms, subjects, teachers } from '../data/school';
import { weeklyRequirement } from '../data/timetable';
import type { TimetableCell } from '../types/academic';
import { DAYS, DAY_LABEL, detectClashes, sectionLabel } from '../utils/timetable';
import { subjectToneClass } from '../utils/tones';
import { initials } from '../utils/format';
import { cn } from '../utils/cn';

type View = 'class' | 'teacher' | 'room';
const SECTIONS = ['7A', '8A', '8B', '9A'];

export function Timetable() {
  const { timetable, substitutions, updateCell } = useAcademic();
  const { role, canApprove } = useApp();
  const [view, setView] = useState<View>(role === 'teacher' ? 'teacher' : 'class');
  const [entity, setEntity] = useState(role === 'teacher' ? 'T01' : '8B');
  const [editing, setEditing] = useState<TimetableCell | null>(null);

  const clashes = useMemo(() => detectClashes(timetable), [timetable]);
  const clashCellIds = new Set(clashes.flatMap((c) => c.cellIds));
  const slots = periodSlots.filter((s) => s.n <= 7);

  const entityOptions = view === 'class' ? SECTIONS.map((s) => ({ value: s, label: sectionLabel(s) })) : view === 'teacher' ? teachers.map((t) => ({ value: t.id, label: t.name })) : rooms.map((r) => ({ value: r.id, label: r.label }));
  const changeView = (v: View) => {
    setView(v);
    setEntity(v === 'class' ? '8B' : v === 'teacher' ? 'T06' : 'LAB-ICT');
  };

  const cellsAt = (day: string, n: number) => timetable.filter((c) => c.day === day && c.period === n && (view === 'class' ? c.sectionId === entity : view === 'teacher' ? c.teacherId === entity : c.roomId === entity));

  const freq = view === 'class' && weeklyRequirement[entity] ?
  Object.entries(weeklyRequirement[entity]).map(([sid, req]) => ({ sid, req, got: timetable.filter((c) => c.sectionId === entity && c.subjectId === sid).length })) :
  [];
  const load = view === 'teacher' ? timetable.filter((c) => c.teacherId === entity).length : 0;
  const teacher = teachers.find((t) => t.id === entity);

  const autoResolve = () => {
    const c = clashes.find((x) => x.kind === 'teacher');
    if (!c) return;
    const target = timetable.find((x) => x.id === c.cellIds[1]);
    if (!target) return;
    const free = teachers.find((t) => t.status === 'active' && t.subjects.includes(target.subjectId) && !timetable.some((x) => x.day === target.day && x.period === target.period && x.teacherId === t.id));
    if (free) {
      updateCell(target.id, { teacherId: free.id, roomId: target.roomId === 'LAB-ICT' ? 'R301' : target.roomId });
      toast.success('Clash resolved', { description: `${sectionLabel(target.sectionId)} ${target.subjectId} ${target.day} P${target.period} → ${free.name}, theory room` });
    } else {
      const swap = timetable.find((x) => x.sectionId === target.sectionId && x.day === target.day && x.id !== target.id && !timetable.some((y) => y.day === x.day && y.period === x.period && y.id !== x.id && y.teacherId === target.teacherId));
      if (swap) {
        updateCell(target.id, { subjectId: swap.subjectId, teacherId: swap.teacherId, roomId: swap.roomId });
        updateCell(swap.id, { subjectId: target.subjectId, teacherId: target.teacherId, roomId: target.roomId });
        toast.success('Clash resolved by swapping periods', { description: `${sectionLabel(target.sectionId)} ${DAY_LABEL[target.day]}: P${target.period} ↔ P${swap.period}` });
      } else toast.error('No automatic fix found — edit the slot manually.');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Routine & Timetable"
        bn="ক্লাস রুটিন"
        description="Published routine v3 · effective 1 Jul 2026 · 7 periods + extra slot · Sun–Thu"
        meta={clashes.length ? <StatusBadge status="behind" label={`${clashes.length} clash${clashes.length > 1 ? 'es' : ''}`} /> : <StatusBadge status="on-track" label="No clashes" />}
        actions={
        <>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
            {canApprove && <Button size="sm" disabled={!clashes.length} onClick={autoResolve}><Sparkles className="size-4" /> Suggest fix</Button>}
          </>
        } />
      
      {!canApprove && <Notice kind="locked">You're viewing the published routine. Ask the coordinator for changes; substitutions and makeups are handled from Cancelled & Makeup.</Notice>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel
          title={view === 'class' ? `Class ${sectionLabel(entity)}` : view === 'teacher' ? teacher?.name : rooms.find((r) => r.id === entity)?.label}
          actions={
          <>
              <Segmented ariaLabel="View by" value={view} onChange={changeView} options={[{ value: 'class', label: 'Class' }, { value: 'teacher', label: 'Teacher' }, { value: 'room', label: 'Room' }]} />
              <SelectField size="sm" className="w-44" ariaLabel="Select" value={entity} onValueChange={setEntity} options={entityOptions} />
            </>
          }
          flush>
          
          <div className="overflow-x-auto p-3 scrollbar-thin">
            <table className="w-full min-w-[820px] border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="w-20" />
                  {slots.map((s) =>
                  <th key={s.n} scope="col" className="rounded-md bg-muted px-2 py-1 text-left text-[11px] font-medium text-muted-foreground">
                      P{s.n} <span className="font-normal text-subtle tabular">{s.start}–{s.end}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d) =>
                <tr key={d}>
                    <th scope="row" className={cn('rounded-md px-2 text-left text-xs font-semibold', d === 'Mon' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}>
                      {DAY_LABEL[d].slice(0, 3)}{d === 'Mon' && <span className="block text-[10px] font-normal">Today</span>}
                    </th>
                    {slots.map((s) => {
                    const cells = cellsAt(d, s.n);
                    if (!cells.length) return <td key={s.n} className="h-14 rounded-md border border-dashed border-border text-center text-[10.5px] text-subtle">Free</td>;
                    const c = cells[0];
                    const subj = subjects.find((x) => x.id === c.subjectId)!;
                    const clash = cells.some((x) => clashCellIds.has(x.id));
                    const t = teachers.find((x) => x.id === c.teacherId);
                    const sub = substitutions[c.id];
                    return (
                      <td key={s.n} className="h-14 p-0">
                          <button
                          type="button"
                          onClick={() => setEditing(c)}
                          className={cn('flex h-full w-full flex-col rounded-md border p-1.5 text-left text-[11px] transition hover:brightness-95', subjectToneClass[subj.tone], clash && 'ring-2 ring-danger ring-offset-1 ring-offset-card')}
                          aria-label={`${DAY_LABEL[d]} P${s.n}: ${subj.name}, ${t?.name}, ${c.roomId}${clash ? ', clash' : ''}`}>
                          
                            <span className="flex items-center justify-between gap-1 font-semibold">
                              {view === 'class' ? subj.short : `${sectionLabel(c.sectionId)} ${subj.short}`}
                              {clash && <AlertTriangle className="size-3 text-danger" />}
                            </span>
                            <span className="truncate opacity-80">
                              {view === 'teacher' ? c.roomId : `${initials(t?.name ?? '')} · ${c.roomId}`}
                              {cells.length > 1 && ` +${cells.length - 1}`}
                            </span>
                            {(sub || t?.status === 'on-leave') && d === 'Mon' &&
                          <span className={cn('mt-auto truncate text-[10px] font-medium', sub ? 'text-info' : 'text-danger')}>{sub ? `Sub: ${teachers.find((x) => x.id === sub)?.name.split(' ')[0]}` : 'Teacher on leave'}</span>
                          }
                          </button>
                        </td>);

                  })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Clashes" description="Detected live from the routine" flush>
            {clashes.length === 0 ?
            <p className="px-4 py-3 text-xs text-success">No teacher or room clashes.</p> :

            <ul className="divide-y divide-border">
                {clashes.map((c) =>
              <li key={c.id} className="px-4 py-2 text-[12.5px]">
                    <p className="font-medium">{c.kind === 'teacher' ? teachers.find((t) => t.id === c.resourceId)?.name : rooms.find((r) => r.id === c.resourceId)?.label}</p>
                    <p className="text-[11.5px] text-muted-foreground">{DAY_LABEL[c.day]} P{c.period} · {c.cellIds.map((id) => sectionLabel(id.split('-')[0])).join(' & ')}</p>
                    <button type="button" className="mt-1 text-xs font-medium text-primary hover:underline" onClick={() => {setView('class');setEntity(c.cellIds[1].split('-')[0]);setEditing(timetable.find((x) => x.id === c.cellIds[1]) ?? null);}}>Open slot</button>
                  </li>
              )}
              </ul>
            }
          </Panel>
          {view === 'class' && freq.length > 0 &&
          <Panel title="Weekly subject frequency" description="Scheduled vs curriculum requirement" flush>
              <ul className="divide-y divide-border">
                {freq.map((f) =>
              <li key={f.sid} className="flex items-center justify-between px-4 py-1.5 text-[12.5px]">
                    <span>{subjects.find((s) => s.id === f.sid)?.name}</span>
                    <span className={cn('tabular', f.got < f.req ? 'font-semibold text-danger' : f.got > f.req ? 'text-info' : 'text-muted-foreground')}>{f.got}/{f.req}{f.got > f.req ? ' +' : f.got < f.req ? ' short' : ''}</span>
                  </li>
              )}
              </ul>
            </Panel>
          }
          {view === 'teacher' && teacher &&
          <Panel title="Workload">
              <p className="text-[13px]"><b className="tabular">{load}</b> of {teacher.maxPeriods} periods/week</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', load > teacher.maxPeriods ? 'bg-danger' : 'bg-primary')} style={{ width: `${Math.min(100, load / teacher.maxPeriods * 100)}%` }} /></div>
              <p className="mt-2 text-xs text-muted-foreground">{teacher.status === 'on-leave' ? 'On leave — all classes need substitutes.' : `${teacher.maxPeriods - load} periods available for substitution.`}</p>
            </Panel>
          }
          <Notice kind="preview">Auto-scheduling (constraint solver) is designed but requires the backend. “Suggest fix” resolves clashes locally by reassigning a free qualified teacher or swapping periods.</Notice>
        </div>
      </div>
      {editing && <CellEditorDialog cell={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />}
    </div>);

}
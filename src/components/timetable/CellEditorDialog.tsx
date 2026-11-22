import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, UserRoundCog, XCircle, CalendarX2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAcademic } from '../../contexts/AcademicContext';
import { useApp } from '../../contexts/AppContext';
import { teacherAllocation } from '../../data/timetable';
import { periodSlots, rooms, subjects, teachers } from '../../data/school';
import type { TimetableCell } from '../../types/academic';
import { DAY_LABEL, checkSlot, sectionLabel } from '../../utils/timetable';
import { TODAY } from '../../utils/format';

export function CellEditorDialog({ cell, open, onOpenChange }: {cell: TimetableCell;open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { timetable, updateCell, substitutions, assignSubstitute, createMakeup } = useAcademic();
  const { canApprove } = useApp();
  const [subjectId, setSubjectId] = useState(cell.subjectId);
  const [teacherId, setTeacherId] = useState(cell.teacherId);
  const [roomId, setRoomId] = useState(cell.roomId);
  const [subId, setSubId] = useState('');

  useEffect(() => {
    if (open) {
      setSubjectId(cell.subjectId);
      setTeacherId(cell.teacherId);
      setRoomId(cell.roomId);
      setSubId(substitutions[cell.id] ?? '');
    }
  }, [open, cell, substitutions]);

  const issues = useMemo(() => checkSlot(timetable, { sectionId: cell.sectionId, day: cell.day, period: cell.period, teacherId, roomId, excludeId: cell.id }), [timetable, cell, teacherId, roomId]);
  const busyAt = (tid: string) => timetable.some((c) => c.id !== cell.id && c.day === cell.day && c.period === cell.period && c.teacherId === tid);
  const freeTeachers = teachers.filter((t) => t.status === 'active' && !busyAt(t.id));
  const slot = periodSlots.find((p) => p.n === cell.period)!;
  const original = teachers.find((t) => t.id === cell.teacherId);
  const changed = subjectId !== cell.subjectId || teacherId !== cell.teacherId || roomId !== cell.roomId;
  const isToday = cell.day === 'Mon';

  const save = () => {
    updateCell(cell.id, { subjectId, teacherId, roomId });
    toast.success('Routine updated', { description: `${sectionLabel(cell.sectionId)} · ${DAY_LABEL[cell.day]} P${cell.period}. Affected teachers notified.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{sectionLabel(cell.sectionId)} · {DAY_LABEL[cell.day]} P{cell.period}</DialogTitle>
          <DialogDescription>{slot.start}–{slot.end} · currently {subjects.find((s) => s.id === cell.subjectId)?.name} with {original?.name}</DialogDescription>
        </DialogHeader>
        {!canApprove && <Notice kind="locked">Read-only. Routine changes are made by the coordinator or principal.</Notice>}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Subject" htmlFor="ce-subj">
            <SelectField id="ce-subj" disabled={!canApprove} value={subjectId} onValueChange={(v) => {setSubjectId(v);const t = teacherAllocation[cell.sectionId]?.[v];if (t) setTeacherId(t);}} options={Object.keys(teacherAllocation[cell.sectionId] ?? {}).map((s) => ({ value: s, label: subjects.find((x) => x.id === s)?.name ?? s }))} />
          </Field>
          <Field label="Teacher" htmlFor="ce-teacher">
            <SelectField id="ce-teacher" disabled={!canApprove} value={teacherId} onValueChange={setTeacherId} options={teachers.map((t) => ({ value: t.id, label: `${t.name}${t.id !== cell.teacherId && busyAt(t.id) ? ' · busy' : ''}${t.status === 'on-leave' ? ' · on leave' : ''}` }))} />
          </Field>
          <Field label="Room" htmlFor="ce-room">
            <SelectField id="ce-room" disabled={!canApprove} value={roomId} onValueChange={setRoomId} options={rooms.map((r) => ({ value: r.id, label: r.label }))} />
          </Field>
        </div>
        <div className={issues.length ? 'rounded-lg border border-danger/30 bg-danger-bg p-3' : 'rounded-lg border border-success/30 bg-success-bg p-3'} aria-live="polite">
          {issues.length ?
          <>
              <ul className="space-y-1 text-[12.5px] text-danger">{issues.map((i) => <li key={i} className="flex gap-1.5"><XCircle className="mt-0.5 size-3.5 shrink-0" />{i}</li>)}</ul>
              <p className="mt-2 text-[11.5px] text-muted-foreground">Free teachers this period: {freeTeachers.slice(0, 5).map((t) => t.name).join(', ') || 'none'}</p>
            </> :

          <p className="flex items-center gap-1.5 text-[12.5px] text-success"><CheckCircle2 className="size-3.5" /> No clashes for this slot.</p>
          }
        </div>

        {isToday && canApprove &&
        <div className="rounded-lg border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold"><UserRoundCog className="size-4 text-primary" /> Substitute for today ({TODAY})</p>
            <div className="flex flex-wrap gap-2">
              <SelectField className="w-60" ariaLabel="Substitute teacher" value={subId} onValueChange={setSubId} placeholder="Choose a free teacher" options={freeTeachers.map((t) => ({ value: t.id, label: t.name }))} />
              <Button size="sm" variant="outline" disabled={!subId} onClick={() => {assignSubstitute(cell.id, subId);toast.success('Substitute assigned', { description: `${teachers.find((t) => t.id === subId)?.name} notified. Counts toward syllabus delivery.` });onOpenChange(false);}}>Assign</Button>
            </div>
          </div>
        }

        <DialogFooter>
          {canApprove &&
          <Button
            variant="outline"
            className="mr-auto text-danger"
            onClick={() => {
              const id = createMakeup({ courseId: `${cell.sectionId}-${cell.subjectId}`, sectionId: cell.sectionId, subjectId: cell.subjectId, teacherId: cell.teacherId, originalDate: TODAY, originalPeriod: cell.period, reason: 'Cancelled from timetable', topicId: '' }, 'Cancelled from timetable — gap recorded');
              toast.warning(`${id} created`, { description: 'Open Cancelled & Makeup to propose a slot.' });
              onOpenChange(false);
            }}>
            
              <CalendarX2 className="size-4" /> Cancel this class
            </Button>
          }
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {canApprove && <Button onClick={save} disabled={!changed || issues.length > 0}>Save change</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
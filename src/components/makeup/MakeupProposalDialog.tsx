import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { useAcademic } from '../../contexts/AcademicContext';
import { periodSlots, rooms, teachers } from '../../data/school';
import type { MakeupRequest, TimetableCell } from '../../types/academic';
import { checkSlot, dayOfDate, sectionLabel } from '../../utils/timetable';
import { formatDate } from '../../utils/format';
import { subjectName } from '../common/SubjectChip';

const DATES = ['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-08', '2026-11-09', '2026-11-11', '2026-11-12'];

/** Propose a makeup slot with live teacher / room / section clash validation. */
export function MakeupProposalDialog({ request, open, onOpenChange }: {request: MakeupRequest;open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { timetable, makeups, proposeMakeup } = useAcademic();
  const original = teachers.find((t) => t.id === request.teacherId);
  const [date, setDate] = useState(DATES[1]);
  const [period, setPeriod] = useState('8');
  const [teacherId, setTeacherId] = useState(original?.status === 'on-leave' ? 'T04' : request.teacherId);
  const [roomId, setRoomId] = useState(request.sectionId === '9A' ? 'R301' : request.sectionId === '8B' ? 'R202' : request.sectionId === '7A' ? 'R105' : 'R201');

  useEffect(() => {
    if (open && request.proposal) {
      setDate(request.proposal.date);
      setPeriod(String(request.proposal.period));
      setTeacherId(request.proposal.teacherId);
      setRoomId(request.proposal.roomId);
    }
  }, [open, request]);

  const day = dayOfDate(date);
  const issues = useMemo(() => {
    if (!day) return ['Selected date is not a school day'];
    const booked: TimetableCell[] = makeups.
    filter((m) => m.id !== request.id && m.proposal && (m.status === 'approved' || m.status === 'proposed') && m.proposal.date === date).
    map((m) => ({ id: m.id, sectionId: m.sectionId, day: m.proposal!.day, period: m.proposal!.period, subjectId: m.subjectId, teacherId: m.proposal!.teacherId, roomId: m.proposal!.roomId }));
    const list = checkSlot(timetable, { sectionId: request.sectionId, day, period: Number(period), teacherId, roomId }, booked);
    if (teachers.find((t) => t.id === teacherId)?.status === 'on-leave') list.unshift('Selected teacher is on leave');
    return list;
  }, [day, date, period, teacherId, roomId, timetable, makeups, request]);

  const submit = () => {
    if (!day || issues.length) return;
    proposeMakeup(request.id, { date, day, period: Number(period), roomId, teacherId });
    toast.success('Makeup proposed', { description: 'Sent to the principal for approval. Guardians are notified after approval.' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Propose makeup · {sectionLabel(request.sectionId)} {subjectName(request.subjectId)}</DialogTitle>
          <DialogDescription>Missed {formatDate(request.originalDate)} P{request.originalPeriod} — {request.reason}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date" htmlFor="mk-date">
            <SelectField id="mk-date" value={date} onValueChange={setDate} options={DATES.map((d) => ({ value: d, label: `${dayOfDate(d)} ${formatDate(d, 'd MMM')}` }))} />
          </Field>
          <Field label="Period" htmlFor="mk-period">
            <SelectField id="mk-period" value={period} onValueChange={setPeriod} options={periodSlots.map((p) => ({ value: String(p.n), label: p.n === 8 ? `Extra · ${p.start}–${p.end}` : `P${p.n} · ${p.start}` }))} />
          </Field>
          <Field label="Teacher" htmlFor="mk-teacher">
            <SelectField id="mk-teacher" value={teacherId} onValueChange={setTeacherId} options={teachers.map((t) => ({ value: t.id, label: `${t.name}${t.status === 'on-leave' ? ' (on leave)' : ''}` }))} />
          </Field>
          <Field label="Room" htmlFor="mk-room">
            <SelectField id="mk-room" value={roomId} onValueChange={setRoomId} options={rooms.map((r) => ({ value: r.id, label: r.label }))} />
          </Field>
        </div>
        <div className={issues.length ? 'rounded-lg border border-danger/30 bg-danger-bg p-3' : 'rounded-lg border border-success/30 bg-success-bg p-3'} role="status" aria-live="polite">
          {issues.length ?
          <ul className="space-y-1 text-[12.5px] text-danger">{issues.map((i) => <li key={i} className="flex gap-1.5"><XCircle className="mt-0.5 size-3.5 shrink-0" />{i}</li>)}</ul> :

          <p className="flex items-center gap-1.5 text-[12.5px] text-success"><CheckCircle2 className="size-3.5" /> No clashes — teacher, room and {sectionLabel(request.sectionId)} are free.</p>
          }
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={issues.length > 0}>Submit for approval</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
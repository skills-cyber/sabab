import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useStaff } from '../../contexts/StaffContext';
import { useAcademic } from '../../contexts/AcademicContext';
import { LEAVE_LABEL, LEAVE_QUOTA, type LeaveType } from '../../types/staff';
import { TODAY } from '../../utils/format';
import { workingDaysBetween } from '../../utils/payroll';

/** Request leave for yourself (or, for leaders/office, on behalf of a staff member). */
export function LeaveRequestDialog({ open, staffId, onOpenChange }: {open: boolean;staffId?: string;onOpenChange: (o: boolean) => void;}) {
  const store = useStaff();
  const { events: calendarEvents } = useAcademic();
  const [f, setF] = useState({ staffId: '', type: 'casual' as LeaveType, from: TODAY, to: TODAY, reason: '', substituteId: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const forSelf = !!store.me && !store.canManage;

  useEffect(() => {
    if (open) {setF({ staffId: staffId ?? store.me?.id ?? '', type: 'casual', from: TODAY, to: TODAY, reason: '', substituteId: '' });setErr({});}
  }, [open, staffId, store.me?.id]);

  const person = store.staff.find((s) => s.id === f.staffId);
  const days = workingDaysBetween(f.from, f.to);
  const used = person ? store.leaveUsed(person.id, f.type) : 0;
  const left = LEAVE_QUOTA[f.type] - used;
  const overlap = person ? store.leaves.find((l) => l.staffId === person.id && (l.status === 'approved' || l.status === 'pending') && l.from <= f.to && l.to >= f.from) : undefined;
  const exams = calendarEvents.filter((e) => e.type === 'exam' && e.start <= f.to && (e.end ?? e.start) >= f.from);

  const save = () => {
    const e: Record<string, string> = {};
    if (!person) e.staffId = 'Choose a staff member.';
    if (f.to < f.from) e.to = 'End date is before start date.';else
    if (days === 0) e.to = 'The range has no school days.';
    if (f.type !== 'unpaid' && days > left) e.type = `Only ${Math.max(0, left)} ${LEAVE_LABEL[f.type].toLowerCase()} day(s) left — choose Unpaid for the rest.`;
    if (f.reason.trim().length < 4) e.reason = 'Give a short reason.';
    if (overlap) e.from = `Overlaps ${overlap.id} (${overlap.status}).`;
    setErr(e);
    if (Object.keys(e).length || !person) return;
    const id = store.requestLeave({ staffId: person.id, type: f.type, from: f.from, to: f.to, reason: f.reason.trim(), substituteId: f.substituteId || undefined });
    toast.success(`${id} sent to the principal`, { description: `${days} school day(s) · ${LEAVE_LABEL[f.type]} leave` });
    onOpenChange(false);
  };

  const subs = store.teachers.filter((t) => t.id !== f.staffId && t.status === 'active' && (!person?.subjects.length || t.subjects.some((s) => person.subjects.includes(s))));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request leave</DialogTitle>
          <DialogDescription>Approved by the principal. Unpaid days are deducted on the salary sheet.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {!forSelf &&
          <Field label="Staff member" required error={err.staffId} htmlFor="lv-staff" className="sm:col-span-2">
              <SelectField id="lv-staff" value={f.staffId} placeholder="Choose staff" onValueChange={(v) => setF({ ...f, staffId: v })} options={store.staff.filter((s) => s.status !== 'resigned').map((s) => ({ value: s.id, label: `${s.name} · ${s.designation}` }))} />
            </Field>
          }
          <Field label="Leave type" error={err.type} htmlFor="lv-type" className="sm:col-span-2" hint={person && f.type !== 'unpaid' ? `${Math.max(0, left)} of ${LEAVE_QUOTA[f.type]} days left this year` : undefined}>
            <SelectField id="lv-type" value={f.type} onValueChange={(v) => setF({ ...f, type: v as LeaveType })} options={(Object.keys(LEAVE_LABEL) as LeaveType[]).map((t) => ({ value: t, label: `${LEAVE_LABEL[t]}${person && t !== 'unpaid' ? ` · ${Math.max(0, LEAVE_QUOTA[t] - store.leaveUsed(person.id, t))} left` : ''}` }))} />
          </Field>
          <Field label="From" error={err.from} htmlFor="lv-from"><Input id="lv-from" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, to: e.target.value > f.to ? e.target.value : f.to })} /></Field>
          <Field label="To" error={err.to} htmlFor="lv-to" hint={days ? `${days} school day(s)` : undefined}><Input id="lv-to" type="date" min={f.from} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
          {person?.kind === 'teaching' &&
          <Field label="Suggested substitute" htmlFor="lv-sub" className="sm:col-span-2">
              <SelectField id="lv-sub" value={f.substituteId || 'none'} onValueChange={(v) => setF({ ...f, substituteId: v === 'none' ? '' : v })} options={[{ value: 'none', label: 'Let the coordinator decide' }, ...subs.map((t) => ({ value: t.id, label: `${t.name} · ${t.subjects.join(', ')}` }))]} />
            </Field>
          }
          <Field label="Reason" required error={err.reason} htmlFor="lv-reason" className="sm:col-span-2"><Textarea id="lv-reason" rows={2} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
        </div>
        {exams.length > 0 && <Notice kind="warning">Overlaps {exams.map((x) => x.title).join(', ')} — leave during exams is usually declined.</Notice>}
        {f.type === 'unpaid' && days > 0 && <Notice kind="info">{days} unpaid day(s) will be deducted from that month’s salary.</Notice>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAcademic } from '../../contexts/AcademicContext';
import type { CalendarEventType } from '../../types/academic';
import { eventTypeMeta } from './eventStyles';

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultDate?: string;
}

export function AddEventDialog({ open, onOpenChange, defaultDate = '2026-11-12' }: AddEventDialogProps) {
  const { addEvent, events } = useAcademic();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEventType>('event');
  const [start, setStart] = useState(defaultDate);
  const [end, setEnd] = useState(defaultDate);
  const [campus, setCampus] = useState('all');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setTitle('');
      setType('event');
      setStart(defaultDate);
      setEnd(defaultDate);
      setCampus('all');
      setErrors({});
    }
  }, [open, defaultDate]);

  const overlaps = events.filter((e) => (e.type === 'exam' || e.type === 'ct') && !(end < e.start || start > e.end));
  const disruptive = (type === 'holiday' || type === 'closure') && overlaps.length > 0;

  const save = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = 'Enter a title.';
    if (!start) e.start = 'Start date required.';
    if (end < start) e.end = 'End must be on or after start.';
    setErrors(e);
    if (Object.keys(e).length) return;
    addEvent({ title: title.trim(), type, start, end, campus });
    toast.success('Event added to calendar', { description: disruptive ? 'Overlaps an assessment window — create a plan revision to reschedule.' : 'Visible to staff; guardians see it if published.' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add calendar event</DialogTitle>
          <DialogDescription>Holidays, closures and events update working-day counts and the syllabus plan.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" required error={errors.title} htmlFor="ev-title" className="sm:col-span-2">
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Inter-school science olympiad" autoFocus />
          </Field>
          <Field label="Type" htmlFor="ev-type">
            <SelectField id="ev-type" value={type} onValueChange={(v) => setType(v as CalendarEventType)} options={(Object.keys(eventTypeMeta) as CalendarEventType[]).filter((t) => t !== 'term').map((t) => ({ value: t, label: eventTypeMeta[t].label }))} />
          </Field>
          <Field label="Campus" htmlFor="ev-campus">
            <SelectField id="ev-campus" value={campus} onValueChange={setCampus} options={[{ value: 'all', label: 'All campuses' }, { value: 'mirpur', label: 'Mirpur' }, { value: 'uttara', label: 'Uttara' }]} />
          </Field>
          <Field label="Start" required error={errors.start} htmlFor="ev-start">
            <Input id="ev-start" type="date" min="2026-01-01" max="2026-12-31" value={start} onChange={(e) => {setStart(e.target.value);if (end < e.target.value) setEnd(e.target.value);}} />
          </Field>
          <Field label="End" required error={errors.end} htmlFor="ev-end">
            <Input id="ev-end" type="date" min={start} max="2026-12-31" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        {disruptive && <Notice kind="warning">Overlaps <b>{overlaps.map((o) => o.title).join(', ')}</b>. Lost periods will appear as syllabus gaps until a plan revision is approved.</Notice>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Add event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
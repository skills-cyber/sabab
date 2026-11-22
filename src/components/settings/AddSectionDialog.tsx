import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useStaff } from '../../contexts/StaffContext';
import { campuses } from '../../data/school';

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

/** Add a section to an existing or new class. New classes get no subjects until you add them. */
export function AddSectionDialog({ open, onOpenChange, onCreated }: {open: boolean;onOpenChange: (o: boolean) => void;onCreated?: (grade: number) => void;}) {
  const store = useStaff();
  const [f, setF] = useState({ grade: '8', letter: '', campusId: 'mirpur', classTeacherId: '', room: '', capacity: '40', stream: '' });
  const [err, setErr] = useState<Record<string, string>>({});

  const grade = Number(f.grade);
  const existing = store.sections.filter((s) => s.grade === grade && !s.archived);
  const nextLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !store.sections.some((s) => s.id === `${grade}${l}`)) ?? 'Z';

  useEffect(() => {
    if (!open) return;
    setErr({});
    setF((p) => ({ ...p, letter: '', classTeacherId: '', room: '', stream: '' }));
  }, [open]);

  const letter = (f.letter || nextLetter).trim().toUpperCase();
  const busyTeachers = new Set(store.sections.filter((s) => !s.archived).map((s) => s.classTeacherId));
  const subjectsDefined = (store.classSubjects[grade] ?? []).length;

  const save = () => {
    const e: Record<string, string> = {};
    const id = `${grade}${letter}`;
    if (!/^[A-Z]$/.test(letter)) e.letter = 'One letter, A–Z.';else
    if (store.sections.some((s) => s.id === id)) e.letter = `${grade}-${letter} already exists.`;
    if (!f.classTeacherId) e.classTeacherId = 'Assign a class teacher.';
    if (!/^R?\d{3}$/i.test(f.room.trim())) e.room = 'Format R101.';else
    if (store.sections.some((s) => !s.archived && s.room.toUpperCase() === f.room.trim().toUpperCase().replace(/^(\d)/, 'R$1'))) e.room = 'Room is already a home room.';
    const cap = Number(f.capacity);
    if (!Number.isInteger(cap) || cap < 10 || cap > 80) e.capacity = '10–80';
    setErr(e);
    if (Object.keys(e).length) return;
    const room = f.room.trim().toUpperCase().startsWith('R') ? f.room.trim().toUpperCase() : `R${f.room.trim()}`;
    store.addSection({ id, label: `${grade}-${letter}`, grade, campusId: f.campusId, classTeacherId: f.classTeacherId, room, capacity: cap, stream: f.stream.trim() || undefined });
    toast.success(`Section ${grade}-${letter} added`, { description: subjectsDefined ? `${subjectsDefined} class ${grade} subjects apply — assign teachers next.` : `Class ${grade} has no subjects yet — add them in “Subjects per class”.` });
    onCreated?.(grade);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add section</DialogTitle>
          <DialogDescription>Pick a class (1–12). Adding the first section of a class creates the class.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Class" htmlFor="as-g"><SelectField id="as-g" value={f.grade} onValueChange={(v) => setF({ ...f, grade: v, letter: '' })} options={GRADES.map((g) => ({ value: String(g), label: `Class ${g}${store.sections.some((s) => s.grade === g && !s.archived) ? '' : ' (new)'}` }))} /></Field>
          <Field label="Section letter" error={err.letter} hint={`Existing: ${existing.map((s) => s.label.split('-')[1]).join(', ') || 'none'}`} htmlFor="as-l"><Input id="as-l" data-autofocus maxLength={1} className="uppercase" value={f.letter} placeholder={nextLetter} onChange={(e) => setF({ ...f, letter: e.target.value })} /></Field>
          <Field label="Campus" htmlFor="as-c"><SelectField id="as-c" value={f.campusId} onValueChange={(v) => setF({ ...f, campusId: v })} options={campuses.map((c) => ({ value: c.id, label: c.name }))} /></Field>
          <Field label="Capacity" error={err.capacity} htmlFor="as-cap"><Input id="as-cap" type="number" min={10} max={80} className="tabular" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
          <Field label="Class teacher" required error={err.classTeacherId} htmlFor="as-ct" className="sm:col-span-2">
            <SelectField id="as-ct" value={f.classTeacherId} placeholder="Choose teacher" onValueChange={(v) => setF({ ...f, classTeacherId: v })}
            options={store.teachers.filter((t) => t.status !== 'resigned').map((t) => ({ value: t.id, label: `${t.name}${busyTeachers.has(t.id) ? ' · already a class teacher' : ''}` }))} />
          </Field>
          <Field label="Home room" required error={err.room} htmlFor="as-r"><Input id="as-r" className="uppercase tabular" value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} placeholder="R105" /></Field>
          {grade >= 9 && <Field label="Group" htmlFor="as-st"><SelectField id="as-st" value={f.stream || 'none'} onValueChange={(v) => setF({ ...f, stream: v === 'none' ? '' : v })} options={[{ value: 'none', label: 'None' }, { value: 'Science', label: 'Science' }, { value: 'Business', label: 'Business Studies' }, { value: 'Humanities', label: 'Humanities' }]} /></Field>}
        </div>
        {f.classTeacherId && busyTeachers.has(f.classTeacherId) && <Notice kind="warning">This teacher is already class teacher of another section.</Notice>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Add section</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { useStaff, type ManagedSubject } from '../../contexts/StaffContext';
import type { SubjectType } from '../../types/staff';
import { subjectToneDot, type SubjectTone } from '../../utils/tones';
import { cn } from '../../utils/cn';

const TONES = Object.keys(subjectToneDot) as SubjectTone[];

/** Add or edit a subject. The short code becomes its permanent ID. */
export function SubjectDialog({ open, editing, onOpenChange }: {open: boolean;editing?: ManagedSubject | null;onOpenChange: (o: boolean) => void;}) {
  const store = useStaff();
  const [f, setF] = useState({ name: '', bn: '', short: '', type: 'Core' as SubjectType, tone: 'teal' as SubjectTone });
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErr({});
    setF(editing ? { name: editing.name, bn: editing.bn, short: editing.short, type: editing.type, tone: editing.tone } : { name: '', bn: '', short: '', type: 'Core', tone: TONES[store.subjects.length % TONES.length] });
  }, [open, editing, store.subjects.length]);

  const save = () => {
    const e: Record<string, string> = {};
    const name = f.name.trim();
    const short = f.short.trim().toUpperCase();
    if (name.length < 2) e.name = 'Name is required.';else
    if (store.subjects.some((s) => s.id !== editing?.id && s.name.toLowerCase() === name.toLowerCase())) e.name = 'A subject with this name exists.';
    if (!/^[A-Z0-9]{2,6}$/.test(short)) e.short = '2–6 letters or digits, e.g. GEO.';else
    if (store.subjects.some((s) => s.id !== editing?.id && (s.short === short || s.id === short))) e.short = 'Code already used.';
    setErr(e);
    if (Object.keys(e).length) return;
    if (editing) {
      store.updateSubject(editing.id, { name, bn: f.bn.trim(), short, type: f.type, tone: f.tone });
      toast.success(`${name} updated`);
    } else {
      store.addSubject({ id: short, name, bn: f.bn.trim(), short, type: f.type, tone: f.tone });
      toast.success(`${name} added`, { description: 'Add it to classes in Settings › Classes & sections.' });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add subject'}</DialogTitle>
          <DialogDescription>Subjects appear in class plans, routines, exams and teacher profiles.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name (English)" required error={err.name} htmlFor="sb-n" className="sm:col-span-2"><Input id="sb-n" data-autofocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Geography" /></Field>
          <Field label="Name (Bangla)" htmlFor="sb-bn"><Input id="sb-bn" lang="bn" className="font-bn" value={f.bn} onChange={(e) => setF({ ...f, bn: e.target.value })} placeholder="ভূগোল" /></Field>
          <Field label="Short code" required error={err.short} hint={editing ? 'ID stays the same' : undefined} htmlFor="sb-s"><Input id="sb-s" className="uppercase tabular" maxLength={6} value={f.short} onChange={(e) => setF({ ...f, short: e.target.value })} placeholder="GEO" /></Field>
          <Field label="Type" htmlFor="sb-t"><SelectField id="sb-t" value={f.type} onValueChange={(v) => setF({ ...f, type: v as SubjectType })} options={[{ value: 'Core', label: 'Core' }, { value: 'Elective', label: 'Elective' }, { value: 'Practical', label: 'Practical' }]} /></Field>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-[12.5px] font-medium">Colour</legend>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) =>
              <button key={t} type="button" aria-label={t} aria-pressed={f.tone === t} onClick={() => setF({ ...f, tone: t })}
              className={cn('size-7 rounded-md ring-offset-2 ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', subjectToneDot[t], f.tone === t && 'ring-2 ring-foreground')} />
              )}
            </div>
          </fieldset>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? 'Save' : 'Add subject'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
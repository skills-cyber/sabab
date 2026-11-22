import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { campuses } from '../../data/school';
import { FORM_FEE } from '../../data/admissions';
import { useAdmin } from '../../contexts/AdminContext';
import type { AdmissionsStore, NewApplication } from './useAdmissions';
import { formatBDT, isValidBdPhone } from '../../utils/format';

export interface ApplicationPrefill {
  guardianName?: string;
  guardianPhone?: string;
  grade?: number;
  campusId?: string;
  source?: NewApplication['source'];
  enquiryId?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  store: AdmissionsStore;
  prefill?: ApplicationPrefill | null;
  onCreated?: (id: string, enquiryId?: string) => void;
}

const blank: NewApplication = { applicant: '', applicantBn: '', gender: 'F', dob: '2015-01-01', grade: 6, campusId: 'mirpur', previousSchool: '', guardianName: '', guardianRelation: 'Father', guardianPhone: '', source: 'Walk-in', note: '', formFeePaid: true };

const GRADES = Array.from({ length: 10 }, (_, i) => i + 1);

/** New admission application — grouped form, field errors, sibling detection, seat warning. */
export function NewApplicationDialog({ open, onOpenChange, store, prefill, onCreated }: Props) {
  const { students } = useAdmin();
  const [f, setF] = useState<NewApplication>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setF({ ...blank, ...(prefill ?? {}) } as NewApplication);
      setErrors({});
    }
  }, [open, prefill]);

  const set = <K extends keyof NewApplication,>(k: K, v: NewApplication[K]) => setF((x) => ({ ...x, [k]: v }));
  const digits = f.guardianPhone.replace(/\D/g, '');
  const sibling = digits.length >= 11 ? students.find((s) => s.guardianPhone.replace(/\D/g, '') === digits) : undefined;
  const dupApp = digits.length >= 11 ? store.apps.find((a) => a.guardianPhone.replace(/\D/g, '') === digits && a.applicant.trim().toLowerCase() === f.applicant.trim().toLowerCase() && a.stage !== 'withdrawn') : undefined;
  const left = store.seatsLeft(f.grade, f.campusId);
  const hasPlan = !!store.seatStats[`${f.grade}-${f.campusId}`]?.seats;

  const save = () => {
    const e: Record<string, string> = {};
    if (f.applicant.trim().length < 3) e.applicant = 'Applicant name is required.';
    if (f.guardianName.trim().length < 3) e.guardianName = 'Guardian name is required.';
    if (!isValidBdPhone(f.guardianPhone)) e.guardianPhone = 'Enter an 11-digit Bangladesh mobile, e.g. 01712-345678.';
    if (!f.dob || f.dob > '2023-01-01') e.dob = 'Enter a valid date of birth.';
    if (dupApp) e.applicant = `Already applied as ${dupApp.id}.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    const id = store.addApplication({ ...f, applicant: f.applicant.trim(), guardianName: f.guardianName.trim() });
    toast.success(`${id} created`, { description: f.formFeePaid ? 'Next: collect documents and assign an admission test.' : `Form fee ${formatBDT(FORM_FEE)} pending.` });
    onCreated?.(id, prefill?.enquiryId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New application</DialogTitle>
          <DialogDescription>Session 2027 · creates an application in “Applied”. Documents are collected on the next step.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Applicant</legend>
            <Field label="Full name (English)" required error={errors.applicant} htmlFor="na-name"><Input id="na-name" data-autofocus value={f.applicant} onChange={(e) => set('applicant', e.target.value)} /></Field>
            <Field label="Name (Bangla)" htmlFor="na-bn"><Input id="na-bn" lang="bn" className="font-bn" value={f.applicantBn} onChange={(e) => set('applicantBn', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender" htmlFor="na-g"><SelectField id="na-g" value={f.gender} onValueChange={(v) => set('gender', v as 'M' | 'F')} options={[{ value: 'F', label: 'Female' }, { value: 'M', label: 'Male' }]} /></Field>
              <Field label="Date of birth" required error={errors.dob} htmlFor="na-dob"><Input id="na-dob" type="date" value={f.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
            </div>
            <Field label="Previous school" htmlFor="na-prev"><Input id="na-prev" value={f.previousSchool} onChange={(e) => set('previousSchool', e.target.value)} placeholder="—" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class applying for" htmlFor="na-grade"><SelectField id="na-grade" value={String(f.grade)} onValueChange={(v) => set('grade', Number(v))} options={GRADES.map((g) => ({ value: String(g), label: `Class ${g}` }))} /></Field>
              <Field label="Campus" htmlFor="na-camp"><SelectField id="na-camp" value={f.campusId} onValueChange={(v) => set('campusId', v)} options={campuses.map((c) => ({ value: c.id, label: c.short }))} /></Field>
            </div>
            <Field label="Source" htmlFor="na-src"><SelectField id="na-src" value={f.source} onValueChange={(v) => set('source', v as NewApplication['source'])} options={['Walk-in', 'Website', 'Phone', 'Referral', 'Facebook'].map((s) => ({ value: s, label: s }))} /></Field>
          </fieldset>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Guardian</legend>
            <Field label="Guardian name" required error={errors.guardianName} htmlFor="na-gn"><Input id="na-gn" value={f.guardianName} onChange={(e) => set('guardianName', e.target.value)} /></Field>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <Field label="Relation" htmlFor="na-rel"><SelectField id="na-rel" value={f.guardianRelation} onValueChange={(v) => set('guardianRelation', v as NewApplication['guardianRelation'])} options={['Father', 'Mother', 'Guardian'].map((r) => ({ value: r, label: r }))} /></Field>
              <Field label="Mobile" required error={errors.guardianPhone} htmlFor="na-ph"><Input id="na-ph" inputMode="tel" className="tabular" value={f.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} placeholder="01XXX-XXXXXX" /></Field>
            </div>
            <Field label="Office note" htmlFor="na-note" className="sm:col-span-2"><Textarea id="na-note" rows={2} value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="e.g. Science group requested" /></Field>
            <label className="flex items-center gap-2 text-[13px] sm:col-span-2"><Checkbox checked={f.formFeePaid} onCheckedChange={(v) => set('formFeePaid', v === true)} /> Form fee {formatBDT(FORM_FEE)} received now (cash)</label>
          </fieldset>
          {sibling && <Notice kind="info">This guardian already has <b>{sibling.name}</b> enrolled — the application will be flagged for sibling discount and linked to one guardian login.</Notice>}
          {hasPlan && left <= 0 && <Notice kind="warning">No seats left for Class {f.grade} at this campus — the applicant can still apply and be waitlisted.</Notice>}
          {!hasPlan && <Notice kind="info">No seat plan for Class {f.grade} at this campus yet — set one in the Seats tab.</Notice>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Create application</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
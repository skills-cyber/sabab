import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAdmin } from '../../contexts/AdminContext';
import { sections } from '../../data/school';
import { isValidBdPhone } from '../../utils/format';

const empty = { name: '', nameBn: '', sectionId: '6A', gender: 'F', dob: '2014-01-01', guardianName: '', relation: 'Father', phone: '', optIn: true };

export function AddStudentDialog({ open, onOpenChange }: {open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { addStudent, students, familyStore } = useAdmin();
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setF(empty);
      setErrors({});
    }
  }, [open]);

  const dup = students.find((s) => s.guardianPhone.replace(/-/g, '') === f.phone.replace(/[\s-]/g, '') && f.phone);
  const dupFamily = dup?.familyId ? familyStore.families.find((x) => x.id === dup.familyId) : undefined;

  const save = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = 'Full name required.';
    if (f.guardianName.trim().length < 3) e.guardianName = 'Guardian name required.';
    if (!isValidBdPhone(f.phone)) e.phone = 'Enter a Bangladeshi mobile number, e.g. 01712-345678.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const sec = sections.find((s) => s.id === f.sectionId)!;
    const n = students.length + 1;
    addStudent({
      id: `SN${n}`, studentNo: `2027-${String(n).padStart(4, '0')}`, name: f.name.trim(), nameBn: f.nameBn.trim(), roll: 0, sectionId: sec.id, campusId: sec.campusId,
      gender: f.gender as 'M' | 'F', dob: f.dob, guardianName: f.guardianName.trim(), guardianRelation: f.relation as 'Father' | 'Mother' | 'Guardian', guardianPhone: f.phone.trim(),
      guardianVerified: false, smsOptIn: f.optIn, attendancePct: 0, status: 'admission-pending', siblingIds: [], remarks: '', admittedOn: '2026-11-02', transport: false
    });
    toast.success('Admission record created', { description: 'Status: admission pending · guardian OTP verification next.' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add student</DialogTitle>
          <DialogDescription>Creates an admission-pending record. Roll is assigned on enrolment.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Student</legend>
            <Field label="Full name (English)" required error={errors.name} htmlFor="as-name"><Input id="as-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
            <Field label="Name (Bangla)" bn="বাংলায় নাম" htmlFor="as-bn"><Input id="as-bn" lang="bn" className="font-bn" value={f.nameBn} onChange={(e) => setF({ ...f, nameBn: e.target.value })} /></Field>
            <Field label="Class & section" htmlFor="as-sec"><SelectField id="as-sec" value={f.sectionId} onValueChange={(v) => setF({ ...f, sectionId: v })} options={sections.map((s) => ({ value: s.id, label: s.label }))} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender" htmlFor="as-g"><SelectField id="as-g" value={f.gender} onValueChange={(v) => setF({ ...f, gender: v })} options={[{ value: 'F', label: 'Female' }, { value: 'M', label: 'Male' }]} /></Field>
              <Field label="Date of birth" htmlFor="as-dob"><Input id="as-dob" type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} /></Field>
            </div>
          </fieldset>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Guardian</legend>
            <Field label="Guardian name" required error={errors.guardianName} htmlFor="as-gn"><Input id="as-gn" value={f.guardianName} onChange={(e) => setF({ ...f, guardianName: e.target.value })} /></Field>
            <Field label="Relation" htmlFor="as-rel"><SelectField id="as-rel" value={f.relation} onValueChange={(v) => setF({ ...f, relation: v })} options={['Father', 'Mother', 'Guardian'].map((r) => ({ value: r, label: r }))} /></Field>
            <Field label="Mobile" required error={errors.phone} hint="Used for OTP verification and SMS" htmlFor="as-ph"><Input id="as-ph" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="01XXX-XXXXXX" /></Field>
            <label className="flex items-center gap-2 self-end pb-2 text-[13px]"><Checkbox checked={f.optIn} onCheckedChange={(v) => setF({ ...f, optIn: v === true })} /> Guardian consents to SMS</label>
          </fieldset>
          {dup && <Notice kind="info">This number belongs to <b>{dupFamily ? `${dupFamily.id} · ${dupFamily.guardianName}` : dup.guardianName}</b> (guardian of {dup.name}). The new student will be added to that family — one guardian login, sibling links and a combined fee statement. Guardian details come from the family record.</Notice>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Create record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { Notice } from '../common/Notice';
import { useStaff } from '../../contexts/StaffContext';
import { campuses } from '../../data/school';
import { SUPPORT_DESIGNATIONS, TEACHING_DESIGNATIONS } from '../../data/staff';
import type { EmploymentType, PayMethod, SalaryStructure, StaffKind, StaffMember } from '../../types/staff';
import { TODAY, formatBDT, isValidBdPhone } from '../../utils/format';
import { subjectToneDot } from '../../utils/tones';
import { cn } from '../../utils/cn';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: StaffMember | null;
  onCreated?: (id: string) => void;
}

const blank = (kind: StaffKind) => ({
  name: '', bn: '', kind, designation: kind === 'teaching' ? 'Assistant Teacher' : 'Office Assistant', campusId: 'mirpur', phone: '', email: '', joined: TODAY,
  employment: 'permanent' as EmploymentType, nid: '', address: '', emergencyContact: '', subjects: [] as string[], maxPeriods: '24', qualification: '',
  payMethod: 'Bank transfer' as PayMethod, payAccount: '', basic: '', medical: '1500', transport: '1000', pf: true
});

const Section = ({ title, children }: {title: string;children: React.ReactNode;}) =>
<fieldset className="space-y-3">
    <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-subtle">{title}</legend>
    {children}
  </fieldset>;


/** Add or edit a teacher / support staff member. Salary on edit is changed from the profile's Salary tab (effective-dated). */
export function StaffDialog({ open, onOpenChange, editing, onCreated }: Props) {
  const store = useStaff();
  const [f, setF] = useState(blank('teaching'));
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErr({});
    if (editing) {
      setF({
        ...blank(editing.kind), name: editing.name, bn: editing.bn, designation: editing.designation, campusId: editing.campusId, phone: editing.phone, email: editing.email, joined: editing.joined,
        employment: editing.employment, nid: editing.nid, address: editing.address, emergencyContact: editing.emergencyContact, subjects: editing.subjects, maxPeriods: String(editing.maxPeriods || 24),
        qualification: editing.qualification, payMethod: editing.payMethod, payAccount: editing.payAccount ?? ''
      });
    } else setF(blank('teaching'));
  }, [open, editing]);

  const set = <K extends keyof typeof f,>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const teaching = f.kind === 'teaching';
  const basic = Number(f.basic) || 0;
  const house = Math.round(basic * 0.4);
  const gross = basic + house + (Number(f.medical) || 0) + (Number(f.transport) || 0);

  const save = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = 'Full name is required.';
    if (!isValidBdPhone(f.phone)) e.phone = 'Enter a valid 11-digit mobile number.';else
    if (store.staff.some((s) => s.id !== editing?.id && s.phone.replace(/\D/g, '') === f.phone.replace(/\D/g, ''))) e.phone = 'This phone belongs to another staff member.';
    if (!/^(\d{10}|\d{13}|\d{17})$/.test(f.nid.trim())) e.nid = 'NID must be 10, 13 or 17 digits.';else
    if (store.staff.some((s) => s.id !== editing?.id && s.nid === f.nid.trim())) e.nid = 'This NID is already registered.';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Invalid email.';
    if (teaching && f.subjects.length === 0) e.subjects = 'Pick at least one subject.';
    const mp = Number(f.maxPeriods);
    if (teaching && (!Number.isInteger(mp) || mp < 6 || mp > 36)) e.maxPeriods = '6–36 periods.';
    if (f.payMethod !== 'Cash' && f.payAccount.trim().length < 6) e.payAccount = f.payMethod === 'Bank transfer' ? 'Bank account number required.' : 'Wallet number required.';
    if (!editing && store.canSeeSalary && basic <= 0) e.basic = 'Enter the basic salary.';
    setErr(e);
    if (Object.keys(e).length) return;

    const common = {
      name: f.name.trim(), bn: f.bn.trim(), designation: f.designation, campusId: f.campusId, phone: f.phone.trim(), email: f.email.trim(), joined: f.joined, employment: f.employment,
      nid: f.nid.trim(), address: f.address.trim(), emergencyContact: f.emergencyContact.trim(), subjects: teaching ? f.subjects : [], maxPeriods: teaching ? mp : 0,
      qualification: f.qualification.trim(), payMethod: f.payMethod, payAccount: f.payMethod === 'Cash' ? undefined : f.payAccount.trim()
    };
    if (editing) {
      store.updateStaff(editing.id, common);
      toast.success(`${common.name} updated`);
    } else {
      const salary: SalaryStructure = {
        basic,
        allowances: [{ id: 'house', label: 'House rent', amount: house }, { id: 'medical', label: 'Medical', amount: Number(f.medical) || 0 }, ...(Number(f.transport) ? [{ id: 'transport', label: 'Transport', amount: Number(f.transport) }] : [])].filter((l) => l.amount > 0),
        deductions: f.pf && basic ? [{ id: 'pf', label: 'Provident fund (5%)', amount: Math.round(basic * 0.05) }] : [],
        effectiveFrom: f.joined.slice(0, 7)
      };
      const id = store.addStaff({ ...common, kind: f.kind, status: 'active', salary });
      toast.success(`${common.name} added as ${id}`, { description: basic ? `Gross ${formatBDT(gross)} / month · included in the next salary sheet.` : 'Finance will set the salary before the next salary sheet.' });
      onCreated?.(id);
    }
    onOpenChange(false);
  };

  const designations = teaching ? TEACHING_DESIGNATIONS : SUPPORT_DESIGNATIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add staff member'}</DialogTitle>
          <DialogDescription>{editing ? `${editing.id} · changes are audited.` : 'Teachers and support staff (office, drivers, guards, cleaners) share one record and appear in payroll automatically.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <Section title="Basics">
            {!editing && <Segmented ariaLabel="Staff type" value={f.kind} onChange={(k) => setF((x) => ({ ...x, kind: k, designation: k === 'teaching' ? 'Assistant Teacher' : 'Office Assistant' }))} options={[{ value: 'teaching', label: 'Teaching' }, { value: 'support', label: 'Support staff' }]} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" required error={err.name} htmlFor="sf-name"><Input id="sf-name" data-autofocus value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
              <Field label="Name (Bangla)" htmlFor="sf-bn"><Input id="sf-bn" lang="bn" className="font-bn" value={f.bn} onChange={(e) => set('bn', e.target.value)} /></Field>
              <Field label="Designation" htmlFor="sf-des"><SelectField id="sf-des" value={f.designation} onValueChange={(v) => set('designation', v)} options={designations.map((d) => ({ value: d, label: d }))} /></Field>
              <Field label="Campus" htmlFor="sf-camp"><SelectField id="sf-camp" value={f.campusId} onValueChange={(v) => set('campusId', v)} options={campuses.map((c) => ({ value: c.id, label: c.name }))} /></Field>
              <Field label="Mobile" required error={err.phone} htmlFor="sf-phone"><Input id="sf-phone" inputMode="tel" className="tabular" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXX-XXXXXX" /></Field>
              <Field label="Email" error={err.email} htmlFor="sf-email"><Input id="sf-email" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Employment">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Joining date" htmlFor="sf-join"><Input id="sf-join" type="date" max={TODAY} value={f.joined} onChange={(e) => set('joined', e.target.value)} /></Field>
              <Field label="Employment" htmlFor="sf-emp"><SelectField id="sf-emp" value={f.employment} onValueChange={(v) => set('employment', v as EmploymentType)} options={[{ value: 'permanent', label: 'Permanent' }, { value: 'contract', label: 'Contract' }, { value: 'part-time', label: 'Part-time' }]} /></Field>
              <Field label="NID" required error={err.nid} htmlFor="sf-nid"><Input id="sf-nid" inputMode="numeric" className="tabular" value={f.nid} onChange={(e) => set('nid', e.target.value.replace(/\D/g, ''))} /></Field>
              <Field label="Address" htmlFor="sf-addr" className="sm:col-span-2"><Input id="sf-addr" value={f.address} onChange={(e) => set('address', e.target.value)} /></Field>
              <Field label="Emergency contact" htmlFor="sf-emg"><Input id="sf-emg" inputMode="tel" className="tabular" value={f.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} /></Field>
            </div>
          </Section>

          {teaching &&
          <Section title="Teaching">
              <Field label="Subjects" required error={err.subjects}>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Subjects">
                  {store.subjects.filter((s) => !s.archived).map((s) => {
                  const on = f.subjects.includes(s.id);
                  return (
                    <button key={s.id} type="button" aria-pressed={on} onClick={() => set('subjects', on ? f.subjects.filter((x) => x !== s.id) : [...f.subjects, s.id])} className={cn('inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors', on ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
                        <span className={cn('size-2 rounded-sm', subjectToneDot[s.tone])} aria-hidden />{s.short}
                      </button>);

                })}
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Max periods / week" error={err.maxPeriods} htmlFor="sf-max"><Input id="sf-max" type="number" min={6} max={36} className="tabular" value={f.maxPeriods} onChange={(e) => set('maxPeriods', e.target.value)} /></Field>
                <Field label="Qualification" htmlFor="sf-q" className="sm:col-span-2"><Input id="sf-q" value={f.qualification} onChange={(e) => set('qualification', e.target.value)} placeholder="e.g. M.Sc. Mathematics, B.Ed." /></Field>
              </div>
            </Section>
          }

          <Section title="Pay">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Payment method" htmlFor="sf-pm"><SelectField id="sf-pm" value={f.payMethod} onValueChange={(v) => set('payMethod', v as PayMethod)} options={(['Bank transfer', 'bKash', 'Nagad', 'Cash'] as PayMethod[]).map((m) => ({ value: m, label: m }))} /></Field>
              {f.payMethod !== 'Cash' && <Field label={f.payMethod === 'Bank transfer' ? 'Bank account no.' : `${f.payMethod} number`} required error={err.payAccount} htmlFor="sf-pa"><Input id="sf-pa" className="tabular" value={f.payAccount} onChange={(e) => set('payAccount', e.target.value)} /></Field>}
            </div>
            {!editing && store.canSeeSalary &&
            <div className="rounded-lg border border-border p-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Basic (৳)" required error={err.basic} htmlFor="sf-basic"><Input id="sf-basic" type="number" min={0} className="tabular" value={f.basic} onChange={(e) => set('basic', e.target.value)} /></Field>
                  <Field label="House rent" hint="40% of basic"><Input value={house ? String(house) : ''} disabled className="tabular" aria-label="House rent" /></Field>
                  <Field label="Medical (৳)" htmlFor="sf-med"><Input id="sf-med" type="number" min={0} className="tabular" value={f.medical} onChange={(e) => set('medical', e.target.value)} /></Field>
                  <Field label="Transport (৳)" htmlFor="sf-tr"><Input id="sf-tr" type="number" min={0} className="tabular" value={f.transport} onChange={(e) => set('transport', e.target.value)} /></Field>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
                  <label className="flex items-center gap-2"><Switch checked={f.pf} onCheckedChange={(v) => set('pf', v)} aria-label="Provident fund" /> Provident fund 5% of basic</label>
                  <span>Gross <b className="tabular">{formatBDT(gross)}</b> / month</span>
                </div>
              </div>
            }
            {editing && <p className="text-[12px] text-muted-foreground">Salary changes are made from the profile’s Salary tab with an effective month.</p>}
            {!editing && !store.canSeeSalary && <Notice kind="info">Salary is set by the accountant or principal before the next salary sheet.</Notice>}
          </Section>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? 'Save changes' : 'Add staff'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
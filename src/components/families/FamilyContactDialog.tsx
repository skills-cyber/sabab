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
import type { Family, GuardianRelation } from '../../types/family';
import { normalizePhone } from '../../utils/family';

const isBdPhone = (p: string) => /^01[3-9]\d{8}$/.test(normalizePhone(p));

/** Edits family contacts. Changes apply to every child; a new primary phone needs re-verification. */
export function FamilyContactDialog({ family, open, onOpenChange }: {family: Family;open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { familyStore } = useAdmin();
  const blank = () => ({
    guardianName: family.guardianName, guardianNameBn: family.guardianNameBn ?? '', relation: family.relation, phone: family.phone, smsOptIn: family.smsOptIn,
    nid: family.nid ?? '', address: family.address ?? '', secName: family.secondary?.name ?? '', secRelation: family.secondary?.relation ?? 'Mother', secPhone: family.secondary?.phone ?? ''
  });
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {if (open) {setF(blank());setErr({});}}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const clash = familyStore.familyByPhone(f.phone);
  const phoneChanged = normalizePhone(f.phone) !== normalizePhone(family.phone);

  const save = () => {
    const e: Record<string, string> = {};
    if (f.guardianName.trim().length < 3) e.guardianName = 'Full name required.';
    if (!isBdPhone(f.phone)) e.phone = 'Bangladeshi mobile, e.g. 01712-345678.';else
    if (clash && clash.id !== family.id) e.phone = `Already used by ${clash.id} (${clash.guardianName}). Merge the families instead.`;
    if (f.nid && !/^(\d{10}|\d{13}|\d{17})$/.test(f.nid.trim())) e.nid = 'NID is 10, 13 or 17 digits.';
    if (f.secPhone && !isBdPhone(f.secPhone)) e.secPhone = 'Invalid mobile number.';
    if (f.secPhone && !f.secName.trim()) e.secName = 'Name required with a phone.';
    setErr(e);
    if (Object.keys(e).length) return;
    familyStore.updateFamily(family.id, {
      guardianName: f.guardianName.trim(), guardianNameBn: f.guardianNameBn.trim() || undefined, relation: f.relation, phone: f.phone.trim(), smsOptIn: f.smsOptIn,
      nid: f.nid.trim() || undefined, address: f.address.trim() || undefined,
      secondary: f.secName.trim() ? { name: f.secName.trim(), relation: f.secRelation, phone: f.secPhone.trim() } : undefined
    });
    toast.success('Family contacts updated', { description: phoneChanged ? 'New phone needs OTP verification before portal login.' : 'Applied to every child in the family.' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit contacts · {family.id}</DialogTitle>
          <DialogDescription>Updates the guardian on every linked child.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Primary guardian</legend>
            <Field label="Name" required error={err.guardianName} htmlFor="fc-name"><Input id="fc-name" value={f.guardianName} onChange={(e) => setF({ ...f, guardianName: e.target.value })} /></Field>
            <Field label="Name (Bangla)" htmlFor="fc-bn"><Input id="fc-bn" lang="bn" className="font-bn" value={f.guardianNameBn} onChange={(e) => setF({ ...f, guardianNameBn: e.target.value })} /></Field>
            <Field label="Relation" htmlFor="fc-rel"><SelectField id="fc-rel" value={f.relation} onValueChange={(v) => setF({ ...f, relation: v as GuardianRelation })} options={['Father', 'Mother', 'Guardian'].map((r) => ({ value: r, label: r }))} /></Field>
            <Field label="Mobile" required error={err.phone} htmlFor="fc-ph" hint="Portal login & SMS"><Input id="fc-ph" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="NID (optional)" error={err.nid} htmlFor="fc-nid"><Input id="fc-nid" inputMode="numeric" value={f.nid} onChange={(e) => setF({ ...f, nid: e.target.value })} /></Field>
            <label className="flex items-center gap-2 self-end pb-2 text-[13px]"><Checkbox checked={f.smsOptIn} onCheckedChange={(v) => setF({ ...f, smsOptIn: v === true })} /> Consents to SMS</label>
            <div className="sm:col-span-2"><Field label="Address" htmlFor="fc-addr"><Input id="fc-addr" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field></div>
          </fieldset>
          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Second contact</legend>
            <Field label="Name" error={err.secName} htmlFor="fc-sn"><Input id="fc-sn" value={f.secName} onChange={(e) => setF({ ...f, secName: e.target.value })} /></Field>
            <Field label="Relation" htmlFor="fc-sr"><SelectField id="fc-sr" value={f.secRelation} onValueChange={(v) => setF({ ...f, secRelation: v })} options={['Mother', 'Father', 'Grandparent', 'Uncle', 'Aunt', 'Other'].map((r) => ({ value: r, label: r }))} /></Field>
            <Field label="Mobile" error={err.secPhone} htmlFor="fc-sp"><Input id="fc-sp" inputMode="tel" value={f.secPhone} onChange={(e) => setF({ ...f, secPhone: e.target.value })} /></Field>
          </fieldset>
          {phoneChanged && isBdPhone(f.phone) && <Notice kind="warning">Changing the primary phone removes verification and is recorded in the audit log. The guardian must verify the new number before using the portal.</Notice>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save contacts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
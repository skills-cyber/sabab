import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAdmin } from '../../contexts/AdminContext';
import type { Family } from '../../types/family';
import { childrenOf } from '../../utils/family';

/** Merges another family into this one (this family's guardian is kept). */
export function MergeFamilyDialog({ family, open, onOpenChange }: {family: Family;open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { students, familyStore } = useAdmin();
  const [other, setOther] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {if (open) {setOther('');setReason('');setErr('');}}, [open]);

  const drop = familyStore.families.find((f) => f.id === other);
  const moving = drop ? childrenOf(drop.id, students) : [];

  const save = () => {
    if (!drop) return setErr('Choose the family to merge.');
    if (reason.trim().length < 5) return setErr('Give a short reason (min 5 characters).');
    familyStore.mergeFamilies(family.id, drop.id, reason.trim());
    toast.success(`${drop.id} merged into ${family.id}`, { description: `${moving.length} child${moving.length > 1 ? 'ren' : ''} moved` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Merge into {family.id}</DialogTitle>
          <DialogDescription>Use when the same household was recorded twice, e.g. with the mother’s and father’s numbers.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Family to merge" htmlFor="mf-f">
            <SelectField id="mf-f" value={other} onValueChange={(v) => {setOther(v);setErr('');}} placeholder="Choose a family…"
            options={familyStore.families.filter((f) => f.id !== family.id).map((f) => ({ value: f.id, label: `${f.id} · ${f.guardianName} · ${f.phone}` }))} />
          </Field>
          {drop && <Notice kind="warning">{moving.map((m) => m.name).join(', ') || 'No children'} will move to {family.guardianName}. {drop.id} and its contacts are removed; its history stays in the audit log.</Notice>}
          <Field label="Reason" required error={err} htmlFor="mf-r"><Textarea id="mf-r" rows={2} value={reason} onChange={(e) => {setReason(e.target.value);setErr('');}} placeholder="e.g. Duplicate — same parents, second phone" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={save}>Merge families</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
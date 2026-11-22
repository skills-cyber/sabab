import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAdmin } from '../../contexts/AdminContext';
import type { Family } from '../../types/family';
import { childrenOf } from '../../utils/family';
import { sectionLabel } from '../../utils/timetable';

/** Moves an existing student into this family; warns when their old family would be dissolved. */
export function LinkChildDialog({ family, open, onOpenChange }: {family: Family;open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { students, familyStore } = useAdmin();
  const [sid, setSid] = useState('');
  useEffect(() => {if (open) setSid('');}, [open]);

  const candidates = students.filter((s) => s.familyId !== family.id && (s.status === 'active' || s.status === 'admission-pending'));
  const s = students.find((x) => x.id === sid);
  const oldFamily = s?.familyId ? familyStore.families.find((f) => f.id === s.familyId) : undefined;
  const dissolves = !!s?.familyId && childrenOf(s.familyId, students).length === 1;

  const save = () => {
    if (!s) return;
    const gone = familyStore.linkChild(family.id, s.id);
    toast.success(`${s.name} linked to ${family.id}`, { description: gone ? `${gone} had no other children and was removed.` : `Guardian set to ${family.guardianName}.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link a child to {family.id}</DialogTitle>
          <DialogDescription>The child’s guardian contacts change to {family.guardianName}.</DialogDescription>
        </DialogHeader>
        <Field label="Student" htmlFor="lc-s">
          <SelectField id="lc-s" value={sid} onValueChange={setSid} placeholder="Choose a student…" options={candidates.map((c) => ({ value: c.id, label: `${c.name} · ${sectionLabel(c.sectionId)} · ${c.guardianName}` }))} />
        </Field>
        {s && oldFamily &&
        <Notice kind={dissolves ? 'warning' : 'info'}>
            Currently in {oldFamily.id} ({oldFamily.guardianName}, {oldFamily.phone}).{' '}
            {dissolves ? `${oldFamily.id} will have no children left and will be removed.` : `${oldFamily.id} keeps its other children.`}
          </Notice>
        }
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!s} onClick={save}>Link child</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
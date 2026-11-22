import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { Notice } from '../common/Notice';
import { useAdmin } from '../../contexts/AdminContext';
import { CONCESSION_APPROVAL_LIMIT, CONCESSION_LABEL, type ConcessionType } from '../../types/concessions';
import { concessionAmount, tuitionFor } from '../../utils/concessions';
import { sectionLabel } from '../../utils/timetable';
import { TODAY, formatBDT } from '../../utils/format';

const NEXT_MONTH = (() => {const [y, m] = TODAY.split('-').map(Number);return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;})();
const DEFAULT_PCT: Record<ConcessionType, number> = { sibling: 10, merit: 50, 'staff-child': 50, hardship: 25 };

/** Grant a standing tuition concession. Large ones wait for owner/principal approval. */
export function ConcessionDialog({ open, studentId, onOpenChange }: {open: boolean;studentId?: string;onOpenChange: (o: boolean) => void;}) {
  const admin = useAdmin();
  const [f, setF] = useState({ studentId: '', type: 'sibling' as ConcessionType, basis: 'percent' as 'percent' | 'fixed', value: '10', from: NEXT_MONTH, to: '', reason: '', applyCurrent: false });
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setF({ studentId: studentId ?? '', type: 'sibling', basis: 'percent', value: '10', from: NEXT_MONTH, to: '', reason: '', applyCurrent: false });
    setErr({});
  }, [open, studentId]);

  const student = admin.students.find((s) => s.id === f.studentId);
  const tuition = tuitionFor(student, admin.feeHeads);
  const value = Number(f.value) || 0;
  const monthly = concessionAmount({ basis: f.basis, value }, tuition);
  const needsApproval = monthly > CONCESSION_APPROVAL_LIMIT && !admin.canApproveConcession;
  const existing = admin.concessions.filter((c) => c.studentId === f.studentId && (c.status === 'approved' || c.status === 'pending') && (!c.to || c.to >= f.from));
  // Sibling concession needs 2+ active children in the student's family.
  const siblingOk = f.type !== 'sibling' || !student || admin.students.filter((s) => s.status === 'active' && s.id !== student.id && s.familyId && s.familyId === student.familyId).length > 0;

  const save = () => {
    const e: Record<string, string> = {};
    if (!student) e.studentId = 'Choose a student.';
    if (f.basis === 'percent' && (!Number.isFinite(value) || value < 1 || value > 100)) e.value = '1–100%';
    if (f.basis === 'fixed' && (!(value > 0) || value > tuition)) e.value = `৳1–${formatBDT(tuition)} (tuition)`;
    if (!/^\d{4}-\d{2}$/.test(f.from)) e.from = 'Pick a start month.';
    if (f.to && f.to < f.from) e.to = 'Ends before it starts.';
    if (f.reason.trim().length < 5) e.reason = 'Give a reason (shown to the approver and in audit).';
    setErr(e);
    if (Object.keys(e).length) return;
    const r = admin.addConcession({ studentId: f.studentId, type: f.type, basis: f.basis, value, from: f.from, to: f.to || undefined, reason: f.reason.trim(), applyCurrent: f.applyCurrent });
    toast.success(r.pending ? `${r.id} sent for approval` : `${r.id} granted to ${student?.name}`, { description: r.pending ? `Over ${formatBDT(CONCESSION_APPROVAL_LIMIT)}/month — the principal sees it in their action queue.` : `${formatBDT(monthly)} off tuition each month on new invoices.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New concession</DialogTitle>
          <DialogDescription>Reduces monthly tuition on every invoice generated in the chosen months.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Student" required error={err.studentId} htmlFor="cn-st" className="sm:col-span-2">
            <SelectField id="cn-st" value={f.studentId} placeholder="Choose student" onValueChange={(v) => setF({ ...f, studentId: v })}
            options={admin.students.filter((s) => s.status === 'active').map((s) => ({ value: s.id, label: `${s.name} · ${sectionLabel(s.sectionId)} · ${s.studentNo}` }))} />
          </Field>
          <Field label="Type" htmlFor="cn-type">
            <SelectField id="cn-type" value={f.type} onValueChange={(v) => {const t = v as ConcessionType;setF({ ...f, type: t, basis: 'percent', value: String(DEFAULT_PCT[t]) });}}
            options={Object.entries(CONCESSION_LABEL).map(([value, label]) => ({ value, label }))} />
          </Field>
          <Field label={f.basis === 'percent' ? 'Percent of tuition' : 'Amount per month (৳)'} required error={err.value} htmlFor="cn-val">
            <div className="flex gap-2">
              <Input id="cn-val" type="number" min={1} className="tabular" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
              <Segmented ariaLabel="Basis" size="sm" value={f.basis} onChange={(b) => setF({ ...f, basis: b })} options={[{ value: 'percent', label: '%' }, { value: 'fixed', label: '৳' }]} />
            </div>
          </Field>
          <Field label="From month" required error={err.from} htmlFor="cn-from"><Input id="cn-from" type="month" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
          <Field label="Until month" hint="Leave empty for open-ended" error={err.to} htmlFor="cn-to"><Input id="cn-to" type="month" min={f.from} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
          <Field label="Reason" required error={err.reason} htmlFor="cn-reason" className="sm:col-span-2"><Textarea id="cn-reason" rows={2} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="e.g. Sibling in 4-B · guardian letter dated 1 Nov" /></Field>
          <label className="flex items-center gap-2 text-[13px] sm:col-span-2">
            <Checkbox checked={f.applyCurrent} onCheckedChange={(v) => setF({ ...f, applyCurrent: !!v })} />
            Also reduce the student’s current unpaid invoice
          </label>
        </div>
        {student &&
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-[13px]">
            <span>Tuition {formatBDT(tuition)} → <b className="tabular">{formatBDT(tuition - monthly)}</b></span>
            <b className="tabular text-success">−{formatBDT(monthly)}/month</b>
          </div>
        }
        {!siblingOk && <Notice kind="warning">{student?.name} has no linked sibling. Link siblings on the student record first, or choose another type.</Notice>}
        {existing.length > 0 && <Notice kind="warning">Already has {existing.map((c) => `${c.id} (${CONCESSION_LABEL[c.type]}, ${c.status})`).join(', ')} in this period — both would apply.</Notice>}
        {needsApproval && <Notice kind="info">Over {formatBDT(CONCESSION_APPROVAL_LIMIT)}/month — needs owner or principal approval before it applies.</Notice>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!siblingOk} onClick={save}>{needsApproval ? 'Submit for approval' : 'Grant concession'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
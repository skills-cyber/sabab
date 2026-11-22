import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { usePayroll } from '../../contexts/PayrollContext';
import { useStaff } from '../../contexts/StaffContext';
import { campuses } from '../../data/school';
import { CURRENT_MONTH } from '../accounts/useAccounts';
import { formatBDT } from '../../utils/format';
import { grossOf, monthLabel, workingDaysIn } from '../../utils/payroll';

/** Generate a month's salary sheet for a campus: pulls structures, unpaid leave and advance instalments. */
export function GenerateSheetDialog({ open, onOpenChange, onCreated }: {open: boolean;onOpenChange: (o: boolean) => void;onCreated: (id: string) => void;}) {
  const payroll = usePayroll();
  const { staff, unpaidDaysIn } = useStaff();
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [campusId, setCampusId] = useState('mirpur');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {if (open) {setMonth(CURRENT_MONTH);setCampusId('mirpur');setErr(null);}}, [open]);

  const monthEnd = `${month}-31`;
  const people = staff.filter((s) => s.campusId === campusId && s.joined <= monthEnd && (s.status !== 'resigned' || (s.lastDay ?? '') >= `${month}-01`));
  const exists = payroll.sheets.find((s) => s.month === month && s.campusId === campusId);
  const gross = people.reduce((t, s) => t + grossOf(s.salary), 0);
  const leaveDays = people.reduce((t, s) => t + unpaidDaysIn(s.id, month), 0);
  const recovering = people.filter((s) => payroll.outstandingAdvance(s.id) > 0).length;

  const go = () => {
    if (!/^\d{4}-\d{2}$/.test(month)) return setErr('Pick a month.');
    if (month > CURRENT_MONTH) return setErr('You can’t generate a sheet for a future month.');
    const r = payroll.generate(month, campusId);
    if ('error' in r && r.error) return setErr(r.error);
    if ('id' in r && r.id) {
      toast.success(`Salary sheet for ${monthLabel(month)} generated`, { description: `${people.length} staff · review, then submit for approval.` });
      onCreated(r.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate salary sheet</DialogTitle>
          <DialogDescription>Uses each person’s salary structure, approved unpaid leave and advance instalments.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Month" htmlFor="gs-month"><Input id="gs-month" data-autofocus type="month" max={CURRENT_MONTH} value={month} onChange={(e) => {setMonth(e.target.value);setErr(null);}} /></Field>
          <Field label="Campus" htmlFor="gs-camp"><SelectField id="gs-camp" value={campusId} onValueChange={(v) => {setCampusId(v);setErr(null);}} options={campuses.map((c) => ({ value: c.id, label: c.name }))} /></Field>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border text-[12.5px]">
          <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Staff included</dt><dd className="font-semibold tabular">{people.length}</dd></div>
          <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Working days</dt><dd className="font-semibold tabular">{/^\d{4}-\d{2}$/.test(month) ? workingDaysIn(month) : '—'}</dd></div>
          <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Gross before deductions</dt><dd className="font-semibold tabular">{formatBDT(gross)}</dd></div>
          <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Unpaid leave · advances</dt><dd className="font-semibold tabular">{leaveDays}d · {recovering} staff</dd></div>
        </dl>
        {exists && <Notice kind="warning">{exists.id} already exists for this month and campus ({exists.status}).</Notice>}
        {err && !exists && <p className="text-[11.5px] text-danger" role="alert">{err}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!!exists || people.length === 0} onClick={go}>Generate sheet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
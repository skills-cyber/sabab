import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAccounts } from '../../contexts/AccountsContext';
import { usePayroll } from '../../contexts/PayrollContext';
import { useStaff } from '../../contexts/StaffContext';
import type { TxnMethod } from '../../types/accounts';
import { TODAY, formatBDT } from '../../utils/format';
import { grossOf } from '../../utils/payroll';

const METHOD_FOR: Record<string, TxnMethod> = { cash: 'Cash', bank: 'Bank transfer', wallet: 'bKash' };

/** Give a salary advance; recovered automatically from future salary sheets in equal instalments. */
export function AdvanceDialog({ open, staffId, onOpenChange }: {open: boolean;staffId?: string;onOpenChange: (o: boolean) => void;}) {
  const fin = useAccounts();
  const payroll = usePayroll();
  const { staff } = useStaff();
  const accounts = fin.accounts.filter((a) => !a.archived);
  const [f, setF] = useState({ staffId: '', amount: '', installments: '3', accountId: 'cash-mirpur', date: TODAY, reference: '', note: '' });
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {setF({ staffId: staffId ?? '', amount: '', installments: '3', accountId: 'cash-mirpur', date: TODAY, reference: '', note: '' });setErr({});}
  }, [open, staffId]);

  const person = staff.find((s) => s.id === f.staffId);
  const amount = Number(f.amount) || 0;
  const inst = Number(f.installments) || 1;
  const acc = accounts.find((a) => a.id === f.accountId);
  const bal = f.accountId ? fin.balanceOf(f.accountId).balance : 0;
  const outstanding = person ? payroll.outstandingAdvance(person.id) : 0;
  const gross = person ? grossOf(person.salary) : 0;

  const save = () => {
    const e: Record<string, string> = {};
    if (!person) e.staffId = 'Choose a staff member.';
    if (!(amount > 0)) e.amount = 'Enter an amount.';else
    if (amount > bal) e.amount = `Exceeds ${acc?.name} balance (${formatBDT(bal)}).`;else
    if (person && amount > gross * 2) e.amount = `Max 2 months’ gross (${formatBDT(gross * 2)}).`;
    if (!Number.isInteger(inst) || inst < 1 || inst > 12) e.installments = '1–12 months.';
    if (acc?.type !== 'cash' && f.reference.trim().length < 4) e.reference = 'Reference required for non-cash payments.';
    if (f.note.trim().length < 3) e.note = 'Purpose is required.';
    setErr(e);
    if (Object.keys(e).length || !person) return;
    const r = payroll.giveAdvance({ staffId: person.id, amount, installments: inst, accountId: f.accountId, date: f.date, method: METHOD_FOR[acc?.type ?? 'cash'], reference: f.reference.trim() || undefined, note: f.note.trim() });
    if (r) toast.success(r.pending ? `${r.voucher} sent for approval` : `Advance of ${formatBDT(amount)} given`, { description: r.pending ? `Advances of ${formatBDT(fin.approvalLimit)} or more need owner/principal approval before recovery starts.` : `${inst} × ${formatBDT(Math.ceil(amount / inst))} recovered from upcoming salary sheets.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Give salary advance</DialogTitle>
          <DialogDescription>Posted to Accounts as “Salary advance” and recovered from salary sheets.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Staff member" required error={err.staffId} htmlFor="ad-staff" className="sm:col-span-2">
            <SelectField id="ad-staff" value={f.staffId} placeholder="Choose staff" onValueChange={(v) => setF({ ...f, staffId: v })} options={staff.filter((s) => s.status !== 'resigned').map((s) => ({ value: s.id, label: `${s.name} · ${s.designation}` }))} />
          </Field>
          <Field label="Amount (৳)" required error={err.amount} htmlFor="ad-amt"><Input id="ad-amt" data-autofocus type="number" min={0} className="tabular" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Recover over (months)" error={err.installments} htmlFor="ad-inst" hint={amount > 0 ? `${formatBDT(Math.ceil(amount / inst))} per month` : undefined}><Input id="ad-inst" type="number" min={1} max={12} className="tabular" value={f.installments} onChange={(e) => setF({ ...f, installments: e.target.value })} /></Field>
          <Field label="Pay from" htmlFor="ad-acc"><SelectField id="ad-acc" value={f.accountId} onValueChange={(v) => setF({ ...f, accountId: v })} options={accounts.map((a) => ({ value: a.id, label: `${a.name} · ${formatBDT(fin.balanceOf(a.id).balance)}` }))} /></Field>
          <Field label="Date" htmlFor="ad-date"><Input id="ad-date" type="date" max={TODAY} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          {acc?.type !== 'cash' && <Field label="Reference" required error={err.reference} htmlFor="ad-ref"><Input id="ad-ref" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="TrxID / cheque no." /></Field>}
          <Field label="Purpose" required error={err.note} htmlFor="ad-note" className={acc?.type !== 'cash' ? '' : 'sm:col-span-2'}><Input id="ad-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Medical emergency" /></Field>
        </div>
        {outstanding > 0 && <Notice kind="warning">{person?.name} still owes {formatBDT(outstanding)} from earlier advances. Both are recovered together.</Notice>}
        {amount >= fin.approvalLimit && <Notice kind="info">At or above {formatBDT(fin.approvalLimit)} — waits for owner or principal approval in Accounts.</Notice>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{amount >= fin.approvalLimit ? 'Submit for approval' : 'Give advance'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
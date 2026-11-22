import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { StatusBadge } from '../common/StatusBadge';
import { Notice } from '../common/Notice';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import { useAccounts } from '../../contexts/AccountsContext';
import type { PaymentMethod } from '../../types/finance';
import { invoiceBalance, invoiceStatus } from '../../utils/fees';
import { sectionLabel } from '../../utils/timetable';
import { formatBDT } from '../../utils/format';

interface CollectDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  studentId?: string;
  onCollected: (receiptNo: string) => void;
  guardianMode?: boolean;
}

/** Partial/full payment by cash, bank or MFS. Allocates to the oldest dues first. */
export function CollectDialog({ open, onOpenChange, studentId, onCollected, guardianMode }: CollectDialogProps) {
  const { students, invoices, collect, dayClose } = useAdmin();
  const { online } = useApp();
  const debtors = useMemo(() => students.filter((s) => invoices.some((i) => i.studentId === s.id && invoiceBalance(i) > 0)), [students, invoices]);
  const [sid, setSid] = useState(studentId ?? debtors[0]?.id ?? '');
  const [method, setMethod] = useState<PaymentMethod>(guardianMode ? 'bKash' : 'Cash');
  const [amount, setAmount] = useState('');
  const [ref, setRef] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const fin = useAccounts();
  const [accountId, setAccountId] = useState('');
  const student$ = students.find((s) => s.id === sid);
  const depositOptions = fin.accounts.filter((a) => !a.archived && (method === 'Cash' ? a.type === 'cash' : method === 'Bank' ? a.type === 'bank' : a.type === 'wallet' && a.provider === method));
  const defaultDeposit = method === 'Cash' ? `cash-${student$?.campusId ?? 'mirpur'}` : method === 'Bank' ? 'dbbl' : method === 'bKash' ? 'bkash' : 'nagad';
  useEffect(() => {
    setAccountId(depositOptions.some((a) => a.id === defaultDeposit) ? defaultDeposit : depositOptions[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, sid, open]);

  const open$ = invoices.filter((i) => i.studentId === sid && invoiceBalance(i) > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const balance = open$.reduce((t, i) => t + invoiceBalance(i), 0);

  useEffect(() => {
    if (open) {
      const s = studentId ?? debtors[0]?.id ?? '';
      setSid(s);
      setMethod(guardianMode ? 'bKash' : 'Cash');
      setRef('');
      setErrors({});
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  useEffect(() => setAmount(String(balance)), [sid, balance]);

  const submit = () => {
    const n = Number(amount);
    const e: Record<string, string> = {};
    if (!Number.isFinite(n) || n <= 0) e.amount = 'Enter an amount.';else
    if (n > balance) e.amount = `Cannot exceed outstanding ${formatBDT(balance)} (advance payments are designed, not enabled).`;
    if (method !== 'Cash' && ref.trim().length < 6) e.ref = 'Transaction / deposit reference required.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    window.setTimeout(() => {
      const rc = collect(sid, n, method, method === 'Cash' ? undefined : ref.trim().toUpperCase(), accountId || undefined);
      toast.success(`${formatBDT(n)} received`, { description: `${rc} · ${n < balance ? 'partial payment' : 'fully paid'}` });
      onOpenChange(false);
      onCollected(rc);
    }, guardianMode ? 900 : 300);
  };

  const student = students.find((s) => s.id === sid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{guardianMode ? 'Pay school fees' : 'Collect payment'}</DialogTitle>
          <DialogDescription>{guardianMode ? 'Prototype — no live payment gateway is connected.' : 'Posted payments cannot be edited; use reversal with a reason.'}</DialogDescription>
        </DialogHeader>
        {dayClose && !guardianMode && <Notice kind="warning">Today is already closed. New receipts post to tomorrow's daybook.</Notice>}
        {!online && <Notice kind="offline">Payments are never posted offline. Reconnect to continue.</Notice>}
        <div className="space-y-3">
          {!studentId &&
          <Field label="Student" htmlFor="cl-stu">
              <SelectField id="cl-stu" value={sid} onValueChange={setSid} options={debtors.map((s) => ({ value: s.id, label: `${s.name} · ${sectionLabel(s.sectionId)} · ${s.studentNo}` }))} />
            </Field>
          }
          {student &&
          <div className="rounded-lg border border-border">
              <p className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground">{student.name} · {sectionLabel(student.sectionId)} · open invoices</p>
              <ul className="divide-y divide-border">
                {open$.map((i) =>
              <li key={i.id} className="flex items-center justify-between px-3 py-1.5 text-[13px]"><span>{i.period} <StatusBadge status={invoiceStatus(i)} className="ml-1" /></span><span className="tabular">{formatBDT(invoiceBalance(i))}</span></li>
              )}
                {open$.length === 0 && <li className="px-3 py-2 text-xs text-muted-foreground">No dues.</li>}
              </ul>
            </div>
          }
          <Field label="Method">
            <Segmented ariaLabel="Payment method" value={method} onChange={setMethod} options={(guardianMode ? ['bKash', 'Nagad'] : ['Cash', 'bKash', 'Nagad', 'Bank']).map((m) => ({ value: m as PaymentMethod, label: m }))} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount (৳)" required error={errors.amount} htmlFor="cl-amt" hint={`Outstanding ${formatBDT(balance)}`}>
              <Input id="cl-amt" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="tabular" />
            </Field>
            {method !== 'Cash' &&
            <Field label={method === 'Bank' ? 'Deposit slip no.' : 'Transaction ID'} required error={errors.ref} htmlFor="cl-ref">
                <Input id="cl-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder={method === 'Bank' ? 'DBBL-102938' : '9XK2L7QPA1'} />
              </Field>
            }
            {!guardianMode && depositOptions.length > 1 &&
            <Field label="Deposit to" htmlFor="cl-acc" className="sm:col-span-2" hint="Shows up in this account's statement in Accounts & Finance.">
                <SelectField id="cl-acc" value={accountId} onValueChange={setAccountId} options={depositOptions.map((a) => ({ value: a.id, label: a.name }))} />
              </Field>
            }
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !online || balance === 0}>{busy ? 'Processing…' : guardianMode ? `Pay ${formatBDT(Number(amount) || 0)}` : 'Post payment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
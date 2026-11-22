import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { useAccounts } from '../../contexts/AccountsContext';
import type { FinAccount } from '../../types/accounts';
import { TODAY, formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Props {
  account: FinAccount | null;
  onOpenChange: (o: boolean) => void;
}

/** Compare the book balance with a bank/wallet statement (or a cash count) and post any difference as an adjustment. */
export function ReconcileDialog({ account, onOpenChange }: Props) {
  const store = useAccounts();
  const [stmt, setStmt] = useState('');
  const [date, setDate] = useState(TODAY);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    setStmt('');
    setDate(TODAY);
    setReason('');
    setErr(null);
  }, [account]);

  const book = account ? store.balanceOf(account.id).balance : 0;
  const entered = stmt.trim() !== '' && Number.isFinite(Number(stmt));
  const diff = entered ? Number(stmt) - book : 0;

  const save = () => {
    if (!account) return;
    if (!entered || Number(stmt) < 0) return setErr('Enter the statement balance.');
    if (diff === 0) {
      store.updateAccount(account.id, { reconciledTo: date }, 'Account reconciled');
      toast.success(`${account.name} reconciled`, { description: `Balances match as of ${formatDate(date, 'd MMM')}.` });
      onOpenChange(false);
      return;
    }
    if (reason.trim().length < 5) return setErr('Explain the difference (min 5 characters) — it goes to the approver.');
    const r = store.record({ kind: 'adjustment', date, accountId: account.id, amount: Math.abs(diff), direction: diff > 0 ? 'in' : 'out', note: reason.trim(), reconcileDate: date });
    toast.success(`${r.voucher} sent for approval`, { description: `${formatBDT(Math.abs(diff))} ${diff > 0 ? 'excess' : 'shortfall'} · account stamps as reconciled once approved.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={!!account} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reconcile {account?.name}</DialogTitle>
          <DialogDescription>{account?.type === 'cash' ? 'Count the cash and enter the total.' : 'Enter the closing balance from the bank or wallet statement.'} Statement import is designed for the backend phase.</DialogDescription>
        </DialogHeader>
        {account?.reconciledTo && <p className="text-[12px] text-muted-foreground">Last reconciled to {formatDate(account.reconciledTo)}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Statement date" htmlFor="rc-date"><Input id="rc-date" type="date" max={TODAY} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label={account?.type === 'cash' ? 'Counted cash (৳)' : 'Statement balance (৳)'} required htmlFor="rc-bal"><Input id="rc-bal" data-autofocus type="number" min={0} inputMode="numeric" className="tabular" value={stmt} onChange={(e) => {setStmt(e.target.value);setErr(null);}} /></Field>
        </div>
        <dl className="divide-y divide-border rounded-lg border border-border text-[13px]">
          <div className="flex justify-between px-3 py-2"><dt className="text-muted-foreground">Book balance</dt><dd className="tabular">{formatBDT(book)}</dd></div>
          <div className="flex justify-between px-3 py-2"><dt className="text-muted-foreground">Statement</dt><dd className="tabular">{entered ? formatBDT(Number(stmt)) : '—'}</dd></div>
          <div className="flex justify-between px-3 py-2 font-semibold"><dt>Difference</dt><dd className={cn('tabular', diff > 0 && 'text-success', diff < 0 && 'text-danger')}>{entered ? `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${formatBDT(Math.abs(diff))}` : '—'}</dd></div>
        </dl>
        {entered && diff === 0 && <Notice kind="success">Balances match — the account will be stamped “Reconciled to {formatDate(date, 'd MMM')}”.</Notice>}
        {entered && diff !== 0 &&
        <Field label="Reason for difference" required htmlFor="rc-reason">
            <Textarea id="rc-reason" rows={2} value={reason} onChange={(e) => {setReason(e.target.value);setErr(null);}} placeholder="e.g. Bank charges not yet recorded · SMS fee Oct" />
          </Field>
        }
        {err && <p className="text-[11.5px] text-danger" role="alert">{err}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!entered}>{entered && diff !== 0 ? 'Submit adjustment' : 'Mark reconciled'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
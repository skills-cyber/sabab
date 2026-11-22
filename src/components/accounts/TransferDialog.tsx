import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAccounts } from '../../contexts/AccountsContext';
import type { Txn } from '../../types/accounts';
import { TODAY, formatBDT } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Prefill source account (e.g. "Transfer out" from an account panel). */
  fromId?: string;
  /** Edit a returned transfer. */
  editing?: Txn | null;
}

/** Move money between accounts with an optional bank/MFS fee and a live before/after preview. */
export function TransferDialog({ open, onOpenChange, fromId, editing }: Props) {
  const store = useAccounts();
  const active = store.accounts.filter((a) => !a.archived);
  const [f, setF] = useState({ from: '', to: '', amount: '', fee: '', date: TODAY, reference: '', note: '' });
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErr({});
    if (editing) {
      const fee = store.txns.find((t) => t.pairId === editing.id)?.amount;
      setF({ from: editing.accountId, to: editing.toAccountId ?? '', amount: String(editing.amount), fee: fee ? String(fee) : '', date: editing.date, reference: editing.reference ?? '', note: editing.note ?? '' });
    } else {
      const from = fromId ?? active.find((a) => a.type === 'cash')?.id ?? active[0]?.id ?? '';
      setF({ from, to: active.find((a) => a.id !== from && a.type === 'bank')?.id ?? '', amount: '', fee: '', date: TODAY, reference: '', note: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fromId, editing]);

  const amount = Number(f.amount) || 0;
  const fee = Number(f.fee) || 0;
  // When editing a returned entry, its own amounts are not yet deducted, so balances are already "before".
  const fromBal = f.from ? store.balanceOf(f.from).balance : 0;
  const toBal = f.to ? store.balanceOf(f.to).balance : 0;
  const pending = store.needsApproval('transfer', amount);
  const fromAcc = active.find((a) => a.id === f.from);

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.from) e.from = 'Choose the source account.';
    if (!f.to) e.to = 'Choose the destination account.';else
    if (f.to === f.from) e.to = 'Source and destination must be different.';
    if (!(amount > 0)) e.amount = 'Enter an amount.';
    if (fee < 0) e.fee = 'Fee cannot be negative.';
    if (amount + fee > fromBal) e.amount = `Amount + fee exceeds ${fromAcc?.name ?? 'source'} balance (${formatBDT(fromBal)}).`;
    if (fromAcc?.type !== 'cash' && f.reference.trim().length < 4) e.reference = 'Cheque no. or transaction ID is required for bank/wallet transfers.';
    setErr(e);
    if (Object.keys(e).length) return;
    const draft = { kind: 'transfer' as const, date: f.date, accountId: f.from, toAccountId: f.to, amount, fee, method: fromAcc?.type === 'wallet' ? fromAcc.provider : fromAcc?.type === 'bank' ? 'Bank transfer' as const : 'Cash' as const, reference: f.reference.trim() || undefined, note: f.note.trim() || undefined };
    if (editing) {
      const p = store.resubmit(editing.id, draft);
      toast.success(p ? 'Transfer resubmitted for approval' : 'Transfer posted');
    } else {
      const r = store.record(draft);
      toast.success(r.pending ? `${r.voucher} sent for approval` : `${formatBDT(amount)} transferred`, { description: r.pending ? `Transfers of ${formatBDT(store.approvalLimit)} or more need owner/principal approval.` : `${store.accountName(f.from)} → ${store.accountName(f.to)}${fee ? ` · fee ${formatBDT(fee)}` : ''}` });
    }
    onOpenChange(false);
  };

  const Preview = ({ label, before, after }: {label: string;before: number;after: number;}) =>
  <div className="min-w-0 flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <p className="truncate text-[11.5px] text-muted-foreground">{label}</p>
      <p className="text-[12px] tabular text-muted-foreground">{formatBDT(before)}</p>
      <p className={cn('text-[14px] font-semibold tabular', after < 0 ? 'text-danger' : 'text-foreground')}>{formatBDT(after)}</p>
    </div>;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="size-4 text-primary" /> {editing ? `Edit ${editing.voucher}` : 'Transfer money'}</DialogTitle>
          <DialogDescription>Moves money between your own accounts — not counted as income or expense. An optional fee is recorded as “Bank & MFS charges”.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From" required error={err.from} htmlFor="tf-from"><SelectField id="tf-from" value={f.from} onValueChange={(v) => setF({ ...f, from: v })} options={active.map((a) => ({ value: a.id, label: `${a.name} · ${formatBDT(store.balanceOf(a.id).balance)}` }))} /></Field>
          <Field label="To" required error={err.to} htmlFor="tf-to"><SelectField id="tf-to" value={f.to} placeholder="Choose account" onValueChange={(v) => setF({ ...f, to: v })} options={active.filter((a) => a.id !== f.from).map((a) => ({ value: a.id, label: a.name }))} /></Field>
          <Field label="Amount (৳)" required error={err.amount} htmlFor="tf-amt"><Input id="tf-amt" data-autofocus type="number" min={0} inputMode="numeric" className="tabular" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Fee (৳)" error={err.fee} htmlFor="tf-fee" hint="Bank/bKash charge, if any"><Input id="tf-fee" type="number" min={0} inputMode="numeric" className="tabular" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} placeholder="0" /></Field>
          <Field label="Date" htmlFor="tf-date"><Input id="tf-date" type="date" max={TODAY} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Reference" required={fromAcc?.type !== 'cash'} error={err.reference} htmlFor="tf-ref"><Input id="tf-ref" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="Cheque no. / TrxID / slip no." /></Field>
          <Field label="Note" htmlFor="tf-note" className="sm:col-span-2"><Input id="tf-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Cash deposit to bank" /></Field>
        </div>
        {f.from && f.to && f.from !== f.to &&
        <div className="flex items-center gap-2" aria-live="polite">
            <Preview label={store.accountName(f.from)} before={fromBal} after={fromBal - amount - fee} />
            <ArrowRight className="size-4 shrink-0 text-subtle" aria-hidden />
            <Preview label={store.accountName(f.to)} before={toBal} after={toBal + amount} />
          </div>
        }
        {pending && amount > 0 && <Notice kind="info">At or above {formatBDT(store.approvalLimit)} — this transfer waits for owner or principal approval before balances change.</Notice>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{pending ? 'Submit for approval' : editing ? 'Resubmit' : 'Transfer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
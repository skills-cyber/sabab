import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAccounts } from '../../contexts/AccountsContext';
import { usePayroll } from '../../contexts/PayrollContext';
import { useStaff } from '../../contexts/StaffContext';
import type { FinAccount, TxnMethod } from '../../types/accounts';
import { TODAY, formatBDT } from '../../utils/format';
import { monthLabel } from '../../utils/payroll';

export const methodFor = (a?: FinAccount): TxnMethod => a?.type === 'cash' ? 'Cash' : a?.type === 'wallet' ? a.provider ?? 'bKash' : 'Bank transfer';

interface Props {
  sheetId: string | null;
  preselect?: string[];
  onOpenChange: (o: boolean) => void;
}

/** Pay all or some staff on an approved sheet from one account. Partial amounts allowed; posts to Accounts as “Salaries”. */
export function PayDialog({ sheetId, preselect, onOpenChange }: Props) {
  const payroll = usePayroll();
  const fin = useAccounts();
  const { staff } = useStaff();
  const sheet = payroll.sheets.find((s) => s.id === sheetId);
  const due = useMemo(() => (sheet?.rows ?? []).filter((r) => r.net - r.paid > 0), [sheet]);
  const accounts = fin.accounts.filter((a) => !a.archived);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [accountId, setAccountId] = useState('dbbl');
  const [date, setDate] = useState(TODAY);
  const [reference, setReference] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetId) return;
    const init: Record<string, string> = {};
    due.forEach((r) => {if (!preselect?.length || preselect.includes(r.staffId)) init[r.staffId] = String(r.net - r.paid);});
    setPicked(init);
    setAccountId('dbbl');
    setDate(TODAY);
    setReference('');
    setErr(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId]);

  const acc = accounts.find((a) => a.id === accountId);
  const bal = acc ? fin.balanceOf(acc.id).balance : 0;
  const total = Object.values(picked).reduce((s, v) => s + (Number(v) || 0), 0);
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  const pay = () => {
    const items = Object.entries(picked).map(([staffId, v]) => ({ staffId, amount: Number(v) || 0 }));
    if (!items.length) return setErr('Select at least one person.');
    const bad = items.find((i) => {const r = due.find((x) => x.staffId === i.staffId);return !r || i.amount <= 0 || i.amount > r.net - r.paid;});
    if (bad) return setErr(`Amount for ${name(bad.staffId)} must be between ৳1 and what’s still due.`);
    if (total > bal) return setErr(`${acc?.name} has only ${formatBDT(bal)}. Transfer money in first or pay fewer people.`);
    if (acc?.type !== 'cash' && reference.trim().length < 4) return setErr('Add a bank/MFS reference (batch or TrxID).');
    const n = payroll.pay(sheetId!, items, { accountId, date, method: methodFor(acc), reference: reference.trim() || undefined });
    toast.success(`Paid ${n} staff · ${formatBDT(total)}`, { description: `Posted to ${acc?.name} as Salaries. Payslips are ready.` });
    onOpenChange(false);
  };

  const allOn = due.length > 0 && due.every((r) => picked[r.staffId] !== undefined);

  return (
    <Dialog open={!!sheet} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Pay salaries · {sheet ? monthLabel(sheet.month) : ''}</DialogTitle>
          <DialogDescription>{sheet?.id} · already approved — payments post straight to Accounts.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border">
          <label className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2 text-[12.5px] font-medium">
            <Checkbox checked={allOn} onCheckedChange={(v) => setPicked(v ? Object.fromEntries(due.map((r) => [r.staffId, String(r.net - r.paid)])) : {})} aria-label="Select all" />
            Everyone still due ({due.length})
            <span className="ml-auto tabular text-muted-foreground">Due {formatBDT(due.reduce((s, r) => s + r.net - r.paid, 0))}</span>
          </label>
          <ul className="max-h-[280px] divide-y divide-border overflow-y-auto scrollbar-thin">
            {due.map((r) => {
              const on = picked[r.staffId] !== undefined;
              const p = staff.find((s) => s.id === r.staffId);
              return (
                <li key={r.staffId} className="flex items-center gap-2 px-3 py-1.5 text-[13px]">
                  <Checkbox checked={on} aria-label={`Pay ${name(r.staffId)}`} onCheckedChange={(v) => setPicked((m) => {const n = { ...m };if (v) n[r.staffId] = String(r.net - r.paid);else delete n[r.staffId];return n;})} />
                  <div className="min-w-0 flex-1"><p className="truncate">{name(r.staffId)}</p><p className="truncate text-[11px] text-muted-foreground">{p?.payMethod} · due {formatBDT(r.net - r.paid)}</p></div>
                  <Input aria-label={`Amount for ${name(r.staffId)}`} type="number" min={1} max={r.net - r.paid} disabled={!on} value={picked[r.staffId] ?? ''} onChange={(e) => setPicked((m) => ({ ...m, [r.staffId]: e.target.value }))} className="h-8 w-28 text-right tabular" />
                </li>);

            })}
          </ul>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Pay from" htmlFor="pd-acc" className="sm:col-span-2"><SelectField id="pd-acc" value={accountId} onValueChange={setAccountId} options={accounts.map((a) => ({ value: a.id, label: `${a.name} · ${formatBDT(fin.balanceOf(a.id).balance)}` }))} /></Field>
          <Field label="Date" htmlFor="pd-date"><Input id="pd-date" type="date" max={TODAY} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          {acc?.type !== 'cash' && <Field label="Reference" required htmlFor="pd-ref" className="sm:col-span-3"><Input id="pd-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Bank batch no. / TrxID" /></Field>}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-[13px]">
          <span>{Object.keys(picked).length} selected · balance after <b className="tabular">{formatBDT(bal - total)}</b></span>
          <b className="text-[15px] tabular">{formatBDT(total)}</b>
        </div>
        {total > bal && <Notice kind="error">Not enough in {acc?.name}.</Notice>}
        {err && <p className="text-[11.5px] text-danger" role="alert">{err}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!total} onClick={pay}>Pay {formatBDT(total)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
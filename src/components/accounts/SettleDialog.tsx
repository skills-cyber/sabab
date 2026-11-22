import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAccounts } from '../../contexts/AccountsContext';
import { methodFor } from '../payroll/PayDialog';
import { TODAY, formatBDT, formatDate } from '../../utils/format';

interface Props {
  target: {partyId: string;billId?: string;} | null;
  onOpenChange: (o: boolean) => void;
}

/** Pay what we owe a party, or receive what they owe — against a specific bill or on account. */
export function SettleDialog({ target, onOpenChange }: Props) {
  const fin = useAccounts();
  const party = fin.parties.find((p) => p.id === target?.partyId);
  const balance = party ? fin.partyBalance(party.id) : 0;
  const paying = balance < 0 || (target?.billId ? fin.bills.find((b) => b.id === target.billId)?.direction === 'payable' : false);
  const openBills = useMemo(() => fin.bills.filter((b) => b.partyId === party?.id && b.status === 'open' && b.direction === (paying ? 'payable' : 'receivable') && b.amount - fin.billPaid(b.id) > 0), [fin, party?.id, paying]);
  const accounts = fin.accounts.filter((a) => !a.archived);
  const [billId, setBillId] = useState('account');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('cash-mirpur');
  const [date, setDate] = useState(TODAY);
  const [reference, setReference] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const openOf = (id: string) => {const b = fin.bills.find((x) => x.id === id);return b ? b.amount - fin.billPaid(b.id) : Math.abs(balance);};

  useEffect(() => {
    if (!target) return;
    const b = target.billId ?? 'account';
    setBillId(b);
    setAmount(String(b === 'account' ? Math.abs(balance) : openOf(b)));
    setAccountId('cash-mirpur');
    setDate(TODAY);
    setReference('');
    setErr(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const acc = accounts.find((a) => a.id === accountId);
  const bal = acc ? fin.balanceOf(acc.id).balance : 0;
  const n = Number(amount) || 0;

  const save = () => {
    if (!party) return;
    if (!(n > 0)) return setErr('Enter an amount.');
    if (billId !== 'account' && n > openOf(billId)) return setErr(`Only ${formatBDT(openOf(billId))} is open on ${billId}.`);
    if (paying && n > bal) return setErr(`${acc?.name} has only ${formatBDT(bal)}.`);
    if (acc?.type !== 'cash' && reference.trim().length < 4) return setErr('Reference required for non-cash payments.');
    const bill = fin.bills.find((b) => b.id === billId);
    const r = fin.record({
      kind: paying ? 'expense' : 'income', date, accountId, amount: n, partyId: party.id, settles: true, billId: bill?.id,
      categoryId: bill?.categoryId ?? (paying ? 'ex-misc' : 'in-other'), method: methodFor(acc), reference: reference.trim() || undefined,
      note: `${paying ? 'Payment to' : 'Received from'} ${party.name}${bill ? ` · ${bill.ref}` : ' · on account'}`
    });
    toast.success(r.pending ? `${r.voucher} sent for approval` : `${r.voucher} posted`, { description: r.pending ? 'Dues update once approved.' : `${party.name}’s balance updated.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{paying ? 'Pay due' : 'Receive due'} · {party?.name}</DialogTitle>
          <DialogDescription>{Math.round(balance) === 0 ? 'Nothing is due right now — this records an advance on account.' : `${balance < 0 ? 'You owe' : 'They owe'} ${formatBDT(Math.abs(balance))} in total.`}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Apply to" htmlFor="st-bill" className="sm:col-span-2">
            <SelectField id="st-bill" value={billId} onValueChange={(v) => {setBillId(v);setAmount(String(openOf(v)));}} options={[{ value: 'account', label: 'Overall balance (on account)' }, ...openBills.map((b) => ({ value: b.id, label: `${b.ref} · ${formatBDT(openOf(b.id))} open · due ${formatDate(b.dueDate, 'd MMM')}` }))]} />
          </Field>
          <Field label="Amount (৳)" required htmlFor="st-amt"><Input id="st-amt" data-autofocus type="number" min={1} className="tabular" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Date" htmlFor="st-date"><Input id="st-date" type="date" max={TODAY} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label={paying ? 'Pay from' : 'Receive into'} htmlFor="st-acc" className="sm:col-span-2"><SelectField id="st-acc" value={accountId} onValueChange={setAccountId} options={accounts.map((a) => ({ value: a.id, label: `${a.name} · ${formatBDT(fin.balanceOf(a.id).balance)}` }))} /></Field>
          {acc?.type !== 'cash' && <Field label="Reference" required htmlFor="st-ref" className="sm:col-span-2"><Input id="st-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TrxID / cheque no." /></Field>}
        </div>
        {n >= fin.approvalLimit && <Notice kind="info">At or above {formatBDT(fin.approvalLimit)} — waits for owner/principal approval.</Notice>}
        {err && <p className="text-[11.5px] text-danger" role="alert">{err}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{paying ? 'Pay' : 'Receive'} {n ? formatBDT(n) : ''}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
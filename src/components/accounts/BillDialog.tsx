import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { useAccounts } from '../../contexts/AccountsContext';
import { TODAY, formatBDT } from '../../utils/format';

interface Props {
  open: boolean;
  partyId?: string;
  onOpenChange: (o: boolean) => void;
}

/** Record an unpaid bill (we owe a vendor) or a receivable (a payer owes us). No money moves until it’s settled. */
export function BillDialog({ open, partyId, onOpenChange }: Props) {
  const fin = useAccounts();
  const [f, setF] = useState({ partyId: '', direction: 'payable' as 'payable' | 'receivable', date: TODAY, dueDate: '', amount: '', categoryId: '', note: '' });
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const p = fin.parties.find((x) => x.id === partyId);
    const direction = p && (p.type === 'payer' || p.type === 'donor') ? 'receivable' : 'payable';
    setF({ partyId: partyId ?? '', direction, date: TODAY, dueDate: '', amount: '', categoryId: '', note: '' });
    setErr({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, partyId]);

  const cats = fin.categories.filter((c) => !c.archived && !c.system && c.kind === (f.direction === 'payable' ? 'expense' : 'income'));

  const save = () => {
    const e: Record<string, string> = {};
    const amount = Number(f.amount);
    if (!f.partyId) e.partyId = 'Choose a party.';
    if (!(amount > 0)) e.amount = 'Enter an amount.';
    if (!f.dueDate) e.dueDate = 'Set a due date.';else
    if (f.dueDate < f.date) e.dueDate = 'Due date is before the bill date.';
    if (!f.categoryId) e.categoryId = 'Pick a category.';
    if (f.note.trim().length < 3) e.note = 'Describe what it’s for.';
    setErr(e);
    if (Object.keys(e).length) return;
    const id = fin.addBill({ partyId: f.partyId, direction: f.direction, date: f.date, dueDate: f.dueDate, amount, categoryId: f.categoryId, note: f.note.trim() });
    toast.success(`${id} recorded`, { description: `${formatBDT(amount)} ${f.direction === 'payable' ? `owed to ${fin.partyName(f.partyId)}` : `due from ${fin.partyName(f.partyId)}`} · shows in their ledger` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{f.direction === 'payable' ? 'Record bill' : 'Record receivable'}</DialogTitle>
          <DialogDescription>Adds to the party’s dues. No account balance changes until you pay or receive it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Segmented ariaLabel="Direction" value={f.direction} onChange={(d) => setF({ ...f, direction: d, categoryId: '' })} options={[{ value: 'payable', label: 'We owe them (bill)' }, { value: 'receivable', label: 'They owe us' }]} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Party" required error={err.partyId} htmlFor="bl-party" className="sm:col-span-2"><SelectField id="bl-party" value={f.partyId} placeholder="Choose party" onValueChange={(v) => setF({ ...f, partyId: v })} options={fin.parties.filter((p) => !p.archived).map((p) => ({ value: p.id, label: p.name }))} /></Field>
            <Field label="Amount (৳)" required error={err.amount} htmlFor="bl-amt"><Input id="bl-amt" data-autofocus type="number" min={1} className="tabular" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="Category" required error={err.categoryId} htmlFor="bl-cat"><SelectField id="bl-cat" value={f.categoryId} placeholder="Choose" onValueChange={(v) => setF({ ...f, categoryId: v })} options={cats.map((c) => ({ value: c.id, label: c.name }))} /></Field>
            <Field label="Bill date" htmlFor="bl-date"><Input id="bl-date" type="date" max={TODAY} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="Due date" required error={err.dueDate} htmlFor="bl-due"><Input id="bl-due" type="date" min={f.date} value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
            <Field label="Description" required error={err.note} htmlFor="bl-note" className="sm:col-span-2"><Input id="bl-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Invoice #2231 · exam stationery" /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
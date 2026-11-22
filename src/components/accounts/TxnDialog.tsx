import React, { useEffect, useState } from 'react';
import { Paperclip, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { Notice } from '../common/Notice';
import { useAccounts } from '../../contexts/AccountsContext';
import type { Party, Txn, TxnMethod } from '../../types/accounts';
import { TODAY, formatBDT } from '../../utils/format';

type Kind = 'income' | 'expense';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialKind?: Kind;
  /** Prefill account/party when opened from a panel. */
  accountId?: string;
  partyId?: string;
  /** Edit a returned entry. */
  editing?: Txn | null;
}

const METHODS: TxnMethod[] = ['Cash', 'Cheque', 'Bank transfer', 'bKash', 'Nagad'];
const NONE = 'none';
const NEW = '__new';

/** One dialog for income and expense: category, party (or quick-add), method/reference, budget + balance checks. */
export function TxnDialog({ open, onOpenChange, initialKind = 'expense', accountId, partyId, editing }: Props) {
  const store = useAccounts();
  const active = store.accounts.filter((a) => !a.archived);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [f, setF] = useState({ date: TODAY, accountId: '', categoryId: '', partyId: NONE, amount: '', method: 'Cash' as TxnMethod, reference: '', note: '', attachment: '' });
  const [np, setNp] = useState<{name: string;type: Party['type'];phone: string;} | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});

  const cats = store.categories.filter((c) => c.kind === kind && !c.archived && c.id !== 'in-fees');

  useEffect(() => {
    if (!open) return;
    setErr({});
    setNp(null);
    if (editing) {
      setKind(editing.kind as Kind);
      setF({ date: editing.date, accountId: editing.accountId, categoryId: editing.categoryId ?? '', partyId: editing.partyId ?? NONE, amount: String(editing.amount), method: editing.method ?? 'Cash', reference: editing.reference ?? '', note: editing.note ?? '', attachment: editing.attachment ?? '' });
      return;
    }
    setKind(initialKind);
    const acc = accountId ?? active.find((a) => a.type === 'cash')?.id ?? active[0]?.id ?? '';
    const accType = active.find((a) => a.id === acc);
    setF({
      date: TODAY, accountId: acc, categoryId: store.categories.find((c) => c.kind === initialKind && !c.archived && !c.system)?.id ?? '', partyId: partyId ?? NONE, amount: '',
      method: accType?.type === 'wallet' ? accType.provider ?? 'bKash' : accType?.type === 'bank' ? 'Bank transfer' : 'Cash', reference: '', note: '', attachment: ''
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, initialKind, accountId, partyId]);

  const switchKind = (k: Kind) => {
    setKind(k);
    setF((x) => ({ ...x, categoryId: store.categories.find((c) => c.kind === k && !c.archived && !c.system)?.id ?? '' }));
  };

  const amount = Number(f.amount) || 0;
  const bal = f.accountId ? store.balanceOf(f.accountId).balance : 0;
  const cat = store.categories.find((c) => c.id === f.categoryId);
  const spent = cat ? store.spendThisMonth(cat.id, true) - (editing && editing.categoryId === cat.id ? editing.amount : 0) : 0;
  const overBudget = kind === 'expense' && cat?.budget != null && amount > 0 && spent + amount > cat.budget;
  const pending = store.needsApproval(kind, amount);
  const voucherPreview = editing?.voucher ?? (kind === 'income' ? 'RV-auto' : 'PV-auto');

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.accountId) e.accountId = 'Choose an account.';
    if (!f.categoryId) e.categoryId = 'Choose a category.';
    if (!(amount > 0)) e.amount = 'Enter an amount.';else
    if (kind === 'expense' && amount > bal) e.amount = `Exceeds ${store.accountName(f.accountId)} balance (${formatBDT(bal)}).`;
    if (f.method !== 'Cash' && f.reference.trim().length < 4) e.reference = 'Reference required for non-cash payments.';
    if (np) {
      if (np.name.trim().length < 2) e.party = 'New party needs a name.';else
      if (store.parties.some((p) => p.name.toLowerCase() === np.name.trim().toLowerCase())) e.party = 'A party with this name exists — pick it from the list.';
    }
    if (kind === 'expense' && f.partyId === NONE && !np) e.party = 'Who was paid? Pick or add a party.';
    setErr(e);
    if (Object.keys(e).length) return;
    const pid = np ? store.addParty({ name: np.name.trim(), type: np.type, phone: np.phone.trim() || undefined }) : f.partyId === NONE ? undefined : f.partyId;
    const draft = { kind, date: f.date, accountId: f.accountId, amount, categoryId: f.categoryId, partyId: pid, method: f.method, reference: f.reference.trim() || undefined, note: f.note.trim() || undefined, attachment: f.attachment || undefined };
    if (editing) {
      const p = store.resubmit(editing.id, draft);
      toast.success(p ? `${editing.voucher} resubmitted for approval` : `${editing.voucher} posted`);
    } else {
      const r = store.record(draft);
      toast.success(r.pending ? `${r.voucher} sent for approval` : `${kind === 'income' ? 'Income' : 'Expense'} posted`, { description: r.pending ? `Entries of ${formatBDT(store.approvalLimit)} or more need owner/principal approval.` : `${r.voucher} · ${formatBDT(amount)} · ${store.accountName(f.accountId)}` });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.voucher}` : kind === 'income' ? 'Record income' : 'Record expense'}</DialogTitle>
          <DialogDescription>Posted entries can't be edited — only reversed with a reason. Fee receipts are recorded in Fees.</DialogDescription>
        </DialogHeader>
        {editing?.status === 'returned' && editing.history.at(-1)?.note && <Notice kind="warning">Returned: “{editing.history.at(-1)?.note}”</Notice>}
        <div className="space-y-3">
          {!editing &&
          <Segmented ariaLabel="Entry type" value={kind} onChange={switchKind} options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} />
          }
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date" htmlFor="tx-date"><Input id="tx-date" type="date" max={TODAY} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="Voucher no." htmlFor="tx-v" hint="Assigned on save"><Input id="tx-v" value={voucherPreview} disabled className="tabular" /></Field>
            <Field label={kind === 'income' ? 'Received into' : 'Paid from'} required error={err.accountId} htmlFor="tx-acc">
              <SelectField id="tx-acc" value={f.accountId} onValueChange={(v) => setF({ ...f, accountId: v })} options={active.map((a) => ({ value: a.id, label: `${a.name} · ${formatBDT(store.balanceOf(a.id).balance)}` }))} />
            </Field>
            <Field label="Category" required error={err.categoryId} htmlFor="tx-cat" hint={kind === 'expense' && cat?.budget ? `${formatBDT(spent)} of ${formatBDT(cat.budget)} used this month` : undefined}>
              <SelectField id="tx-cat" value={f.categoryId} placeholder="Choose category" onValueChange={(v) => setF({ ...f, categoryId: v })} options={cats.map((c) => ({ value: c.id, label: c.name }))} />
            </Field>
            {!np ?
            <Field label={kind === 'income' ? 'Received from' : 'Paid to'} required={kind === 'expense'} error={err.party} htmlFor="tx-party" className="sm:col-span-2">
                <SelectField
                id="tx-party"
                value={f.partyId}
                onValueChange={(v) => v === NEW ? setNp({ name: '', type: kind === 'income' ? 'payer' : 'vendor', phone: '' }) : setF({ ...f, partyId: v })}
                options={[{ value: NONE, label: kind === 'income' ? 'Not specified' : 'Select party…' }, ...store.parties.filter((p) => !p.archived).map((p) => ({ value: p.id, label: p.name })), { value: NEW, label: '+ New party' }]} />
              
              </Field> :

            <div className="rounded-lg border border-dashed border-primary/40 bg-accent/30 p-3 sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold"><Plus className="size-3.5 text-primary" /> New party</p>
                  <Button size="icon-sm" variant="ghost" aria-label="Cancel new party" onClick={() => setNp(null)}><X className="size-3.5" /></Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_120px_140px]">
                  <Input aria-label="Party name" className="h-8" autoFocus value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} placeholder="Name" />
                  <SelectField size="sm" ariaLabel="Party type" value={np.type} onValueChange={(v) => setNp({ ...np, type: v as Party['type'] })} options={[{ value: 'vendor', label: 'Vendor' }, { value: 'payer', label: 'Payer' }, { value: 'donor', label: 'Donor' }, { value: 'staff', label: 'Staff' }]} />
                  <Input aria-label="Party phone" className="h-8 tabular" inputMode="tel" value={np.phone} onChange={(e) => setNp({ ...np, phone: e.target.value })} placeholder="Phone (optional)" />
                </div>
                {err.party && <p className="mt-1 text-[11.5px] text-danger" role="alert">{err.party}</p>}
              </div>
            }
            <Field label="Amount (৳)" required error={err.amount} htmlFor="tx-amt"><Input id="tx-amt" data-autofocus type="number" min={0} inputMode="numeric" className="tabular" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="Method" htmlFor="tx-m"><SelectField id="tx-m" value={f.method} onValueChange={(v) => setF({ ...f, method: v as TxnMethod })} options={METHODS.map((m) => ({ value: m, label: m }))} /></Field>
            {f.method !== 'Cash' &&
            <Field label={f.method === 'Cheque' ? 'Cheque no.' : 'Reference / TrxID'} required error={err.reference} htmlFor="tx-ref" className="sm:col-span-2"><Input id="tx-ref" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>
            }
            <Field label="Note" htmlFor="tx-note" className="sm:col-span-2"><Input id="tx-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="What was this for?" /></Field>
            <div className="sm:col-span-2">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 text-[12.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                <Paperclip className="size-3.5" />
                {f.attachment ? <span className="max-w-[220px] truncate text-foreground">{f.attachment}</span> : 'Attach receipt (simulated)'}
                <input type="file" className="sr-only" accept="image/*,.pdf" onChange={(e) => setF({ ...f, attachment: e.target.files?.[0]?.name ?? '' })} />
              </label>
            </div>
          </div>
          {overBudget && cat && <Notice kind="warning">This takes {cat.name} to {formatBDT(spent + amount)} — over its {formatBDT(cat.budget ?? 0)} monthly budget.</Notice>}
          {pending && amount > 0 && <Notice kind="info">At or above {formatBDT(store.approvalLimit)} — waits for owner or principal approval before posting.</Notice>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{pending ? 'Submit for approval' : editing ? 'Resubmit & post' : 'Post entry'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
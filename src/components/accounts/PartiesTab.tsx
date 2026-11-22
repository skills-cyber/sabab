import React, { useEffect, useMemo, useState } from 'react';
import { Archive, ArchiveRestore, ArrowDownLeft, ArrowUpRight, Ban, Eye, FilePlus2, HandCoins, Pencil, Plus, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { ToneChip } from '../common/StatusBadge';
import { Segmented } from '../common/Segmented';
import { KpiStrip } from '../common/KpiStrip';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/Sheet';
import { BalanceCard } from '../ledger/BalanceCard';
import { LedgerTable } from '../ledger/LedgerTable';
import { StatementDialog } from '../ledger/StatementDialog';
import { BillDialog } from './BillDialog';
import { SettleDialog } from './SettleDialog';
import { useAccounts } from '../../contexts/AccountsContext';
import type { Bill, Party } from '../../types/accounts';
import { TODAY, formatBDT, formatDate, isValidBdPhone } from '../../utils/format';
import { cn } from '../../utils/cn';

type Filter = 'all' | 'due' | Party['type'] | 'archived';
const TYPE_TONE = { vendor: 'info', payer: 'success', donor: 'primary', staff: 'neutral' } as const;
const TYPE_LABEL = { vendor: 'Vendor', payer: 'Payer', donor: 'Donor', staff: 'Staff' };
const LABELS: [string, string] = ['They owe you', 'You owe them'];

interface Props {
  addOpen: boolean;
  setAddOpen: (o: boolean) => void;
  onRecord: (kind: 'income' | 'expense', partyId: string) => void;
}

/** Vendors, payers, donors and staff with opening balances, bills, dues and a running ledger (HisabIQ style). */
export function PartiesTab({ addOpen, setAddOpen, onRecord }: Props) {
  const store = useAccounts();
  const [filter, setFilter] = useState<Filter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Party | null>(null);
  const [f, setF] = useState({ name: '', type: 'vendor' as Party['type'], phone: '', note: '', opening: '', openingDirection: 'payable' as 'payable' | 'receivable', openingDate: TODAY });
  const [err, setErr] = useState<Record<string, string>>({});
  const [bill, setBill] = useState<{open: boolean;partyId?: string;}>({ open: false });
  const [settle, setSettle] = useState<{partyId: string;billId?: string;} | null>(null);
  const [cancelBill, setCancelBill] = useState<Bill | null>(null);
  const [range, setRange] = useState<{from: string;to: string;} | null>(null);
  const dialogOpen = addOpen || !!edit;

  useEffect(() => {
    if (!dialogOpen) return;
    setErr({});
    setF(edit ?
    { name: edit.name, type: edit.type, phone: edit.phone ?? '', note: edit.note ?? '', opening: edit.opening ? String(edit.opening) : '', openingDirection: edit.openingDirection ?? 'payable', openingDate: edit.openingDate ?? TODAY } :
    { name: '', type: 'vendor', phone: '', note: '', opening: '', openingDirection: 'payable', openingDate: TODAY });
  }, [dialogOpen, edit]);

  const totals = useMemo(() => {
    const m: Record<string, {paid: number;received: number;last?: string;}> = {};
    store.txns.forEach((t) => {
      if (!t.partyId || t.status !== 'posted') return;
      const x = m[t.partyId] ??= { paid: 0, received: 0 };
      if (t.kind === 'expense') x.paid += t.amount;
      if (t.kind === 'income') x.received += t.amount;
      if (!x.last || t.date > x.last) x.last = t.date;
    });
    return m;
  }, [store.txns]);

  const balances = useMemo(() => Object.fromEntries(store.parties.map((p) => [p.id, store.partyBalance(p.id)])), [store]);
  const payable = Object.values(balances).filter((b) => b < 0).reduce((s, b) => s - b, 0);
  const receivable = Object.values(balances).filter((b) => b > 0).reduce((s, b) => s + b, 0);
  const overdueBills = store.bills.filter((b) => b.status === 'open' && b.dueDate < TODAY && b.amount - store.billPaid(b.id) > 0);

  const rows = store.parties.filter((p) => {
    if (filter === 'archived') return p.archived;
    if (p.archived) return false;
    if (filter === 'due') return Math.round(balances[p.id]) !== 0;
    return filter === 'all' || p.type === filter;
  });
  const view = store.parties.find((p) => p.id === viewId) ?? null;
  const ledger = view ? store.partyLedger(view.id) : [];
  const viewBills = view ? store.bills.filter((b) => b.partyId === view.id && b.status === 'open' && b.amount - store.billPaid(b.id) > 0) : [];

  const BalanceChip = ({ b }: {b: number;}) => Math.round(b) === 0 ?
  <span className="text-subtle">Settled</span> :
  <span className={cn('tabular font-medium', b < 0 ? 'text-danger' : 'text-success')}>{formatBDT(Math.abs(b))}<span className="block text-[11px] font-normal text-muted-foreground">{b < 0 ? 'You owe' : 'They owe'}</span></span>;

  const columns: Column<Party>[] = [
  { id: 'name', header: 'Party', sortValue: (p) => p.name, cell: (p) => <div><p className="font-medium">{p.name}</p><p className="text-[11.5px] text-muted-foreground tabular">{p.phone ?? '—'}</p></div> },
  { id: 'type', header: 'Type', cell: (p) => <ToneChip tone={TYPE_TONE[p.type]}>{TYPE_LABEL[p.type]}</ToneChip> },
  { id: 'balance', header: 'Balance', align: 'right', sortValue: (p) => balances[p.id], cell: (p) => <BalanceChip b={balances[p.id]} /> },
  { id: 'paid', header: 'Paid to', align: 'right', mobileHidden: true, sortValue: (p) => totals[p.id]?.paid ?? 0, cell: (p) => totals[p.id]?.paid ? <span className="tabular">{formatBDT(totals[p.id].paid)}</span> : <span className="text-subtle">—</span> },
  { id: 'received', header: 'Received from', align: 'right', mobileHidden: true, sortValue: (p) => totals[p.id]?.received ?? 0, cell: (p) => totals[p.id]?.received ? <span className="tabular">{formatBDT(totals[p.id].received)}</span> : <span className="text-subtle">—</span> },
  { id: 'last', header: 'Last entry', mobileHidden: true, hideable: true, sortValue: (p) => totals[p.id]?.last ?? '', cell: (p) => <span className="text-muted-foreground">{totals[p.id]?.last ? formatDate(totals[p.id].last ?? '', 'd MMM') : '—'}</span> },
  {
    id: 'note', header: 'Note', hideable: true, defaultHidden: true, mobileHidden: true, cell: (p) => <span className="text-[12.5px] text-muted-foreground">{p.note ?? '—'}</span>,
    edit: { value: (p) => p.note ?? '', lockedReason: () => store.canRecord ? null : 'Only finance staff can edit parties.', onSave: (p, v) => store.updateParty(p.id, { note: v.trim() || undefined }) }
  }];


  const save = () => {
    const e: Record<string, string> = {};
    const name = f.name.trim();
    const opening = Number(f.opening) || 0;
    if (name.length < 2) e.name = 'Name is required.';else
    if (store.parties.some((p) => p.id !== edit?.id && p.name.toLowerCase() === name.toLowerCase())) e.name = 'A party with this name already exists.';
    if (f.phone.trim() && !isValidBdPhone(f.phone) && !/^\d{5}$/.test(f.phone.trim())) e.phone = 'Enter an 11-digit mobile or a 5-digit hotline.';
    if (opening < 0) e.opening = 'Cannot be negative.';
    setErr(e);
    if (Object.keys(e).length) return;
    const payload = { name, type: f.type, phone: f.phone.trim() || undefined, note: f.note.trim() || undefined, opening: opening || undefined, openingDirection: opening ? f.openingDirection : undefined, openingDate: opening ? f.openingDate : undefined };
    if (edit) {
      store.updateParty(edit.id, payload, edit.opening !== payload.opening ? 'Party opening balance changed' : 'Party updated');
      toast.success('Party updated');
      setEdit(null);
    } else {
      store.addParty(payload);
      toast.success(`${name} added`, { description: opening ? `Opening balance ${formatBDT(opening)} (${f.openingDirection === 'payable' ? 'you owe them' : 'they owe you'})` : undefined });
      setAddOpen(false);
    }
  };

  const count = (t: Party['type']) => store.parties.filter((p) => !p.archived && p.type === t).length;
  const dueCount = store.parties.filter((p) => !p.archived && Math.round(balances[p.id]) !== 0).length;

  return (
    <div className="space-y-4">
      <KpiStrip items={[
      { label: 'You owe (payable)', value: formatBDT(payable), tone: payable ? 'danger' : 'success', icon: ArrowUpRight, onClick: () => setFilter('due') },
      { label: 'Owed to you (receivable)', value: formatBDT(receivable), tone: receivable ? 'warning' : 'success', icon: ArrowDownLeft, onClick: () => setFilter('due') },
      { label: 'Open bills', value: store.bills.filter((b) => b.status === 'open' && b.amount - store.billPaid(b.id) > 0).length, icon: FilePlus2, tone: 'info' },
      { label: 'Overdue bills', value: overdueBills.length, sub: overdueBills.length ? formatBDT(overdueBills.reduce((s, b) => s + b.amount - store.billPaid(b.id), 0)) : 'None', icon: Scale, tone: overdueBills.length ? 'danger' : 'success' }]
      } />
      <DataTable
        ariaLabel="Parties"
        rows={rows}
        columns={columns}
        getRowId={(p) => p.id}
        onRowClick={(p) => setViewId(p.id)}
        searchText={(p) => `${p.name} ${p.phone ?? ''} ${p.note ?? ''}`}
        searchPlaceholder="Name or phone…"
        toolbar={<Segmented ariaLabel="Party type" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'due', label: 'Due', count: dueCount }, { value: 'vendor', label: 'Vendors', count: count('vendor') }, { value: 'payer', label: 'Payers', count: count('payer') }, { value: 'donor', label: 'Donors', count: count('donor') }, { value: 'staff', label: 'Staff', count: count('staff') }, { value: 'archived', label: 'Archived' }]} />}
        toolbarRight={store.canRecord ? <Button size="sm" variant="outline" onClick={() => setBill({ open: true })}><FilePlus2 className="size-4" /> Record bill</Button> : undefined}
        rowActions={(p) => [
        { label: 'Open ledger', icon: Eye, onSelect: () => setViewId(p.id) },
        { label: balances[p.id] > 0 ? 'Receive due' : 'Pay due', icon: HandCoins, disabled: p.archived || !store.canRecord || Math.round(balances[p.id]) === 0, onSelect: () => setSettle({ partyId: p.id }) },
        { label: 'Record bill / receivable', icon: FilePlus2, disabled: p.archived || !store.canRecord, onSelect: () => setBill({ open: true, partyId: p.id }) },
        { label: 'Cash purchase (paid now)', icon: ArrowUpRight, separatorBefore: true, disabled: p.archived || !store.canRecord, onSelect: () => onRecord('expense', p.id) },
        { label: 'Cash receipt (received now)', icon: ArrowDownLeft, disabled: p.archived || !store.canRecord, onSelect: () => onRecord('income', p.id) },
        { label: 'Edit party', icon: Pencil, disabled: !store.canRecord, onSelect: () => setEdit(p) },
        p.archived ?
        { label: 'Restore', icon: ArchiveRestore, separatorBefore: true, disabled: !store.canRecord, onSelect: () => {store.updateParty(p.id, { archived: false }, 'Party restored');toast.success(`${p.name} restored`);} } :
        { label: 'Archive', icon: Archive, destructive: true, separatorBefore: true, disabled: !store.canRecord || Math.round(balances[p.id]) !== 0, onSelect: () => {store.updateParty(p.id, { archived: true }, 'Party archived');toast.success(`${p.name} archived`, { description: 'History is kept.', action: { label: 'Undo', onClick: () => store.updateParty(p.id, { archived: false }, 'Party restored') } });} }]
        }
        emptyTitle={filter === 'archived' ? 'No archived parties' : filter === 'due' ? 'Nothing due' : 'No parties yet'}
        emptyHint={filter === 'all' ? 'Add the vendors you pay and the people or organisations who pay the school.' : undefined}
        emptyAction={filter === 'all' && store.canRecord ? <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add party</Button> : undefined}
        footerNote="Balance = opening + bills − payments · posted entries only · parties with a balance can’t be archived" />
      

      <Sheet open={!!view} onOpenChange={(o) => !o && setViewId(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          {view &&
          <>
              <SheetHeader className="border-b border-border">
                <SheetTitle className="flex items-center gap-2">{view.name} <ToneChip tone={TYPE_TONE[view.type]}>{TYPE_LABEL[view.type]}</ToneChip></SheetTitle>
                <SheetDescription>{view.phone ?? 'No phone'}{view.note ? ` · ${view.note}` : ''}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <BalanceCard balance={balances[view.id]} positiveLabel="They owe you" negativeLabel="You owe them" hint={view.opening ? `Includes opening ${formatBDT(view.opening)} as of ${formatDate(view.openingDate ?? TODAY)}` : undefined} />
                  {store.canRecord && !view.archived &&
                <div className="flex flex-wrap gap-2 sm:flex-col">
                      <Button size="sm" disabled={Math.round(balances[view.id]) === 0} onClick={() => setSettle({ partyId: view.id })}><HandCoins className="size-4" /> {balances[view.id] > 0 ? 'Receive due' : 'Pay due'}</Button>
                      <Button size="sm" variant="outline" onClick={() => setBill({ open: true, partyId: view.id })}><FilePlus2 className="size-4" /> Bill</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEdit(view)}><Pencil className="size-4" /> Edit</Button>
                    </div>
                }
                </div>
                {viewBills.length > 0 &&
              <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">Open bills</p>
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {viewBills.map((b) => {
                    const open = b.amount - store.billPaid(b.id);
                    const late = b.dueDate < TODAY;
                    return (
                      <li key={b.id} className="flex items-center gap-2 px-3 py-2 text-[13px]">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{b.ref} · {b.note}</p>
                              <p className={cn('text-[11.5px]', late ? 'text-danger' : 'text-muted-foreground')}>{b.direction === 'payable' ? 'You owe' : 'They owe'} · due {formatDate(b.dueDate, 'd MMM')}{late ? ' · overdue' : ''}{open < b.amount ? ` · ${formatBDT(b.amount - open)} settled` : ''}</p>
                            </div>
                            <span className="tabular font-medium">{formatBDT(open)}</span>
                            {store.canRecord && <Button size="xs" variant="outline" onClick={() => setSettle({ partyId: view.id, billId: b.id })}>{b.direction === 'payable' ? 'Pay' : 'Receive'}</Button>}
                            {store.canRecord && open === b.amount && <Button size="icon-xs" variant="ghost" aria-label={`Cancel ${b.ref}`} onClick={() => setCancelBill(b)}><Ban className="size-3.5" /></Button>}
                          </li>);

                  })}
                    </ul>
                  </div>
              }
                <LedgerTable rows={ledger} debitLabel="Debit" creditLabel="Credit" balanceLabels={LABELS} filename={`ledger-${view.name.replace(/\s+/g, '-')}.csv`} onPrint={setRange} emptyText="No entries with this party yet." />
                <p className="text-[11.5px] text-muted-foreground">Debit = bills they owe you, or payments you made. Credit = bills you owe them, or money they paid. Cash purchases appear on both sides and don’t change the balance.</p>
              </div>
            </>
          }
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={(o) => {if (!o) {setAddOpen(false);setEdit(null);}}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{edit ? `Edit ${edit.name}` : 'Add party'}</DialogTitle>
            <DialogDescription>Vendors you pay, and payers or donors who pay the school.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" required error={err.name} htmlFor="pt-n" className="sm:col-span-2"><Input id="pt-n" data-autofocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Type" htmlFor="pt-t"><SelectField id="pt-t" value={f.type} onValueChange={(v) => setF({ ...f, type: v as Party['type'] })} options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))} /></Field>
            <Field label="Phone" error={err.phone} htmlFor="pt-p"><Input id="pt-p" inputMode="tel" className="tabular" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="01XXX-XXXXXX" /></Field>
            <Field label="Note" htmlFor="pt-note" className="sm:col-span-2"><Input id="pt-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Account no., terms" /></Field>
            <fieldset className="grid gap-3 rounded-lg border border-border p-3 sm:col-span-2 sm:grid-cols-2">
              <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-subtle">Opening balance</legend>
              <Field label="Amount (৳)" error={err.opening} htmlFor="pt-op"><Input id="pt-op" type="number" min={0} className="tabular" value={f.opening} onChange={(e) => setF({ ...f, opening: e.target.value })} placeholder="0" /></Field>
              <Field label="As of" htmlFor="pt-od"><Input id="pt-od" type="date" max={TODAY} value={f.openingDate} onChange={(e) => setF({ ...f, openingDate: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Segmented ariaLabel="Opening direction" size="sm" value={f.openingDirection} onChange={(v) => setF({ ...f, openingDirection: v })} options={[{ value: 'payable', label: 'You owe them' }, { value: 'receivable', label: 'They owe you' }]} /></div>
            </fieldset>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {setAddOpen(false);setEdit(null);}}>Cancel</Button>
            <Button onClick={save}>{edit ? 'Save' : 'Add party'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BillDialog open={bill.open} partyId={bill.partyId} onOpenChange={(o) => setBill((s) => ({ ...s, open: o }))} />
      <SettleDialog target={settle} onOpenChange={(o) => !o && setSettle(null)} />
      <ConfirmDialog open={!!cancelBill} onOpenChange={(o) => !o && setCancelBill(null)} title={`Cancel ${cancelBill?.ref}?`} description="Removes it from the party’s dues. Kept in the audit log." confirmLabel="Cancel bill" destructive reasonLabel="Reason" onConfirm={(r) => {if (cancelBill) {store.cancelBill(cancelBill.id, r);toast.success(`${cancelBill.ref} cancelled`);}}} />
      {view && <StatementDialog open={!!range} onOpenChange={(o) => !o && setRange(null)} name={view.name} subtitle={`${TYPE_LABEL[view.type]}${view.phone ? ` · ${view.phone}` : ''}`} rows={ledger} range={range ?? { from: '', to: '' }} debitLabel="Debit" creditLabel="Credit" balanceLabels={LABELS} />}
    </div>);

}
import React, { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, Lock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { Segmented } from '../common/Segmented';
import { Field } from '../common/Field';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useAccounts } from '../../contexts/AccountsContext';
import type { Category } from '../../types/accounts';
import { formatBDT } from '../../utils/format';
import { cn } from '../../utils/cn';
import { CURRENT_MONTH } from './useAccounts';

interface Props {
  addOpen: boolean;
  setAddOpen: (o: boolean) => void;
}

/** Income & expense ledger heads with monthly budgets and spend-vs-budget bars. */
export function CategoriesTab({ addOpen, setAddOpen }: Props) {
  const store = useAccounts();
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [showArchived, setShowArchived] = useState(false);
  const [f, setF] = useState({ name: '', budget: '' });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (addOpen) {setF({ name: '', budget: '' });setErr(null);}
  }, [addOpen]);

  const incomeThisMonth = (id: string) => id === 'in-fees' ?
  store.lines.filter((l) => l.kind === 'fee' && l.status === 'posted' && l.date.startsWith(CURRENT_MONTH)).reduce((s, l) => s + l.amount, 0) :
  store.txns.filter((t) => t.kind === 'income' && t.categoryId === id && t.status === 'posted' && t.date.startsWith(CURRENT_MONTH)).reduce((s, t) => s + t.amount, 0);

  const rows = store.categories.filter((c) => c.kind === kind && c.archived === showArchived);
  const totalBudget = rows.reduce((s, c) => s + (c.budget ?? 0), 0);
  const totalSpent = rows.reduce((s, c) => s + store.spendThisMonth(c.id), 0);

  const columns: Column<Category>[] = [
  {
    id: 'name', header: 'Category', sortValue: (c) => c.name, cell: (c) => <span className="inline-flex items-center gap-1.5 font-medium">{c.name}{c.system && <Lock className="size-3 text-subtle" aria-label="System category" />}</span>,
    edit: { value: (c) => c.name, lockedReason: (c) => !store.canRecord ? 'Only finance staff can rename categories.' : c.system ? 'System categories cannot be renamed.' : null, onSave: (c, v) => {const n = v.trim();if (n.length < 3) return 'Min 3 characters';if (store.categories.some((x) => x.id !== c.id && x.kind === c.kind && x.name.toLowerCase() === n.toLowerCase())) return 'Already exists';store.updateCategory(c.id, { name: n }, 'Category renamed');} }
  },
  { id: 'entries', header: 'Entries', align: 'right', mobileHidden: true, sortValue: (c) => store.txns.filter((t) => t.categoryId === c.id).length, cell: (c) => <span className="tabular text-muted-foreground">{c.id === 'in-fees' ? 'Fees' : store.txns.filter((t) => t.categoryId === c.id).length}</span> },
  ...(kind === 'expense' ?
  [
  {
    id: 'budget', header: 'Budget / month', align: 'right' as const, sortValue: (c: Category) => c.budget ?? 0, cell: (c: Category) => <span className="tabular">{c.budget ? formatBDT(c.budget) : '—'}</span>,
    edit: { value: (c: Category) => String(c.budget ?? ''), type: 'number' as const, lockedReason: () => store.canRecord ? null : 'Only finance staff can set budgets.', onSave: (c: Category, v: string) => {const n = Number(v);if (!Number.isFinite(n) || n < 0) return 'Enter ৳0 or more';store.updateCategory(c.id, { budget: n || undefined }, 'Budget changed');} }
  },
  {
    id: 'spend', header: `Spent · ${new Date(`${CURRENT_MONTH}-01`).toLocaleString('en', { month: 'short' })}`, sortValue: (c: Category) => store.spendThisMonth(c.id), cell: (c: Category) => {
      const spent = store.spendThisMonth(c.id);
      const pct = c.budget ? Math.round(spent / c.budget * 100) : 0;
      return (
        <div className="flex min-w-[160px] items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className={cn('block h-full rounded-full', pct > 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-primary')} style={{ width: `${Math.min(100, pct)}%` }} /></span>
                  <span className={cn('w-[88px] text-right text-[12px] tabular', pct > 100 && 'font-semibold text-danger')}>{formatBDT(spent)}{c.budget ? <span className="text-muted-foreground"> · {pct}%</span> : ''}</span>
                </div>);

    }
  }] as
  Column<Category>[] :
  [{ id: 'received', header: 'Received this month', align: 'right', sortValue: (c: Category) => incomeThisMonth(c.id), cell: (c: Category) => <span className="tabular text-success">{formatBDT(incomeThisMonth(c.id))}</span> }] as Column<Category>[])];


  const save = () => {
    const name = f.name.trim();
    const budget = Number(f.budget);
    if (name.length < 3) return setErr('Name is required (min 3 characters).');
    if (store.categories.some((c) => c.kind === kind && c.name.toLowerCase() === name.toLowerCase())) return setErr('This category already exists.');
    if (f.budget && (!Number.isFinite(budget) || budget < 0)) return setErr('Budget must be ৳0 or more.');
    store.addCategory({ name, kind, budget: kind === 'expense' && budget > 0 ? budget : undefined });
    toast.success(`${name} added`);
    setAddOpen(false);
  };

  return (
    <>
      <DataTable
        ariaLabel="Categories"
        rows={rows}
        columns={columns}
        getRowId={(c) => c.id}
        searchText={(c) => c.name}
        searchPlaceholder="Category…"
        toolbar={
        <>
            <Segmented ariaLabel="Category kind" value={kind} onChange={setKind} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />
            <Segmented ariaLabel="Show" size="sm" value={showArchived ? 'archived' : 'active'} onChange={(v) => setShowArchived(v === 'archived')} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />
          </>
        }
        rowActions={(c) => {
          const used = store.categoryInUse(c.id) || c.id === 'in-fees';
          return [
          c.archived ?
          { label: 'Restore', icon: ArchiveRestore, disabled: !store.canRecord, onSelect: () => {store.updateCategory(c.id, { archived: false }, 'Category restored');toast.success(`${c.name} restored`);} } :
          {
            label: c.system ? 'System category' : used ? 'Archive (keeps history)' : 'Archive', icon: Archive, destructive: true, disabled: !store.canRecord || !!c.system,
            onSelect: () => {store.updateCategory(c.id, { archived: true }, 'Category archived');toast.success(`${c.name} archived`, { description: used ? 'Past entries keep this category; it is hidden from new entries.' : undefined, action: { label: 'Undo', onClick: () => store.updateCategory(c.id, { archived: false }, 'Category restored') } });}
          }];

        }}
        emptyTitle={showArchived ? 'No archived categories' : 'No categories'}
        emptyAction={!showArchived && store.canRecord ? <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add category</Button> : undefined}
        footerNote={kind === 'expense' ? `Budget ${formatBDT(totalBudget)} · spent ${formatBDT(totalSpent)} this month` : 'Fee collection is fed automatically from Fees'} />
      

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add {kind} category</DialogTitle>
            <DialogDescription>Categories in use can be archived but never deleted, so reports stay complete.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Segmented ariaLabel="Category kind" value={kind} onChange={setKind} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />
            <Field label="Name" required htmlFor="cat-n"><Input id="cat-n" data-autofocus value={f.name} onChange={(e) => {setF({ ...f, name: e.target.value });setErr(null);}} placeholder={kind === 'expense' ? 'e.g. Internet & phone' : 'e.g. Sports day sponsorship'} /></Field>
            {kind === 'expense' && <Field label="Monthly budget (৳)" htmlFor="cat-b" hint="Optional — warns when an expense goes over"><Input id="cat-b" type="number" min={0} className="tabular" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></Field>}
            {err && <p className="text-[11.5px] text-danger" role="alert">{err}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={save}>Add category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

}
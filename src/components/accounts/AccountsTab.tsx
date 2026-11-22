import React, { useState } from 'react';
import { Archive, ArchiveRestore, ArrowRightLeft, Banknote, Eye, Landmark, Pencil, Plus, Scale, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge, ToneChip } from '../common/StatusBadge';
import { Segmented } from '../common/Segmented';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { useAccounts } from '../../contexts/AccountsContext';
import { campuses } from '../../data/school';
import type { FinAccount } from '../../types/accounts';
import { formatBDT, formatDate } from '../../utils/format';
import { maskNumber } from './useAccounts';

interface Props {
  onAdd: () => void;
  onEdit: (a: FinAccount) => void;
  onView: (a: FinAccount) => void;
  onTransfer: (fromId: string) => void;
  onReconcile: (a: FinAccount) => void;
}

const TYPE_ICON = { cash: Banknote, bank: Landmark, wallet: Smartphone };

/** Register of all cash, bank and wallet accounts with balances, reconciliation state and archive. */
export function AccountsTab({ onAdd, onEdit, onView, onTransfer, onReconcile }: Props) {
  const store = useAccounts();
  const [show, setShow] = useState<'active' | 'archived'>('active');
  const [archive, setArchive] = useState<FinAccount | null>(null);
  const rows = store.accounts.filter((a) => show === 'active' ? !a.archived : a.archived);
  const archBal = archive ? store.balanceOf(archive.id).balance : 0;

  if (store.accounts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title="No accounts yet" hint="Add your main cash drawer first, then your bank accounts and bKash/Nagad wallets." action={store.canRecord ? <Button size="sm" onClick={onAdd}><Plus className="size-4" /> Add first account</Button> : undefined} />
      </div>);

  }

  const columns: Column<FinAccount>[] = [
  {
    id: 'name', header: 'Account', sortValue: (a) => a.name, cell: (a) => {
      const Icon = TYPE_ICON[a.type];
      return (
        <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><Icon className="size-4" /></span>
            <div className="min-w-0"><p className="truncate font-medium">{a.name}</p><p className="truncate text-[11.5px] text-muted-foreground">{a.type === 'bank' ? `${a.bank} · ${maskNumber(a.number)}` : a.type === 'wallet' ? `${a.provider} · ${maskNumber(a.number)}` : 'Cash drawer'}</p></div>
          </div>);

    },
    edit: { value: (a) => a.name, lockedReason: () => store.canRecord ? null : 'Only the accountant or owner can rename accounts.', onSave: (a, v) => {const n = v.trim();if (n.length < 3) return 'Min 3 characters';if (store.accounts.some((x) => x.id !== a.id && x.name.toLowerCase() === n.toLowerCase())) return 'Name already used';store.updateAccount(a.id, { name: n }, 'Account renamed');} }
  },
  { id: 'type', header: 'Type', cell: (a) => <ToneChip tone={a.type === 'cash' ? 'neutral' : a.type === 'bank' ? 'info' : 'primary'}>{a.type === 'cash' ? 'Cash' : a.type === 'bank' ? 'Bank' : 'Wallet'}</ToneChip> },
  { id: 'campus', header: 'Campus', mobileHidden: true, cell: (a) => campuses.find((c) => c.id === a.campusId)?.short },
  { id: 'in', header: 'In', align: 'right', hideable: true, mobileHidden: true, cell: (a) => <span className="tabular text-success">+{formatBDT(store.balanceOf(a.id).inflow)}</span> },
  { id: 'out', header: 'Out', align: 'right', hideable: true, mobileHidden: true, cell: (a) => <span className="tabular text-danger">−{formatBDT(store.balanceOf(a.id).outflow)}</span> },
  { id: 'balance', header: 'Balance', align: 'right', sortValue: (a) => store.balanceOf(a.id).balance, cell: (a) => <span className="font-semibold tabular">{formatBDT(store.balanceOf(a.id).balance)}</span> },
  { id: 'rec', header: 'Reconciled', cell: (a) => a.reconciledTo ? <StatusBadge status="verified" label={`To ${formatDate(a.reconciledTo, 'd MMM')}`} /> : <StatusBadge status="pending" label="Not yet" /> }];


  return (
    <div className="space-y-3">
      <DataTable
        ariaLabel="Accounts"
        rows={rows}
        columns={columns}
        getRowId={(a) => a.id}
        onRowClick={onView}
        searchText={(a) => `${a.name} ${a.bank ?? ''} ${a.provider ?? ''}`}
        searchPlaceholder="Account or bank…"
        toolbar={<Segmented ariaLabel="Show" value={show} onChange={setShow} options={[{ value: 'active', label: 'Active', count: store.accounts.filter((a) => !a.archived).length }, { value: 'archived', label: 'Archived', count: store.accounts.filter((a) => a.archived).length }]} />}
        rowActions={(a) => [
        { label: 'Open statement', icon: Eye, onSelect: () => onView(a) },
        { label: 'Transfer out', icon: ArrowRightLeft, disabled: a.archived || !store.canRecord, onSelect: () => onTransfer(a.id) },
        { label: 'Reconcile', icon: Scale, disabled: a.archived || !store.canRecord, onSelect: () => onReconcile(a) },
        { label: 'Edit details', icon: Pencil, disabled: !store.canRecord, onSelect: () => onEdit(a) },
        a.archived ?
        { label: 'Restore account', icon: ArchiveRestore, separatorBefore: true, disabled: !store.canRecord, onSelect: () => {store.updateAccount(a.id, { archived: false }, 'Account restored');toast.success(`${a.name} restored`);} } :
        { label: 'Archive account', icon: Archive, destructive: true, separatorBefore: true, disabled: !store.canRecord, onSelect: () => setArchive(a) }]
        }
        emptyTitle={show === 'archived' ? 'No archived accounts' : 'No active accounts'}
        emptyAction={show === 'active' && store.canRecord ? <Button size="sm" onClick={onAdd}><Plus className="size-4" /> Add account</Button> : undefined}
        footerNote="Account numbers are always masked" />
      
      <Notice kind="preview">Importing bank and wallet statements for automatic matching needs the backend. Reconcile manually by entering the statement balance.</Notice>

      <ConfirmDialog
        open={!!archive}
        onOpenChange={(o) => !o && setArchive(null)}
        title={archBal !== 0 ? `${archive?.name} still holds ${formatBDT(archBal)}` : `Archive ${archive?.name}?`}
        description={archBal !== 0 ? 'Only accounts with a ৳0 balance can be archived. Transfer the money to another account first.' : 'It disappears from pickers but its history stays in reports. You can restore it later.'}
        confirmLabel={archBal !== 0 ? 'Transfer money out' : 'Archive'}
        destructive={archBal === 0}
        onConfirm={() => {
          if (!archive) return;
          if (archBal !== 0) return onTransfer(archive.id);
          store.updateAccount(archive.id, { archived: true }, 'Account archived');
          toast.success(`${archive.name} archived`, { action: { label: 'Undo', onClick: () => store.updateAccount(archive.id, { archived: false }, 'Account restored') } });
        }} />
      
    </div>);

}
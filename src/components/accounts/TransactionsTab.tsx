import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, CheckCircle2, Download, Eye, FilePen, Receipt, Scale, Trash2, Undo2, X } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Segmented } from '../common/Segmented';
import { SelectField } from '../common/SelectField';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAccounts } from '../../contexts/AccountsContext';
import type { LedgerLine, Txn } from '../../types/accounts';
import { downloadCsv, formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';
import { TxnReviewDialog } from './TxnReviewDialog';

export type TypeFilter = 'all' | 'income' | 'expense' | 'transfer';

interface Props {
  initialType?: TypeFilter;
  onEdit: (t: Txn) => void;
}

const ALL = 'all';

/** Signed effect of a ledger line on one account (for running balance). */
function lineDelta(l: LedgerLine, accountId: string, txns: Txn[]): number {
  if (l.kind === 'transfer') return l.accountId === accountId ? -l.amount : l.toAccountId === accountId ? l.amount : 0;
  if (l.accountId !== accountId) return 0;
  if (l.kind === 'fee' || l.kind === 'income') return l.amount;
  if (l.kind === 'expense') return -l.amount;
  return txns.find((t) => t.id === l.txnId)?.direction === 'out' ? -l.amount : l.amount;
}

/** Unified ledger: fee receipts, other income, expenses, transfers and adjustments with filters, approvals and reversal. */
export function TransactionsTab({ initialType = 'all', onEdit }: Props) {
  const store = useAccounts();
  const navigate = useNavigate();
  const [type, setType] = useState<TypeFilter>(initialType);
  const [account, setAccount] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [party, setParty] = useState(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState<Txn | null>(null);
  const [reverse, setReverse] = useState<Txn | null>(null);
  const [discard, setDiscard] = useState<Txn | null>(null);

  const txnOf = (l: LedgerLine) => {
    const t = store.txns.find((x) => x.id === l.txnId);
    return t?.pairId ? store.txns.find((x) => x.id === t.pairId) ?? t : t;
  };

  const rows = useMemo(() => store.lines.filter((l) => {
    if (type === 'income' && !(l.kind === 'income' || l.kind === 'fee')) return false;
    if (type === 'expense' && l.kind !== 'expense') return false;
    if (type === 'transfer' && l.kind !== 'transfer') return false;
    if (account !== ALL && l.accountId !== account && l.toAccountId !== account) return false;
    if (category !== ALL && l.categoryId !== category) return false;
    if (party !== ALL && l.partyId !== party) return false;
    if (from && l.date < from) return false;
    if (to && l.date > to) return false;
    return true;
  }), [store.lines, type, account, category, party, from, to]);

  /** Running balance after each posted line, for the selected account. */
  const running = useMemo(() => {
    if (account === ALL) return null;
    const m = new Map<string, number>();
    let bal = store.accounts.find((a) => a.id === account)?.opening ?? 0;
    [...store.lines].reverse().forEach((l) => {
      if (l.status !== 'posted') return;
      const d = lineDelta(l, account, store.txns);
      if (!d) return;
      bal += d;
      m.set(l.id, bal);
    });
    return m;
  }, [account, store.lines, store.accounts, store.txns]);

  const filtersOn = type !== 'all' || account !== ALL || category !== ALL || party !== ALL || from || to;
  const clear = () => {setType('all');setAccount(ALL);setCategory(ALL);setParty(ALL);setFrom('');setTo('');};

  const columns: Column<LedgerLine>[] = [
  { id: 'date', header: 'Date', sortValue: (l) => l.date, cell: (l) => <span className="whitespace-nowrap tabular">{formatDate(l.date, 'd MMM')}<span className="block text-[11px] text-muted-foreground">{l.ref}</span></span> },
  {
    id: 'entry', header: 'Entry', sortValue: (l) => l.label, cell: (l) => {
      const Icon = l.kind === 'transfer' ? ArrowRightLeft : l.kind === 'adjustment' ? Scale : l.kind === 'expense' ? ArrowUpRight : ArrowDownLeft;
      const tone = l.kind === 'transfer' ? 'text-info' : l.kind === 'adjustment' ? 'text-warning' : l.kind === 'expense' ? 'text-danger' : 'text-success';
      return (
        <div className="flex min-w-[180px] items-start gap-2">
            <Icon className={cn('mt-0.5 size-3.5 shrink-0', tone)} aria-label={l.kind} />
            <div className="min-w-0">
              <p className="truncate font-medium">{l.label}</p>
              <p className="truncate text-[11.5px] text-muted-foreground">{l.kind === 'transfer' ? `${store.accountName(l.accountId)} → ${store.accountName(l.toAccountId)}` : [store.partyName(l.partyId), l.note].filter(Boolean).join(' · ') || '—'}</p>
            </div>
          </div>);

    }
  },
  { id: 'account', header: 'Account', mobileHidden: true, cell: (l) => <span className="whitespace-nowrap text-[12.5px]">{l.kind === 'transfer' ? <span className="text-muted-foreground">Own accounts</span> : store.accountName(l.accountId)}</span> },
  {
    id: 'in', header: 'In', align: 'right', sortValue: (l) => l.kind === 'expense' ? 0 : l.amount, cell: (l) => {
      const d = account !== ALL ? lineDelta(l, account, store.txns) : l.kind === 'fee' || l.kind === 'income' || l.kind === 'adjustment' && store.txns.find((t) => t.id === l.txnId)?.direction === 'in' ? l.amount : 0;
      return d > 0 ? <span className={cn('tabular text-success', l.status !== 'posted' && 'text-subtle', l.status === 'reversed' && 'line-through')}>{formatBDT(d)}</span> : <span className="text-subtle">—</span>;
    }
  },
  {
    id: 'out', header: 'Out', align: 'right', sortValue: (l) => l.kind === 'expense' ? l.amount : 0, cell: (l) => {
      const d = account !== ALL ? -lineDelta(l, account, store.txns) : l.kind === 'expense' || l.kind === 'adjustment' && store.txns.find((t) => t.id === l.txnId)?.direction === 'out' ? l.amount : 0;
      if (l.kind === 'transfer' && account === ALL) return <span className={cn('tabular text-info', l.status !== 'posted' && 'text-subtle', l.status === 'reversed' && 'line-through')}>{formatBDT(l.amount)}{l.fee ? <span className="block text-[10.5px] text-muted-foreground">+{formatBDT(l.fee)} fee</span> : null}</span>;
      return d > 0 ? <span className={cn('tabular', l.status !== 'posted' && 'text-subtle', l.status === 'reversed' && 'line-through')}>{formatBDT(d)}</span> : <span className="text-subtle">—</span>;
    }
  },
  ...(running ? [{ id: 'bal', header: 'Balance', align: 'right' as const, cell: (l: LedgerLine) => running.has(l.id) ? <span className="font-medium tabular">{formatBDT(running.get(l.id) ?? 0)}</span> : <span className="text-subtle">—</span> }] : []),
  { id: 'status', header: 'Status', cell: (l) => <StatusBadge status={l.status} label={l.status === 'pending-approval' ? 'Awaiting approval' : undefined} /> }];


  const exportRows = (list: LedgerLine[]) => {
    downloadCsv(`ledger-${new Date().toISOString().slice(0, 10)}.csv`, list.map((l) => ({ Date: l.date, Voucher: l.ref, Type: l.kind, Entry: l.label, Account: store.accountName(l.accountId), To: l.toAccountId ? store.accountName(l.toAccountId) : '', Party: store.partyName(l.partyId), Amount: l.amount, Fee: l.fee ?? '', Status: l.status, Note: l.note ?? '' })));
    toast.success(`${list.length} entries exported`);
  };

  const pendingSelectable = (ids: string[]) => ids.map((id) => store.txns.find((t) => t.id === id)).filter((t): t is Txn => !!t && t.status === 'pending-approval' && !t.pairId && t.createdBy !== store.actor);

  return (
    <div className="space-y-3">
      {store.returned.length > 0 && store.canRecord &&
      <Notice kind="warning" action={<Button size="xs" variant="outline" onClick={() => onEdit(store.returned[0])}><FilePen className="size-3.5" /> Fix {store.returned[0].voucher}</Button>}>
          {store.returned.length} entr{store.returned.length > 1 ? 'ies were' : 'y was'} returned by the approver — edit and resubmit.
        </Notice>
      }
      {store.canApprove && store.pending.length > 0 &&
      <Notice
        kind="info"
        action={<Button size="xs" onClick={() => {const ok = store.pending.filter((t) => t.createdBy !== store.actor);if (!ok.length) return toast.error('You recorded these entries — another approver must decide.');store.approve(ok.map((t) => t.id));toast.success(`${ok.length} entr${ok.length > 1 ? 'ies' : 'y'} approved & posted`);}}><CheckCircle2 className="size-3.5" /> Approve all</Button>}>
        
          {store.pending.length} entr{store.pending.length > 1 ? 'ies await' : 'y awaits'} your approval ({formatBDT(store.pending.reduce((s, t) => s + t.amount, 0))}).
        </Notice>
      }

      <div className="flex flex-wrap items-end gap-2">
        <Segmented ariaLabel="Entry type" value={type} onChange={setType} options={[{ value: 'all', label: 'All' }, { value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }, { value: 'transfer', label: 'Transfers' }]} />
        <SelectField className="w-44" ariaLabel="Account" value={account} onValueChange={setAccount} options={[{ value: ALL, label: 'All accounts' }, ...store.accounts.map((a) => ({ value: a.id, label: a.name }))]} />
        <SelectField className="w-44" ariaLabel="Category" value={category} onValueChange={setCategory} options={[{ value: ALL, label: 'All categories' }, ...store.categories.map((c) => ({ value: c.id, label: `${c.name}` }))]} />
        <SelectField className="w-40" ariaLabel="Party" value={party} onValueChange={setParty} options={[{ value: ALL, label: 'All parties' }, ...store.parties.map((p) => ({ value: p.id, label: p.name }))]} />
        <div className="flex items-center gap-1">
          <Input type="date" aria-label="From date" className="h-9 w-[138px] tabular" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-subtle">–</span>
          <Input type="date" aria-label="To date" className="h-9 w-[138px] tabular" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        {filtersOn && <Button size="sm" variant="ghost" onClick={clear}><X className="size-3.5" /> Clear</Button>}
      </div>

      <DataTable
        ariaLabel="Transactions"
        rows={rows}
        columns={columns}
        getRowId={(l) => l.txnId ?? l.id}
        searchText={(l) => `${l.ref} ${l.label} ${l.note ?? ''} ${store.partyName(l.partyId)} ${store.accountName(l.accountId)}`}
        searchPlaceholder="Voucher, party or note…"
        onRowClick={(l) => {const t = txnOf(l);if (t) setView(t);else navigate('/fees/collection');}}
        toolbarRight={<Button size="sm" variant="outline" onClick={() => exportRows(rows)} disabled={!rows.length}><Download className="size-4" /> Export</Button>}
        rowActions={(l) => {
          if (l.source === 'fee') return [{ label: 'Open in Fees', icon: Receipt, onSelect: () => navigate('/fees/collection') }];
          const t = txnOf(l);
          if (!t) return [];
          const canDecide = store.canApprove && t.status === 'pending-approval' && t.createdBy !== store.actor;
          return [
          { label: t.status === 'pending-approval' && store.canApprove ? 'Review' : 'View details', icon: Eye, onSelect: () => setView(t) },
          ...(t.status === 'returned' ? [
          { label: 'Edit & resubmit', icon: FilePen, disabled: !store.canRecord, onSelect: () => onEdit(t) },
          { label: 'Discard entry', icon: Trash2, destructive: true, disabled: !store.canRecord, onSelect: () => setDiscard(t) }] :
          []),
          ...(t.status === 'pending-approval' ? [{ label: 'Approve & post', icon: CheckCircle2, disabled: !canDecide, onSelect: () => setView(t) }] : []),
          { label: 'Reverse entry', icon: Undo2, destructive: true, separatorBefore: true, disabled: t.status !== 'posted' || !store.canRecord, onSelect: () => setReverse(t) }];

        }}
        bulkActions={(ids, clearSel) =>
        <>
            {store.canApprove &&
          <Button size="xs" onClick={() => {const ok = pendingSelectable(ids);if (!ok.length) return toast.error('No selected entries you can approve.');store.approve(ok.map((t) => t.id));toast.success(`${ok.length} approved & posted`);clearSel();}}><CheckCircle2 className="size-3.5" /> Approve</Button>
          }
            <Button size="xs" variant="outline" onClick={() => {exportRows(rows.filter((l) => ids.includes(l.txnId ?? l.id)));clearSel();}}><Download className="size-3.5" /> Export</Button>
          </>
        }
        rowClassName={(l) => l.status === 'returned' ? 'bg-warning-bg/30' : ''}
        emptyTitle={filtersOn ? 'No entries match these filters' : 'No transactions yet'}
        emptyAction={filtersOn ? <Button size="sm" variant="outline" onClick={clear}>Clear filters</Button> : undefined}
        footerNote={account !== ALL ? 'Running balance counts posted entries only' : 'Posted entries are immutable · reverse with a reason'} />
      

      <TxnReviewDialog txn={view ? store.txns.find((t) => t.id === view.id) ?? null : null} onOpenChange={(o) => !o && setView(null)} />
      <ConfirmDialog
        open={!!reverse}
        onOpenChange={(o) => !o && setReverse(null)}
        title={`Reverse ${reverse?.voucher}?`}
        description={reverse?.kind === 'transfer' ? 'Both sides of the transfer (and its fee) are reversed together. The original stays in the ledger.' : 'A reversing entry is recorded; the original stays in the ledger.'}
        confirmLabel="Reverse"
        destructive
        reasonLabel="Reason"
        onConfirm={(r) => {if (reverse) {store.reverse(reverse.id, r);toast.success(`${reverse.voucher} reversed`);}}} />
      
      <ConfirmDialog
        open={!!discard}
        onOpenChange={(o) => !o && setDiscard(null)}
        title={`Discard ${discard?.voucher}?`}
        description="The returned entry is removed. This is recorded in the audit log."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {if (discard) {store.discard(discard.id);toast.success(`${discard.voucher} discarded`);}}} />
      
    </div>);

}
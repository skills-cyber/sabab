import React from 'react';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Pencil, Scale } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { StatusBadge } from '../common/StatusBadge';
import { useAccounts } from '../../contexts/AccountsContext';
import { campuses } from '../../data/school';
import type { FinAccount } from '../../types/accounts';
import { formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';
import { maskNumber } from './useAccounts';

interface Props {
  account: FinAccount | null;
  onOpenChange: (o: boolean) => void;
  onEdit: (a: FinAccount) => void;
  onTransfer: (fromId: string) => void;
  onRecord: (kind: 'income' | 'expense', accountId: string) => void;
  onReconcile: (a: FinAccount) => void;
}

/** Account statement: opening, in, out, closing and every entry touching the account. */
export function AccountSheet({ account, onOpenChange, onEdit, onTransfer, onRecord, onReconcile }: Props) {
  const store = useAccounts();
  const a = account;
  const b = a ? store.balanceOf(a.id) : null;
  const entries = a ? store.lines.filter((l) => l.accountId === a.id || l.toAccountId === a.id) : [];

  return (
    <Sheet open={!!a} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {a && b &&
        <>
            <SheetHeader className="border-b border-border">
              <SheetTitle>{a.name}</SheetTitle>
              <SheetDescription>
                {a.type === 'bank' ? `${a.bank}${a.branch ? ` · ${a.branch}` : ''} · ${maskNumber(a.number)}` : a.type === 'wallet' ? `${a.provider} · ${maskNumber(a.number)}` : 'Cash drawer'} · {campuses.find((c) => c.id === a.campusId)?.short}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {a.archived ? <StatusBadge status="closed" label="Archived" /> : <StatusBadge status="active" />}
                {a.reconciledTo ? <StatusBadge status="verified" label={`Reconciled to ${formatDate(a.reconciledTo, 'd MMM')}`} /> : <StatusBadge status="pending" label="Not reconciled" />}
              </div>
            </SheetHeader>

            <dl className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
              {[
            { k: `Opening · ${formatDate(a.openingDate, 'd MMM')}`, v: formatBDT(b.opening) },
            { k: 'Money in', v: `+${formatBDT(b.inflow)}`, cls: 'text-success' },
            { k: 'Money out', v: `−${formatBDT(b.outflow)}`, cls: 'text-danger' },
            { k: 'Closing', v: formatBDT(b.balance), cls: 'font-semibold' }].
            map((x) =>
            <div key={x.k} className="bg-card px-3 py-2.5">
                  <dt className="truncate text-[11.5px] text-muted-foreground">{x.k}</dt>
                  <dd className={cn('text-[14px] tabular', x.cls)}>{x.v}</dd>
                </div>
            )}
            </dl>

            {!a.archived && store.canRecord &&
          <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
                <Button size="sm" variant="outline" onClick={() => onRecord('income', a.id)}><ArrowDownLeft className="size-4" /> Income</Button>
                <Button size="sm" variant="outline" onClick={() => onRecord('expense', a.id)}><ArrowUpRight className="size-4" /> Expense</Button>
                <Button size="sm" variant="outline" onClick={() => onTransfer(a.id)}><ArrowRightLeft className="size-4" /> Transfer out</Button>
                <Button size="sm" variant="outline" onClick={() => onReconcile(a)}><Scale className="size-4" /> Reconcile</Button>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => onEdit(a)}><Pencil className="size-4" /> Edit</Button>
              </div>
          }

            <div className="p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Statement · {entries.length} entries</p>
              {entries.length === 0 ?
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-[13px] text-muted-foreground">No entries yet. Record income or transfer money in to get started.</p> :

            <ul className="divide-y divide-border rounded-lg border border-border">
                  {entries.map((l) => {
                const incoming = l.kind === 'transfer' ? l.toAccountId === a.id : l.kind === 'fee' || l.kind === 'income' || l.kind === 'adjustment' && store.txns.find((t) => t.id === l.txnId)?.direction === 'in';
                return (
                  <li key={l.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                        <span className={cn('grid size-7 shrink-0 place-items-center rounded-md', incoming ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger')}>
                          {incoming ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{l.kind === 'transfer' ? incoming ? `Transfer from ${store.accountName(l.accountId)}` : `Transfer to ${store.accountName(l.toAccountId)}` : l.label}</p>
                          <p className="truncate text-[11.5px] text-muted-foreground">{formatDate(l.date, 'd MMM')} · {l.ref}{l.status !== 'posted' ? ` · ${l.status === 'pending-approval' ? 'awaiting approval' : l.status}` : ''}</p>
                        </div>
                        <span className={cn('shrink-0 tabular', l.status !== 'posted' ? 'text-subtle' : incoming ? 'text-success' : 'text-foreground', l.status === 'reversed' && 'line-through')}>{incoming ? '+' : '−'}{formatBDT(l.amount)}</span>
                      </li>);

              })}
                </ul>
            }
            </div>
          </>
        }
      </SheetContent>
    </Sheet>);

}
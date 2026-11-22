import React, { useMemo, useState } from 'react';
import { Download, Printer, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { LedgerRow } from '../../types/payroll';
import { cn } from '../../utils/cn';
import { downloadCsv, formatBDT, formatDate } from '../../utils/format';

interface LedgerTableProps {
  rows: LedgerRow[];
  debitLabel: string;
  creditLabel: string;
  /** How to read the running balance sign, e.g. ["They owe you", "You owe them"]. */
  balanceLabels: [string, string];
  filename: string;
  onPrint?: (range: {from: string;to: string;}) => void;
  emptyText?: string;
}

const TAG_TONE: Record<string, string> = {
  Opening: 'bg-muted text-muted-foreground',
  Salary: 'bg-accent text-accent-foreground',
  Payment: 'bg-info-bg text-info',
  Receipt: 'bg-success-bg text-success',
  Advance: 'bg-warning-bg text-warning',
  Repayment: 'bg-success-bg text-success',
  Bill: 'bg-danger-bg text-danger',
  Receivable: 'bg-warning-bg text-warning',
  Invoice: 'bg-info-bg text-info',
  'Previous year': 'bg-warning-bg text-warning',
  Concession: 'bg-success-bg text-success'
};

/** Shared ledger: Date · Reference · Description · Debit · Credit · Running balance, with date range, search, print and CSV. */
export function LedgerTable({ rows, debitLabel, creditLabel, balanceLabels, filename, onPrint, emptyText = 'No entries yet.' }: LedgerTableProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');
  const view = useMemo(() => rows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to) && (!q || `${r.ref} ${r.description} ${r.tag} ${r.sub ?? ''}`.toLowerCase().includes(q.toLowerCase()))), [rows, from, to, q]);
  const sum = (k: 'debit' | 'credit') => view.reduce((s, r) => s + r[k], 0);
  const balText = (b: number) => Math.round(b) === 0 ? 'Settled' : b > 0 ? balanceLabels[0] : balanceLabels[1];

  return (
    <div className="min-w-0 rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
        <div className="relative min-w-[140px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" aria-hidden />
          <Input aria-label="Search ledger" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-8 pl-8 text-[12.5px]" />
        </div>
        <Input aria-label="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-[136px] text-[12.5px]" />
        <Input aria-label="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-[136px] text-[12.5px]" />
        <Button size="icon-sm" variant="outline" aria-label="Export CSV" disabled={!view.length} onClick={() => downloadCsv(filename, view.map((r) => ({ Date: r.date, Reference: r.ref, Type: r.tag, Description: r.description, [debitLabel]: r.debit || '', [creditLabel]: r.credit || '', Balance: r.balance })))}><Download className="size-3.5" /></Button>
        {onPrint && <Button size="sm" variant="outline" className="h-8" onClick={() => onPrint({ from, to })}><Printer className="size-3.5" /> Statement</Button>}
      </div>
      {view.length === 0 ?
      <p className="px-3 py-10 text-center text-[13px] text-muted-foreground">{rows.length ? 'No entries match these filters.' : emptyText}</p> :

      <div className="max-h-[420px] overflow-auto scrollbar-thin">
          <table className="w-full min-w-[560px] text-[12.5px]">
            <thead className="sticky top-0 z-[1] bg-muted text-[11.5px] text-muted-foreground">
              <tr>
                <th className="h-8 px-3 text-left font-medium">Date</th>
                <th className="px-2 text-left font-medium">Entry</th>
                <th className="px-2 text-right font-medium">{debitLabel}</th>
                <th className="px-2 text-right font-medium">{creditLabel}</th>
                <th className="px-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {view.map((r) =>
            <tr key={r.id} className="align-top transition-colors hover:bg-muted/40">
                  <td className="whitespace-nowrap px-3 py-2 tabular text-muted-foreground">{formatDate(r.date, 'd MMM yy')}</td>
                  <td className="min-w-0 px-2 py-2">
                    <p className="flex items-center gap-1.5"><span className={cn('rounded px-1.5 py-px text-[10.5px] font-medium', TAG_TONE[r.tag] ?? 'bg-muted text-muted-foreground')}>{r.tag}</span><span className="truncate font-medium">{r.description}</span></p>
                    <p className="truncate text-[11px] text-muted-foreground">{r.ref}{r.sub ? ` · ${r.sub}` : ''}</p>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right tabular">{r.debit ? formatBDT(r.debit) : <span className="text-subtle">—</span>}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right tabular">{r.credit ? formatBDT(r.credit) : <span className="text-subtle">—</span>}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <span className="font-semibold tabular">{formatBDT(Math.abs(r.balance))}</span>
                    <span className="block text-[10.5px] text-muted-foreground">{balText(r.balance)}</span>
                  </td>
                </tr>
            )}
            </tbody>
            <tfoot className="sticky bottom-0 bg-card text-[12px] font-semibold">
              <tr className="border-t border-border">
                <td className="px-3 py-2" colSpan={2}>{view.length} entries</td>
                <td className="px-2 py-2 text-right tabular">{formatBDT(sum('debit'))}</td>
                <td className="px-2 py-2 text-right tabular">{formatBDT(sum('credit'))}</td>
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      }
    </div>);

}
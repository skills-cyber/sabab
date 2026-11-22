import React from 'react';
import { Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import type { LedgerRow } from '../../types/payroll';
import { school } from '../../data/school';
import { amountInWords } from '../../utils/amountInWords';
import { TODAY, formatBDT, formatDate } from '../../utils/format';

interface StatementDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  name: string;
  subtitle?: string;
  rows: LedgerRow[];
  range: {from: string;to: string;};
  debitLabel: string;
  creditLabel: string;
  balanceLabels: [string, string];
}

/** Printable A4 statement: opening balance, entries in range, closing balance and the amount in words. */
export function StatementDialog({ open, onOpenChange, name, subtitle, rows, range, debitLabel, creditLabel, balanceLabels }: StatementDialogProps) {
  const before = range.from ? rows.filter((r) => r.date < range.from) : [];
  const opening = before.length ? before[before.length - 1].balance : 0;
  const inRange = rows.filter((r) => (!range.from || r.date >= range.from) && (!range.to || r.date <= range.to));
  const closing = inRange.length ? inRange[inRange.length - 1].balance : opening;
  const label = (b: number) => Math.round(b) === 0 ? 'Settled' : b > 0 ? balanceLabels[0] : balanceLabels[1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="print:hidden">
          <DialogTitle>Statement · {name}</DialogTitle>
          <DialogDescription>Preview, then print or save as PDF from the browser.</DialogDescription>
        </DialogHeader>
        <article className="rounded-lg border border-border p-5 text-[12.5px]">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="text-[15px] font-semibold">{school.name}</p>
              <p lang="bn" className="font-bn text-muted-foreground">{school.bn}</p>
              <p className="text-muted-foreground">{school.address}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Account statement</p>
              <p className="text-muted-foreground">{range.from ? formatDate(range.from) : 'Start'} – {formatDate(range.to || TODAY)}</p>
            </div>
          </header>
          <div className="flex flex-wrap justify-between gap-2 py-3">
            <div><p className="font-semibold">{name}</p>{subtitle && <p className="text-muted-foreground">{subtitle}</p>}</div>
            <div className="text-right"><p className="text-muted-foreground">Opening balance</p><p className="font-semibold tabular">{formatBDT(Math.abs(opening))} <span className="font-normal text-muted-foreground">· {label(opening)}</span></p></div>
          </div>
          <table className="w-full">
            <thead className="border-y border-border text-[11.5px] text-muted-foreground">
              <tr><th className="py-1.5 text-left font-medium">Date</th><th className="text-left font-medium">Particulars</th><th className="text-right font-medium">{debitLabel}</th><th className="text-right font-medium">{creditLabel}</th><th className="text-right font-medium">Balance</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inRange.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No entries in this period.</td></tr>}
              {inRange.map((r) =>
              <tr key={r.id}>
                  <td className="whitespace-nowrap py-1.5 pr-2 tabular">{formatDate(r.date, 'dd/MM/yy')}</td>
                  <td className="pr-2">{r.description} <span className="text-muted-foreground">· {r.ref}</span></td>
                  <td className="text-right tabular">{r.debit ? formatBDT(r.debit) : ''}</td>
                  <td className="text-right tabular">{r.credit ? formatBDT(r.credit) : ''}</td>
                  <td className="whitespace-nowrap text-right tabular">{formatBDT(Math.abs(r.balance))}</td>
                </tr>
              )}
            </tbody>
          </table>
          <footer className="mt-3 border-t border-border pt-3">
            <div className="flex justify-between font-semibold"><span>Closing balance · {label(closing)}</span><span className="tabular">{formatBDT(Math.abs(closing))}</span></div>
            <p className="mt-0.5 text-muted-foreground">In words: {amountInWords(closing)}</p>
            <p className="mt-6 text-[11px] text-subtle">Generated {formatDate(TODAY)} · Sabab · computer-generated statement, no signature required.</p>
          </footer>
        </article>
        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
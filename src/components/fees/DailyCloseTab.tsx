import React, { useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '../common/Panel';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import type { PaymentMethod } from '../../types/finance';
import { TODAY, formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

const METHODS: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Bank'];

export function DailyCloseTab() {
  const { payments, dayClose, closeDay } = useAdmin();
  const { role } = useApp();
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const today = payments.filter((p) => p.date === TODAY);
  const posted = today.filter((p) => p.status === 'posted');
  const reversed = today.filter((p) => p.status === 'reversed');
  const by = (m: PaymentMethod) => posted.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0);
  const expected = by('Cash');
  const diff = counted === '' ? 0 : Number(counted) - expected;
  const receipts = new Set(posted.map((p) => p.receiptNo)).size;

  const submit = () => {
    const n = Number(counted);
    if (counted === '' || !Number.isFinite(n) || n < 0) return setErr('Enter the counted cash amount.');
    if (n !== expected && note.trim().length < 5) return setErr('Explain the difference before closing.');
    closeDay(expected, n, note.trim());
    toast.success('Day closed', { description: 'Daybook locked. New receipts post to the next business day.' });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title={`Daybook · ${formatDate(TODAY, 'EEEE d MMM yyyy')}`} description={`${receipts} receipts · ${reversed.length} reversal lines`} flush>
        <table className="w-full text-[13px]">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr><th className="h-9 px-4 text-left font-medium">Method</th><th className="px-4 text-right font-medium">Entries</th><th className="px-4 text-right font-medium">Amount</th><th className="px-4 text-left font-medium">Settles to</th></tr>
          </thead>
          <tbody>
            {METHODS.map((m) =>
            <tr key={m} className="border-t border-border">
                <td className="px-4 py-2 font-medium">{m}</td>
                <td className="px-4 py-2 text-right tabular">{posted.filter((p) => p.method === m).length}</td>
                <td className="px-4 py-2 text-right tabular">{formatBDT(by(m))}</td>
                <td className="px-4 py-2 text-muted-foreground">{m === 'Cash' ? 'Cash drawer → bank next morning' : m === 'Bank' ? 'Dutch-Bangla A/C ••4471' : 'Merchant wallet · T+1 settlement'}</td>
              </tr>
            )}
            <tr className="border-t border-border bg-muted/50 font-semibold">
              <td className="px-4 py-2">Total</td><td className="px-4 py-2 text-right tabular">{posted.length}</td><td className="px-4 py-2 text-right tabular">{formatBDT(METHODS.reduce((s, m) => s + by(m), 0))}</td><td />
            </tr>
          </tbody>
        </table>
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Mobile and bank settlement matching against provider statements requires the backend integration (designed).</p>
      </Panel>

      <Panel title="Close the day" description="Count the cash drawer and reconcile">
        {dayClose ?
        <div className="space-y-3 text-[13px]">
            <p className="flex items-center gap-1.5 font-medium text-success"><CheckCircle2 className="size-4" /> Closed at {dayClose.at}</p>
            <dl className="grid grid-cols-2 gap-2">
              <dt className="text-muted-foreground">Expected cash</dt><dd className="text-right tabular">{formatBDT(dayClose.expectedCash)}</dd>
              <dt className="text-muted-foreground">Counted</dt><dd className="text-right tabular">{formatBDT(dayClose.countedCash)}</dd>
              <dt className="text-muted-foreground">Difference</dt><dd className={cn('text-right font-semibold tabular', dayClose.countedCash !== dayClose.expectedCash && 'text-danger')}>{formatBDT(dayClose.countedCash - dayClose.expectedCash)}</dd>
            </dl>
            {dayClose.note && <p className="text-xs text-muted-foreground">Note: {dayClose.note}</p>}
            <Notice kind="locked">Daybook locked. Reopening requires principal approval (designed).</Notice>
          </div> :
        role !== 'accountant' && role !== 'principal' ?
        <Notice kind="locked">Only the cashier or principal can close the day.</Notice> :

        <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-[13px]"><span className="text-muted-foreground">Expected cash</span><b className="tabular">{formatBDT(expected)}</b></div>
            <Field label="Counted cash (৳)" required htmlFor="dc-count" hint={counted !== '' ? diff === 0 ? 'Matches the daybook.' : `${diff > 0 ? 'Excess' : 'Shortage'} of ${formatBDT(Math.abs(diff))}` : undefined}>
              <Input id="dc-count" type="number" inputMode="numeric" value={counted} onChange={(e) => setCounted(e.target.value)} className={cn('tabular', counted !== '' && diff !== 0 && 'border-warning')} />
            </Field>
            <Field label="Note" error={err} htmlFor="dc-note"><Textarea id="dc-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Required if counted ≠ expected" /></Field>
            <Button className="w-full" onClick={submit}><Lock className="size-4" /> Close day & lock daybook</Button>
          </div>
        }
      </Panel>
    </div>);

}
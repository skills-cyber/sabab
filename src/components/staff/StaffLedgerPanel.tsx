import React, { useState } from 'react';
import { HandCoins } from 'lucide-react';
import { Button } from '../ui/Button';
import { BalanceCard } from '../ledger/BalanceCard';
import { LedgerTable } from '../ledger/LedgerTable';
import { StatementDialog } from '../ledger/StatementDialog';
import { usePayroll } from '../../contexts/PayrollContext';
import type { StaffMember } from '../../types/staff';
import { formatBDT } from '../../utils/format';

const LABELS: [string, string] = ['School owes', 'Owes school'];

/** Per-person ledger: salary earned (credit) vs paid/advanced (debit) with a running balance. */
export function StaffLedgerPanel({ person, onAdvance }: {person: StaffMember;onAdvance?: () => void;}) {
  const payroll = usePayroll();
  const rows = payroll.staffLedger(person.id);
  const balance = payroll.staffBalance(person.id);
  const outstanding = payroll.outstandingAdvance(person.id);
  const [range, setRange] = useState<{from: string;to: string;} | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <BalanceCard
          balance={balance}
          positiveLabel={`School owes ${person.name.split(' ')[0]}`}
          negativeLabel={`${person.name.split(' ')[0]} owes the school`}
          positiveTone="danger"
          hint={balance > 0 ? 'Unpaid salary from approved sheets.' : balance < 0 ? 'Advance not yet recovered.' : undefined} />
        
        <div className="rounded-lg border border-border px-3.5 py-3">
          <p className="text-[12px] font-medium text-muted-foreground">Advance outstanding</p>
          <p className="mt-0.5 text-[22px] font-semibold leading-tight tabular">{formatBDT(outstanding)}</p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            {outstanding ? `${payroll.activeAdvances(person.id).map((a) => `${formatBDT(a.perMonth)}/mo`).join(' + ')} recovered from salary` : 'No active advance'}
          </p>
          {onAdvance && <Button size="xs" variant="outline" className="mt-2" onClick={onAdvance}><HandCoins className="size-3.5" /> Give advance</Button>}
        </div>
      </div>
      <LedgerTable
        rows={rows}
        debitLabel="Paid / advanced"
        creditLabel="Earned"
        balanceLabels={LABELS}
        filename={`ledger-${person.id}.csv`}
        onPrint={setRange}
        emptyText="No approved salary or payments yet." />
      
      <StatementDialog
        open={!!range}
        onOpenChange={(o) => !o && setRange(null)}
        name={person.name}
        subtitle={`${person.id} · ${person.designation}`}
        rows={rows}
        range={range ?? { from: '', to: '' }}
        debitLabel="Paid"
        creditLabel="Earned"
        balanceLabels={LABELS} />
      
    </div>);

}
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { BalanceCard } from '../ledger/BalanceCard';
import { LedgerTable } from '../ledger/LedgerTable';
import { StatementDialog } from '../ledger/StatementDialog';
import { Button } from '../ui/Button';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import type { Family } from '../../types/family';
import type { Student } from '../../types/school';
import { familyLedger, isPreviousYear } from '../../utils/family';
import { invoiceBalance } from '../../utils/fees';
import { sectionLabel } from '../../utils/timetable';
import { formatBDT } from '../../utils/format';

/** Combined family statement: every child's invoices, receipts and concessions in one running ledger. */
export function FamilyFeesPanel({ family, kids }: {family: Family;kids: Student[];}) {
  const { invoices, payments, currentYear } = useAdmin();
  const { role } = useApp();
  const navigate = useNavigate();
  const [range, setRange] = useState<{from: string;to: string;} | null>(null);
  const rows = useMemo(() => familyLedger(kids, invoices, payments, currentYear), [kids, invoices, payments, currentYear]);
  const balance = rows.length ? rows[rows.length - 1].balance : 0;
  const perChild = kids.map((k) => {
    const inv = invoices.filter((i) => i.studentId === k.id);
    return { k, current: inv.filter((i) => !isPreviousYear(i, currentYear)).reduce((t, i) => t + invoiceBalance(i), 0), previous: inv.filter((i) => isPreviousYear(i, currentYear)).reduce((t, i) => t + invoiceBalance(i), 0) };
  });
  const previous = perChild.reduce((t, c) => t + c.previous, 0);
  const canCollect = role === 'accountant' || role === 'principal' || role === 'owner';

  return (
    <div className="space-y-3">
      <BalanceCard balance={balance} positiveLabel="Family owes" negativeLabel="Advance with school" positiveTone="danger" hint={previous ? `Includes ${formatBDT(previous)} previous-year dues` : `${kids.length} child${kids.length > 1 ? 'ren' : ''} · AY ${currentYear}`} />
      <ul className="divide-y divide-border rounded-lg border border-border">
        {perChild.map(({ k, current, previous: prev }) =>
        <li key={k.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{k.name}</p><p className="text-[11px] text-muted-foreground">{sectionLabel(k.sectionId)}{prev ? <span className="text-warning"> · {formatBDT(prev)} previous year</span> : ''}</p></div>
            <span className="tabular">{current + prev ? formatBDT(current + prev) : <span className="text-success">Paid</span>}</span>
            {canCollect && current + prev > 0 && <Button size="xs" variant="outline" onClick={() => navigate(`/fees/collection?collect=${k.id}`)}><CreditCard className="size-3.5" /> Collect</Button>}
          </li>
        )}
      </ul>
      <LedgerTable rows={rows} debitLabel="Billed" creditLabel="Paid / concession" balanceLabels={['Family owes', 'Advance']} filename={`${family.id}-statement.csv`} onPrint={setRange} emptyText="No invoices for these children." />
      <StatementDialog open={!!range} onOpenChange={(o) => !o && setRange(null)} name={`${family.guardianName} (${family.id})`} subtitle={kids.map((k) => `${k.name} · ${sectionLabel(k.sectionId)}`).join(' · ')} rows={rows} range={range ?? { from: '', to: '' }} debitLabel="Billed" creditLabel="Paid" balanceLabels={['Family owes', 'Advance']} />
    </div>);

}
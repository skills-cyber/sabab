import React, { useState } from 'react';
import { Banknote, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { PersonCell } from '../common/PersonCell';
import { Segmented } from '../common/Segmented';
import { KpiStrip } from '../common/KpiStrip';
import { Meter } from '../common/Meter';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { usePayroll } from '../../contexts/PayrollContext';
import { useStaff } from '../../contexts/StaffContext';
import { useAccounts } from '../../contexts/AccountsContext';
import type { Advance } from '../../types/payroll';
import { TODAY, formatBDT, formatDate } from '../../utils/format';
import { methodFor } from './PayDialog';

type Filter = 'active' | 'settled' | 'all';
const STATE_BADGE = { pending: { s: 'pending', l: 'Awaiting approval' }, active: { s: 'in-progress', l: 'Recovering' }, settled: { s: 'completed', l: 'Settled' }, cancelled: { s: 'cancelled', l: 'Cancelled' } } as const;

/** Salary advances: given, recovered from salary sheets, or repaid early in cash. */
export function AdvancesTab({ onGive }: {onGive: () => void;}) {
  const payroll = usePayroll();
  const fin = useAccounts();
  const { staff } = useStaff();
  const [filter, setFilter] = useState<Filter>('active');
  const [repay, setRepay] = useState<Advance | null>(null);
  const [amt, setAmt] = useState('');
  const [acc, setAcc] = useState('cash-mirpur');
  const [err, setErr] = useState<string | null>(null);

  const rows = payroll.advances.filter((a) => {
    const st = payroll.advanceInfo(a).state;
    return filter === 'all' || (filter === 'active' ? st === 'active' || st === 'pending' : st === 'settled');
  });
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? id;
  const outstanding = payroll.advances.reduce((t, a) => t + (payroll.advanceInfo(a).state === 'active' ? payroll.advanceInfo(a).remaining : 0), 0);

  const columns: Column<Advance>[] = [
  { id: 'who', header: 'Staff', sortValue: (a) => name(a.staffId), cell: (a) => <PersonCell name={name(a.staffId)} sub={`${a.id} · ${a.note ?? ''}`} /> },
  { id: 'date', header: 'Given', sortValue: (a) => a.date, cell: (a) => <span className="tabular">{formatDate(a.date, 'd MMM yy')}<span className="block text-[11px] text-muted-foreground">{fin.accountName(a.accountId)}</span></span> },
  { id: 'amount', header: 'Amount', align: 'right', sortValue: (a) => a.amount, cell: (a) => <span className="tabular">{formatBDT(a.amount)}</span> },
  { id: 'plan', header: 'Instalment', align: 'right', mobileHidden: true, cell: (a) => <span className="tabular text-muted-foreground">{a.installments} × {formatBDT(a.perMonth)}</span> },
  {
    id: 'progress', header: 'Recovered', sortValue: (a) => payroll.advanceInfo(a).recovered,
    cell: (a) => {const i = payroll.advanceInfo(a);return <div className="w-28"><p className="text-[12px] tabular">{formatBDT(i.recovered)} <span className="text-muted-foreground">· {formatBDT(i.remaining)} left</span></p><Meter value={Math.round(i.recovered / a.amount * 100)} className="mt-1" /></div>;}
  },
  { id: 'state', header: 'Status', cell: (a) => {const b = STATE_BADGE[payroll.advanceInfo(a).state];return <StatusBadge status={b.s} label={b.l} />;} }];


  const save = () => {
    if (!repay) return;
    const n = Number(amt);
    const rem = payroll.advanceInfo(repay).remaining;
    if (!(n > 0) || n > rem) return setErr(`Enter ৳1–${formatBDT(rem)}.`);
    const account = fin.accounts.find((x) => x.id === acc);
    const r = payroll.repayAdvance(repay.id, n, acc, TODAY, methodFor(account));
    if (r) toast.success(`${formatBDT(n)} received from ${name(repay.staffId)}`, { description: `${r.voucher} · ${rem - n ? `${formatBDT(rem - n)} still recovered from salary` : 'Advance settled'}` });
    setRepay(null);
  };

  return (
    <div className="space-y-4">
      <KpiStrip items={[
      { label: 'Outstanding', value: formatBDT(outstanding), tone: outstanding ? 'warning' : 'success', icon: Banknote },
      { label: 'Recovering', value: payroll.advances.filter((a) => payroll.advanceInfo(a).state === 'active').length },
      { label: 'Awaiting approval', value: payroll.advances.filter((a) => payroll.advanceInfo(a).state === 'pending').length },
      { label: 'Settled', value: payroll.advances.filter((a) => payroll.advanceInfo(a).state === 'settled').length }]
      } />
      <DataTable
        ariaLabel="Salary advances"
        rows={rows}
        columns={columns}
        getRowId={(a) => a.id}
        searchText={(a) => `${name(a.staffId)} ${a.id} ${a.note ?? ''}`}
        searchPlaceholder="Name or purpose…"
        toolbar={<Segmented ariaLabel="Advance status" value={filter} onChange={setFilter} options={[{ value: 'active', label: 'Active' }, { value: 'settled', label: 'Settled' }, { value: 'all', label: 'All' }]} />}
        toolbarRight={payroll.canPrepare ? <Button size="sm" onClick={onGive}><Plus className="size-4" /> Give advance</Button> : undefined}
        rowActions={(a) => [
        { label: 'Record early repayment', icon: Banknote, disabled: !payroll.canPrepare || payroll.advanceInfo(a).state !== 'active', onSelect: () => {setRepay(a);setAmt(String(payroll.advanceInfo(a).remaining));setAcc('cash-mirpur');setErr(null);} }]
        }
        emptyTitle={filter === 'active' ? 'No active advances' : 'No advances'}
        emptyAction={payroll.canPrepare ? <Button size="sm" onClick={onGive}><Plus className="size-4" /> Give advance</Button> : undefined}
        footerNote="Instalments are booked when a salary sheet is approved" />
      
      <Dialog open={!!repay} onOpenChange={(o) => !o && setRepay(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Early repayment</DialogTitle>
            <DialogDescription>{repay && `${name(repay.staffId)} · ${repay.id} · ${formatBDT(payroll.advanceInfo(repay).remaining)} left`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Amount (৳)" required error={err} htmlFor="rp-amt"><Input id="rp-amt" data-autofocus type="number" min={1} className="tabular" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
            <Field label="Received into" htmlFor="rp-acc"><SelectField id="rp-acc" value={acc} onValueChange={setAcc} options={fin.accounts.filter((a) => !a.archived).map((a) => ({ value: a.id, label: a.name }))} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepay(null)}>Cancel</Button>
            <Button onClick={save}>Record repayment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}
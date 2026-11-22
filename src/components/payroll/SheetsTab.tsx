import React from 'react';
import { Eye, HandCoins, Plus } from 'lucide-react';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { KpiStrip } from '../common/KpiStrip';
import { Button } from '../ui/Button';
import { usePayroll } from '../../contexts/PayrollContext';
import { campuses } from '../../data/school';
import type { SalarySheet } from '../../types/payroll';
import { formatBDT } from '../../utils/format';
import { monthLabel } from '../../utils/payroll';

/** All salary sheets by month and campus. */
export function SheetsTab({ onOpen, onGenerate, onPay }: {onOpen: (id: string) => void;onGenerate: () => void;onPay: (id: string) => void;}) {
  const payroll = usePayroll();
  const total = (s: SalarySheet, k: 'net' | 'paid') => s.rows.reduce((t, r) => t + r[k], 0);
  const approvedUnpaid = payroll.sheets.filter((s) => s.status === 'approved' || s.status === 'partly-paid').reduce((t, s) => t + total(s, 'net') - total(s, 'paid'), 0);

  const columns: Column<SalarySheet>[] = [
  { id: 'month', header: 'Month', sortValue: (s) => s.month, cell: (s) => <div><p className="font-medium">{monthLabel(s.month)}</p><p className="text-[11.5px] text-muted-foreground">{s.id}</p></div> },
  { id: 'campus', header: 'Campus', cell: (s) => campuses.find((c) => c.id === s.campusId)?.short },
  { id: 'staff', header: 'Staff', align: 'right', cell: (s) => <span className="tabular">{s.rows.length}</span> },
  { id: 'net', header: 'Net payable', align: 'right', sortValue: (s) => total(s, 'net'), cell: (s) => <span className="tabular">{formatBDT(total(s, 'net'))}</span> },
  { id: 'paid', header: 'Paid', align: 'right', mobileHidden: true, cell: (s) => <span className="tabular">{formatBDT(total(s, 'paid'))}</span> },
  { id: 'by', header: 'Prepared by', mobileHidden: true, hideable: true, cell: (s) => <span className="text-muted-foreground">{s.createdBy}</span> },
  { id: 'status', header: 'Status', sortValue: (s) => s.status, cell: (s) => <StatusBadge status={s.status === 'partly-paid' ? 'partial' : s.status} label={s.status === 'partly-paid' ? 'Partly paid' : s.status === 'submitted' ? 'Awaiting approval' : undefined} /> }];


  return (
    <div className="space-y-4">
      <KpiStrip
        items={[
        { label: 'Sheets', value: payroll.sheets.length },
        { label: 'Awaiting approval', value: payroll.sheets.filter((s) => s.status === 'submitted').length, tone: 'warning' },
        { label: 'Approved, unpaid', value: formatBDT(approvedUnpaid), tone: approvedUnpaid ? 'danger' : 'success' },
        { label: 'Paid this year', value: formatBDT(payroll.payments.reduce((t, p) => t + p.amount, 0)), tone: 'success' }]
        } />
      
      <DataTable
        ariaLabel="Salary sheets"
        rows={payroll.sheets}
        columns={columns}
        getRowId={(s) => s.id}
        onRowClick={(s) => onOpen(s.id)}
        initialSort={{ id: 'month', dir: 'desc' }}
        toolbarRight={payroll.canPrepare ? <Button size="sm" onClick={onGenerate}><Plus className="size-4" /> Generate sheet</Button> : undefined}
        rowActions={(s) => [
        { label: 'Open sheet', icon: Eye, onSelect: () => onOpen(s.id) },
        { label: 'Pay salaries', icon: HandCoins, disabled: !payroll.canPrepare || !(s.status === 'approved' || s.status === 'partly-paid'), onSelect: () => onPay(s.id) }]
        }
        emptyTitle="No salary sheets yet"
        emptyHint="Generate the first sheet for a month — it pulls salary structures, unpaid leave and advance instalments."
        emptyAction={payroll.canPrepare ? <Button size="sm" onClick={onGenerate}><Plus className="size-4" /> Generate sheet</Button> : undefined} />
      
    </div>);

}
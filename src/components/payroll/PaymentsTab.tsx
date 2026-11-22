import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { PersonCell } from '../common/PersonCell';
import { Button } from '../ui/Button';
import { PayslipDialog } from './PayslipDialog';
import { usePayroll } from '../../contexts/PayrollContext';
import { useStaff } from '../../contexts/StaffContext';
import { useAccounts } from '../../contexts/AccountsContext';
import type { SalaryPayment } from '../../types/payroll';
import { downloadCsv, formatBDT, formatDate } from '../../utils/format';
import { monthLabel } from '../../utils/payroll';

/** Every salary payment made, with the Accounts voucher it posted. */
export function PaymentsTab() {
  const payroll = usePayroll();
  const { staff } = useStaff();
  const fin = useAccounts();
  const [slip, setSlip] = useState<{sheetId: string;staffId: string;} | null>(null);
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? id;
  const month = (sheetId: string) => {const s = payroll.sheets.find((x) => x.id === sheetId);return s ? monthLabel(s.month) : sheetId;};

  const columns: Column<SalaryPayment>[] = [
  { id: 'date', header: 'Date', sortValue: (p) => p.date, cell: (p) => <span className="tabular">{formatDate(p.date, 'd MMM yy')}</span> },
  { id: 'who', header: 'Staff', sortValue: (p) => name(p.staffId), cell: (p) => <PersonCell name={name(p.staffId)} sub={p.staffId} /> },
  { id: 'month', header: 'For', cell: (p) => month(p.sheetId) },
  { id: 'acc', header: 'From', mobileHidden: true, cell: (p) => <span>{fin.accountName(p.accountId)}<span className="block text-[11px] text-muted-foreground">{p.method}{p.reference ? ` · ${p.reference}` : ''}</span></span> },
  { id: 'voucher', header: 'Voucher', mobileHidden: true, hideable: true, cell: (p) => <span className="tabular text-muted-foreground">{p.voucher}</span> },
  { id: 'amount', header: 'Amount', align: 'right', sortValue: (p) => p.amount, cell: (p) => <b className="tabular">{formatBDT(p.amount)}</b> }];


  return (
    <>
      <DataTable
        ariaLabel="Salary payments"
        rows={payroll.payments}
        columns={columns}
        getRowId={(p) => p.id}
        searchText={(p) => `${name(p.staffId)} ${p.voucher} ${p.reference ?? ''}`}
        searchPlaceholder="Name, voucher or reference…"
        initialSort={{ id: 'date', dir: 'desc' }}
        toolbarRight={<Button size="sm" variant="outline" disabled={!payroll.payments.length} onClick={() => downloadCsv('salary-payments.csv', payroll.payments.map((p) => ({ Date: p.date, Staff: name(p.staffId), For: month(p.sheetId), Account: fin.accountName(p.accountId), Method: p.method, Reference: p.reference ?? '', Voucher: p.voucher, Amount: p.amount })))}><Download className="size-4" /> CSV</Button>}
        rowActions={(p) => [{ label: 'Payslip', icon: FileText, onSelect: () => setSlip({ sheetId: p.sheetId, staffId: p.staffId }) }]}
        emptyTitle="No salary payments yet"
        footerNote="September payments were made before Sabab’s ledger opened" />
      
      <PayslipDialog target={slip} onOpenChange={(o) => !o && setSlip(null)} />
    </>);

}
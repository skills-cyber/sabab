import React from 'react';
import { Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { StatusBadge } from '../common/StatusBadge';
import { usePayroll } from '../../contexts/PayrollContext';
import { useStaff } from '../../contexts/StaffContext';
import { useAccounts } from '../../contexts/AccountsContext';
import { school } from '../../data/school';
import { amountInWords } from '../../utils/amountInWords';
import { formatBDT, formatDate } from '../../utils/format';
import { monthLabel } from '../../utils/payroll';
import { maskNumber } from '../accounts/useAccounts';

interface Props {
  target: {sheetId: string;staffId: string;} | null;
  onOpenChange: (o: boolean) => void;
}

/** Printable bilingual payslip for one person on one salary sheet. */
export function PayslipDialog({ target, onOpenChange }: Props) {
  const { sheets, payments } = usePayroll();
  const { staff } = useStaff();
  const fin = useAccounts();
  const sheet = sheets.find((s) => s.id === target?.sheetId);
  const row = sheet?.rows.find((r) => r.staffId === target?.staffId);
  const person = staff.find((s) => s.id === target?.staffId);
  const paidList = payments.filter((p) => p.sheetId === sheet?.id && p.staffId === person?.id);
  const remaining = row ? Math.max(0, row.net - row.paid) : 0;

  const Line = ({ label, value, neg, bold }: {label: string;value: number;neg?: boolean;bold?: boolean;}) =>
  <div className={`flex justify-between py-1 ${bold ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span className="tabular">{neg && value ? '−' : ''}{formatBDT(value)}</span>
    </div>;


  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="print:hidden">
          <DialogTitle>Payslip</DialogTitle>
          <DialogDescription>{person?.name} · {sheet ? monthLabel(sheet.month) : ''}</DialogDescription>
        </DialogHeader>
        {sheet && row && person &&
        <article className="rounded-lg border border-border p-4 text-[12.5px]">
            <header className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-[14px] font-semibold">{school.name}</p>
                <p lang="bn" className="font-bn text-muted-foreground">{school.bn}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Payslip · <span lang="bn" className="font-bn font-normal">বেতন বিবরণী</span></p>
                <p className="text-muted-foreground">{monthLabel(sheet.month)} · {sheet.id}</p>
              </div>
            </header>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-border py-3">
              <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{person.name}</dd></div>
              <div><dt className="text-muted-foreground">Staff ID</dt><dd className="tabular">{person.id}</dd></div>
              <div><dt className="text-muted-foreground">Designation</dt><dd>{person.designation}</dd></div>
              <div><dt className="text-muted-foreground">Paid via</dt><dd>{person.payMethod}{person.payAccount ? ` · ${maskNumber(person.payAccount)}` : ''}</dd></div>
            </dl>
            <div className="grid gap-4 py-3 sm:grid-cols-2">
              <section>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-subtle">Earnings</p>
                <Line label="Basic" value={row.basic} />
                <Line label="Allowances" value={row.allowances} />
                {row.bonus > 0 && <Line label="Bonus" value={row.bonus} />}
                <div className="border-t border-border"><Line label="Gross" value={row.gross + row.bonus} bold /></div>
              </section>
              <section>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-subtle">Deductions</p>
                <Line label={`Unpaid leave (${row.leaveDays}d)`} value={row.leaveDeduction} neg />
                <Line label="PF / tax" value={row.otherDeductions} neg />
                <Line label="Advance recovery" value={row.advanceRecovery} neg />
                <div className="border-t border-border"><Line label="Total" value={row.leaveDeduction + row.otherDeductions + row.advanceRecovery} neg bold /></div>
              </section>
            </div>
            <div className="rounded-md bg-muted px-3 py-2">
              <div className="flex items-center justify-between text-[14px] font-semibold"><span>Net pay</span><span className="tabular">{formatBDT(row.net)}</span></div>
              <p className="text-[11.5px] text-muted-foreground">{amountInWords(row.net)}</p>
            </div>
            <div className="mt-3 space-y-1">
              {paidList.map((p) =>
            <p key={p.id} className="flex justify-between text-muted-foreground"><span>Paid {formatDate(p.date)} · {fin.accountName(p.accountId)} · {p.voucher}</span><span className="tabular">{formatBDT(p.amount)}</span></p>
            )}
              <div className="flex items-center justify-between pt-1">
                <StatusBadge status={remaining === 0 ? 'paid' : row.paid > 0 ? 'partial' : sheet.status === 'approved' ? 'unpaid' : sheet.status} label={remaining === 0 ? 'Paid in full' : row.paid > 0 ? `${formatBDT(remaining)} still due` : undefined} />
                <span className="text-[11px] text-subtle">Computer-generated · no signature required</span>
              </div>
            </div>
          </article>
        }
        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
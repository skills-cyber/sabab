import React from 'react';
import { Download } from 'lucide-react';
import { Panel } from '../common/Panel';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { useAccounts } from '../../contexts/AccountsContext';
import { useAdmin } from '../../contexts/AdminContext';
import { usePayroll } from '../../contexts/PayrollContext';
import { useStaff } from '../../contexts/StaffContext';
import { invoiceBalance } from '../../utils/fees';
import { TODAY, downloadCsv, formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Line {label: string;sub?: string;amount: number;}

/** Statement of financial position as at today, built from accounts, fee dues, parties and payroll. */
export function BalanceSheet() {
  const fin = useAccounts();
  const { invoices } = useAdmin();
  const payroll = usePayroll();
  const { staff } = useStaff();

  const accountLines: Line[] = fin.accounts.filter((a) => !a.archived).map((a) => ({ label: a.name, sub: a.type === 'cash' ? 'Cash in hand' : a.type === 'bank' ? 'Bank' : a.provider ?? 'Mobile wallet', amount: fin.balanceOf(a.id).balance }));
  const feeDue = invoices.reduce((t, i) => t + invoiceBalance(i), 0);
  const parties = fin.parties.filter((p) => p.type !== 'staff');
  const balances = parties.map((p) => fin.partyBalance(p.id));
  const receivable = balances.filter((b) => b > 0).reduce((a, b) => a + b, 0);
  const payable = balances.filter((b) => b < 0).reduce((a, b) => a - b, 0);
  const advances = staff.reduce((t, s) => t + payroll.outstandingAdvance(s.id), 0);
  const salaryDue = payroll.sheets.filter((s) => s.status === 'approved' || s.status === 'partly-paid').reduce((t, s) => t + s.rows.reduce((a, r) => a + r.net - r.paid, 0), 0);

  const current: Line[] = [
  { label: 'Fees receivable', sub: `${invoices.filter((i) => invoiceBalance(i) > 0).length} unpaid invoices`, amount: feeDue },
  { label: 'Due from parties', sub: 'Payers & donors', amount: receivable },
  { label: 'Staff salary advances', sub: 'Recovered from future salaries', amount: advances }];

  const liabilities: Line[] = [
  { label: 'Due to vendors & parties', sub: 'Unpaid bills and opening balances', amount: payable },
  { label: 'Salaries payable', sub: 'Approved sheets not yet paid', amount: salaryDue }];

  const sum = (l: Line[]) => l.reduce((t, x) => t + x.amount, 0);
  const cash = sum(accountLines);
  const totalAssets = cash + sum(current);
  const totalLiab = sum(liabilities);
  const fund = totalAssets - totalLiab;
  const pendingCount = fin.pending.length;

  const exportCsv = () => downloadCsv(`balance-sheet-${TODAY}.csv`, [
  ...accountLines.map((l) => ({ Section: 'Assets · Cash & bank', Line: l.label, Amount: l.amount })),
  ...current.map((l) => ({ Section: 'Assets · Receivables', Line: l.label, Amount: l.amount })),
  { Section: 'Assets', Line: 'Total assets', Amount: totalAssets },
  ...liabilities.map((l) => ({ Section: 'Liabilities', Line: l.label, Amount: l.amount })),
  { Section: 'Liabilities', Line: 'Total liabilities', Amount: totalLiab },
  { Section: 'Fund', Line: 'Accumulated fund', Amount: fund }]
  );

  const Group = ({ title, lines, total }: {title: string;lines: Line[];total?: number;}) =>
  <>
      <tr className="bg-muted text-xs text-muted-foreground"><th className="h-8 px-4 text-left font-medium" colSpan={2}>{title}</th></tr>
      {lines.map((l) =>
    <tr key={l.label} className="border-t border-border">
          <td className="px-4 py-2">{l.label}{l.sub && <span className="block text-[11px] text-muted-foreground">{l.sub}</span>}</td>
          <td className={cn('px-4 py-2 text-right tabular', l.amount < 0 && 'text-danger')}>{formatBDT(l.amount)}</td>
        </tr>
    )}
      {total !== undefined && <tr className="border-t border-border bg-muted/50 font-semibold"><td className="px-4 py-2">Subtotal</td><td className="px-4 py-2 text-right tabular">{formatBDT(total)}</td></tr>}
    </>;


  return (
    <div className="space-y-3">
      {pendingCount > 0 && <Notice kind="info">{pendingCount} entr{pendingCount === 1 ? 'y is' : 'ies are'} waiting for approval and not included until posted.</Notice>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Assets" description={`As at ${formatDate(TODAY)}`} flush actions={<Button size="sm" variant="outline" onClick={exportCsv}><Download className="size-4" /> CSV</Button>}>
          <table className="w-full text-[13px]">
            <tbody>
              <Group title="Cash & bank" lines={accountLines} total={cash} />
              <Group title="Receivables & advances" lines={current} total={sum(current)} />
              <tr className="border-t-2 border-foreground/20 text-[14px] font-semibold"><td className="px-4 py-2.5">Total assets</td><td className="px-4 py-2.5 text-right tabular">{formatBDT(totalAssets)}</td></tr>
            </tbody>
          </table>
        </Panel>
        <Panel title="Liabilities & fund" description={`As at ${formatDate(TODAY)}`} flush>
          <table className="w-full text-[13px]">
            <tbody>
              <Group title="Liabilities" lines={liabilities} total={totalLiab} />
              <tr className="bg-muted text-xs text-muted-foreground"><th className="h-8 px-4 text-left font-medium" colSpan={2}>Fund</th></tr>
              <tr className="border-t border-border"><td className="px-4 py-2">Accumulated fund<span className="block text-[11px] text-muted-foreground">Total assets − liabilities</span></td><td className={cn('px-4 py-2 text-right tabular', fund < 0 && 'text-danger')}>{formatBDT(fund)}</td></tr>
              <tr className="border-t-2 border-foreground/20 text-[14px] font-semibold"><td className="px-4 py-2.5">Total liabilities & fund</td><td className="px-4 py-2.5 text-right tabular">{formatBDT(totalLiab + fund)}</td></tr>
            </tbody>
          </table>
        </Panel>
      </div>
      <p className="text-[11px] text-muted-foreground">Buildings, furniture, vehicles and other fixed assets aren’t tracked yet, so the accumulated fund shows only cash, dues and payables. Fees receivable includes overdue invoices that may not be collected.</p>
    </div>);

}
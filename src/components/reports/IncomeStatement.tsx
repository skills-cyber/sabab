import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Panel } from '../common/Panel';
import { SelectField } from '../common/SelectField';
import { Button } from '../ui/Button';
import { useAccounts } from '../../contexts/AccountsContext';
import { SYSTEM_CATEGORY } from '../../data/accounts';
import { CURRENT_MONTH } from '../accounts/useAccounts';
import { downloadCsv, formatBDT } from '../../utils/format';
import { monthLabel } from '../../utils/payroll';
import { cn } from '../../utils/cn';

type Section = Record<string, number>;
const EXCLUDED = new Set<string>([SYSTEM_CATEGORY.advance, SYSTEM_CATEGORY.advanceRepay]);

const prevMonth = (m: string) => {const [y, mo] = m.split('-').map(Number);return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`;};

/** Cash-basis income & expenditure statement for one month, compared with the month before. */
export function IncomeStatement() {
  const fin = useAccounts();
  const months = useMemo(() => [...new Set([CURRENT_MONTH, ...fin.lines.map((l) => l.date.slice(0, 7))])].sort().reverse().slice(0, 12), [fin.lines]);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const prev = prevMonth(month);

  const build = useMemo(() => (m: string) => {
    const income: Section = {};
    const expense: Section = {};
    const add = (s: Section, k: string, v: number) => {s[k] = (s[k] ?? 0) + v;};
    fin.lines.forEach((l) => {
      if (l.status !== 'posted' || !l.date.startsWith(m)) return;
      if (l.kind === 'fee') add(income, 'Tuition & fee collections', l.amount);
      if (l.kind === 'income' && !EXCLUDED.has(l.categoryId ?? '')) add(income, fin.categoryName(l.categoryId), l.amount);
      if (l.kind === 'expense' && !EXCLUDED.has(l.categoryId ?? '')) add(expense, fin.categoryName(l.categoryId), l.amount);
    });
    fin.txns.forEach((t) => {
      if (t.kind !== 'adjustment' || t.status !== 'posted' || !t.date.startsWith(m)) return;
      if (t.direction === 'out') add(expense, 'Cash / bank shortage (reconciliation)', t.amount);else
      add(income, 'Cash / bank excess (reconciliation)', t.amount);
    });
    const sum = (s: Section) => Object.values(s).reduce((a, b) => a + b, 0);
    return { income, expense, totalIn: sum(income), totalOut: sum(expense) };
  }, [fin]);

  const cur = build(month);
  const old = build(prev);
  const incomeKeys = [...new Set([...Object.keys(cur.income), ...Object.keys(old.income)])].sort((a, b) => (cur.income[b] ?? 0) - (cur.income[a] ?? 0));
  const expenseKeys = [...new Set([...Object.keys(cur.expense), ...Object.keys(old.expense)])].sort((a, b) => (cur.expense[b] ?? 0) - (cur.expense[a] ?? 0));
  const net = cur.totalIn - cur.totalOut;
  const netOld = old.totalIn - old.totalOut;

  const exportCsv = () => downloadCsv(`income-expenditure-${month}.csv`, [
  ...incomeKeys.map((k) => ({ Section: 'Income', Line: k, [monthLabel(month)]: cur.income[k] ?? 0, [monthLabel(prev)]: old.income[k] ?? 0 })),
  { Section: 'Income', Line: 'Total income', [monthLabel(month)]: cur.totalIn, [monthLabel(prev)]: old.totalIn },
  ...expenseKeys.map((k) => ({ Section: 'Expenditure', Line: k, [monthLabel(month)]: cur.expense[k] ?? 0, [monthLabel(prev)]: old.expense[k] ?? 0 })),
  { Section: 'Expenditure', Line: 'Total expenditure', [monthLabel(month)]: cur.totalOut, [monthLabel(prev)]: old.totalOut },
  { Section: 'Result', Line: net >= 0 ? 'Surplus' : 'Deficit', [monthLabel(month)]: net, [monthLabel(prev)]: netOld }]
  );

  const Row = ({ label, a, b, bold, tone }: {label: string;a: number;b: number;bold?: boolean;tone?: 'success' | 'danger';}) => {
    const change = b ? Math.round((a - b) / b * 100) : null;
    return (
      <tr className={cn('border-t border-border', bold && 'bg-muted/50 font-semibold')}>
        <td className="px-4 py-2">{label}</td>
        <td className={cn('px-4 py-2 text-right tabular', tone === 'success' && 'text-success', tone === 'danger' && 'text-danger')}>{formatBDT(a)}</td>
        <td className="px-4 py-2 text-right tabular text-muted-foreground">{formatBDT(b)}</td>
        <td className="hidden px-4 py-2 text-right text-[12px] tabular text-muted-foreground sm:table-cell">{change === null ? '—' : `${change > 0 ? '+' : ''}${change}%`}</td>
      </tr>);

  };
  const Head = ({ title }: {title: string;}) =>
  <thead className="bg-muted text-xs text-muted-foreground">
      <tr>
        <th className="h-9 px-4 text-left font-medium">{title}</th>
        <th className="px-4 text-right font-medium">{monthLabel(month)}</th>
        <th className="px-4 text-right font-medium">{monthLabel(prev)}</th>
        <th className="hidden px-4 text-right font-medium sm:table-cell">Change</th>
      </tr>
    </thead>;


  return (
    <Panel
      title="Income & expenditure statement"
      description={`${month === CURRENT_MONTH ? 'Month to date · ' : ''}cash basis · posted entries only · all accounts`}
      actions={<div className="flex gap-2"><SelectField size="sm" className="w-36" ariaLabel="Month" value={month} onValueChange={setMonth} options={months.map((m) => ({ value: m, label: monthLabel(m) }))} /><Button size="sm" variant="outline" onClick={exportCsv}><Download className="size-4" /> CSV</Button></div>}
      flush>
      
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[480px] text-[13px]">
          <Head title="Income" />
          <tbody>
            {incomeKeys.length === 0 && <tr className="border-t border-border"><td colSpan={4} className="px-4 py-3 text-muted-foreground">No income posted.</td></tr>}
            {incomeKeys.map((k) => <Row key={k} label={k} a={cur.income[k] ?? 0} b={old.income[k] ?? 0} />)}
            <Row label="Total income" a={cur.totalIn} b={old.totalIn} bold />
          </tbody>
          <Head title="Expenditure" />
          <tbody>
            {expenseKeys.length === 0 && <tr className="border-t border-border"><td colSpan={4} className="px-4 py-3 text-muted-foreground">No expenses posted.</td></tr>}
            {expenseKeys.map((k) => <Row key={k} label={k} a={cur.expense[k] ?? 0} b={old.expense[k] ?? 0} />)}
            <Row label="Total expenditure" a={cur.totalOut} b={old.totalOut} bold />
          </tbody>
          <tbody>
            <tr className="border-t-2 border-foreground/20 text-[14px] font-semibold">
              <td className="px-4 py-2.5">{net >= 0 ? 'Surplus' : 'Deficit'} for the month</td>
              <td className={cn('px-4 py-2.5 text-right tabular', net >= 0 ? 'text-success' : 'text-danger')}>{formatBDT(net)}</td>
              <td className="px-4 py-2.5 text-right tabular text-muted-foreground">{formatBDT(netOld)}</td>
              <td className="hidden sm:table-cell" />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Money moved between your own accounts, salary advances and their repayments are left out — they don’t change the school’s income. Entries waiting for approval are not included.</p>
    </Panel>);

}
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Banknote, CheckCircle2, Landmark, Plus, Smartphone, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiStrip } from '../common/KpiStrip';
import { Panel } from '../common/Panel';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/Button';
import { useAccounts } from '../../contexts/AccountsContext';
import { monthlyHistory } from '../../data/accounts';
import type { FinAccount } from '../../types/accounts';
import { formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';
import { CURRENT_MONTH, maskNumber } from './useAccounts';

interface Props {
  onAdd: () => void;
  onView: (a: FinAccount) => void;
}

const ICON = { cash: Banknote, bank: Landmark, wallet: Smartphone };
const lakh = (n: number) => n >= 100000 ? `৳${(n / 100000).toFixed(1)}L` : `৳${Math.round(n / 1000)}k`;

/** Money at a glance: balances, month in/out, pending approvals, 6-month trend and top spend vs budget. */
export function OverviewTab({ onAdd, onView }: Props) {
  const store = useAccounts();
  const navigate = useNavigate();
  const active = store.accounts.filter((a) => !a.archived);
  const total = active.reduce((s, a) => s + store.balanceOf(a.id).balance, 0);

  const month = useMemo(() => {
    const posted = store.lines.filter((l) => l.status === 'posted' && l.date.startsWith(CURRENT_MONTH));
    const inflow = posted.filter((l) => l.kind === 'fee' || l.kind === 'income').reduce((s, l) => s + l.amount, 0);
    const outflow = posted.filter((l) => l.kind === 'expense').reduce((s, l) => s + l.amount, 0);
    return { inflow, outflow };
  }, [store.lines]);

  const chart = [...monthlyHistory, { month: new Date(`${CURRENT_MONTH}-01`).toLocaleString('en', { month: 'short' }), income: month.inflow, expense: month.outflow }];

  const topSpend = store.categories.
  filter((c) => c.kind === 'expense' && !c.archived).
  map((c) => ({ c, spent: store.spendThisMonth(c.id) })).
  filter((x) => x.spent > 0).
  sort((a, b) => b.spent - a.spent).
  slice(0, 5);

  return (
    <div className="space-y-4">
      <KpiStrip
        items={[
        { label: 'Total balance', value: formatBDT(total), sub: `${active.length} active accounts`, icon: Wallet, tone: 'primary', onClick: () => navigate('/accounts/accounts') },
        { label: 'Money in · this month', value: formatBDT(month.inflow), sub: 'Fees + other income', icon: ArrowDownLeft, tone: 'success', onClick: () => navigate('/accounts/transactions?type=income') },
        { label: 'Money out · this month', value: formatBDT(month.outflow), sub: 'Posted expenses', icon: ArrowUpRight, tone: 'danger', onClick: () => navigate('/accounts/transactions?type=expense') },
        { label: 'Pending approval', value: store.pending.length, sub: store.pending.length ? formatBDT(store.pending.reduce((s, t) => s + t.amount, 0)) : `Limit ${formatBDT(store.approvalLimit)}`, icon: CheckCircle2, tone: store.pending.length ? 'warning' : 'success', onClick: () => navigate('/accounts/transactions') }]
        } />
      

      <Panel title="Accounts" description="Click an account for its statement" actions={store.canRecord ? <Button size="xs" variant="outline" onClick={onAdd}><Plus className="size-3.5" /> Add account</Button> : undefined}>
        {active.length === 0 ?
        <p className="py-6 text-center text-[13px] text-muted-foreground">No accounts yet — add your main cash drawer to get started.</p> :

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((a) => {
            const Icon = ICON[a.type];
            const b = store.balanceOf(a.id);
            return (
              <button key={a.id} type="button" onClick={() => onView(a)} className="group flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{a.name}</p>
                    <p className="truncate text-[11.5px] text-muted-foreground">{a.type === 'cash' ? 'Cash drawer' : `${a.type === 'bank' ? a.bank : a.provider} · ${maskNumber(a.number)}`}</p>
                    <p className={cn('mt-1 text-[16px] font-semibold tabular', b.balance < 0 && 'text-danger')}>{formatBDT(b.balance)}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{a.reconciledTo ? `Reconciled to ${formatDate(a.reconciledTo, 'd MMM')}` : 'Not reconciled'}</p>
                  </div>
                </button>);

          })}
          </div>
        }
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Income vs expense" description="Last 6 months · transfers excluded">
          <div className="h-[220px]" role="img" aria-label="Monthly income and expense bar chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={lakh} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={48} />
                <Tooltip cursor={{ fill: 'var(--muted)' }} formatter={(v: number) => formatBDT(v)} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                <Bar dataKey="expense" name="Expense" fill="var(--chart-5)" radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[11px] text-subtle">Current month is month-to-date.</p>
        </Panel>

        <Panel title="Top expense categories" description="This month vs budget" actions={<Button size="xs" variant="ghost" onClick={() => navigate('/accounts/categories')}>All</Button>}>
          {topSpend.length === 0 ?
          <p className="py-6 text-center text-[13px] text-muted-foreground">No posted expenses this month.</p> :

          <ul className="space-y-3">
              {topSpend.map(({ c, spent }) => {
              const pct = c.budget ? Math.round(spent / c.budget * 100) : 0;
              return (
                <li key={c.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[12.5px]">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className="shrink-0 tabular text-muted-foreground"><b className={cn('font-semibold text-foreground', pct > 100 && 'text-danger')}>{formatBDT(spent)}</b>{c.budget ? ` / ${formatBDT(c.budget)}` : ''}</span>
                    </div>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-muted"><span className={cn('block h-full rounded-full', pct > 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-primary')} style={{ width: `${c.budget ? Math.min(100, pct) : 100}%` }} /></span>
                  </li>);

            })}
            </ul>
          }
          {store.pending.length > 0 &&
          <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Awaiting approval</p>
              <ul className="space-y-1.5">
                {store.pending.slice(0, 3).map((t) =>
              <li key={t.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="truncate">{t.voucher} · {t.kind === 'transfer' ? `${store.accountName(t.accountId)} → ${store.accountName(t.toAccountId)}` : store.categoryName(t.categoryId)}</span>
                    <span className="inline-flex shrink-0 items-center gap-2 tabular">{formatBDT(t.amount)}<StatusBadge status="pending" label="Pending" /></span>
                  </li>
              )}
              </ul>
            </div>
          }
        </Panel>
      </div>
    </div>);

}
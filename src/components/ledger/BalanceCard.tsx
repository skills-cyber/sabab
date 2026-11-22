import React from 'react';
import { cn } from '../../utils/cn';
import { amountInWords } from '../../utils/amountInWords';
import { formatBDT } from '../../utils/format';

interface BalanceCardProps {
  balance: number;
  /** Shown when balance > 0. */
  positiveLabel: string;
  /** Shown when balance < 0. */
  negativeLabel: string;
  positiveTone?: 'success' | 'danger';
  hint?: React.ReactNode;
  className?: string;
}

/** HisabIQ-style role-aware balance card: wording and tone follow which side owes. */
export function BalanceCard({ balance, positiveLabel, negativeLabel, positiveTone = 'success', hint, className }: BalanceCardProps) {
  const settled = Math.round(balance) === 0;
  const tone = settled ? 'neutral' : balance > 0 ? positiveTone : positiveTone === 'success' ? 'danger' : 'success';
  const cls = { success: 'border-success/30 bg-success-bg text-success', danger: 'border-danger/30 bg-danger-bg text-danger', neutral: 'border-border bg-muted text-muted-foreground' }[tone];
  return (
    <div className={cn('rounded-lg border px-3.5 py-3', cls, className)} aria-live="polite">
      <p className="text-[12px] font-medium">{settled ? 'Settled — nothing due' : balance > 0 ? positiveLabel : negativeLabel}</p>
      <p className="mt-0.5 text-[22px] font-semibold leading-tight tabular text-foreground">{formatBDT(Math.abs(balance))}</p>
      {!settled && <p className="mt-0.5 text-[11.5px] opacity-80">{amountInWords(balance)}</p>}
      {hint && <p className="mt-1 text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>);

}
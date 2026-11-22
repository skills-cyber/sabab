import React from 'react';
import { cn } from '../../utils/cn';
import { getStatus, type StatusTone } from '../../utils/status';

export const toneBadge: Record<StatusTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-accent text-accent-foreground'
};

export const toneDot: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-subtle',
  primary: 'bg-primary'
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

/** Semantic status chip with dot — never colour-only (always carries a label). */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const meta = getStatus(status);
  return (
    <span className={cn('inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 text-[11px] font-medium', toneBadge[meta.tone], className)}>
      <span className={cn('size-1.5 shrink-0 rounded-full', toneDot[meta.tone])} aria-hidden />
      {label ?? meta.label}
    </span>);

}

interface ToneChipProps {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}

export function ToneChip({ tone, children, className }: ToneChipProps) {
  return <span className={cn('inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-[11px] font-medium', toneBadge[tone], className)}>{children}</span>;
}
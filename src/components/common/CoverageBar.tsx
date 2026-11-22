import React from 'react';
import { cn } from '../../utils/cn';

interface CoverageBarProps {
  delivered: number;
  plannedToDate: number;
  plannedYear: number;
  className?: string;
  showLabel?: boolean;
}

/** Delivered vs planned-to-date vs whole-year, with a "today" marker. */
export function CoverageBar({ delivered, plannedToDate, plannedYear, className, showLabel }: CoverageBarProps) {
  const total = Math.max(plannedYear, 1);
  const d = Math.min(100, delivered / total * 100);
  const p = Math.min(100, plannedToDate / total * 100);
  const behind = delivered < plannedToDate;
  return (
    <div className={cn('min-w-[90px]', className)}>
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Delivered ${delivered} of ${plannedToDate} periods planned to date (${plannedYear} for the year)`}>
        
        <div className="absolute inset-y-0 left-0 rounded-full bg-border" style={{ width: `${p}%` }} />
        <div className={cn('absolute inset-y-0 left-0 rounded-full', behind ? 'bg-warning' : 'bg-primary')} style={{ width: `${d}%` }} />
        <div className="absolute inset-y-[-2px] w-px bg-foreground/50" style={{ left: `${p}%` }} />
      </div>
      {showLabel &&
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground tabular">
          <span>{delivered}/{plannedToDate} to date</span>
          <span>{plannedYear} yr</span>
        </div>
      }
    </div>);

}
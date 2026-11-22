import React from 'react';
import { cn } from '../../utils/cn';

/** Small usage meter (0–100+). Amber from 90%, red past 100%. */
export function Meter({ value, className }: {value: number;className?: string;}) {
  return (
    <div className={cn('h-1.5 w-full min-w-[60px] overflow-hidden rounded-full bg-muted', className)} role="img" aria-label={`${value}%`}>
      <div className={cn('h-full rounded-full transition-[width] duration-300', value > 100 ? 'bg-danger' : value >= 90 ? 'bg-warning' : 'bg-primary')} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>);

}
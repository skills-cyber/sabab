import React from 'react';
import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

interface PersonCellProps {
  name: string;
  sub?: React.ReactNode;
  bn?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Avatar({ name, size = 'sm', className }: {name: string;size?: 'sm' | 'md';className?: string;}) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-foreground', size === 'sm' ? 'size-7 text-[10.5px]' : 'size-9 text-xs', className)} aria-hidden>
      {initials(name)}
    </span>);

}

export function PersonCell({ name, sub, bn, size = 'sm', className }: PersonCellProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {name}
          {bn && <span lang="bn" className="ml-1.5 font-bn text-[11.5px] font-normal text-muted-foreground">{bn}</span>}
        </p>
        {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>);

}
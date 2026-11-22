import React from 'react';
import { cn } from '../../utils/cn';

export function SababLogo({ collapsed, className }: {collapsed?: boolean;className?: string;}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
          <path d="M4 7.5 12 4l8 3.5-8 3.5L4 7.5Z" fill="currentColor" />
          <path d="M7 10v4.2c0 1.3 2.2 2.8 5 2.8s5-1.5 5-2.8V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M20 7.5V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      {!collapsed &&
      <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight text-foreground">Sabab</span>
          <span lang="bn" className="block font-bn text-[10.5px] text-muted-foreground">সাবাব · School OS</span>
        </span>
      }
    </div>);

}
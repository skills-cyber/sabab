import React from 'react';
import { cn } from '../../utils/cn';

type Tone = 'danger' | 'primary' | 'neutral' | 'active';

interface CountBadgeProps {
  count: number;
  /** danger = needs attention (solid red); neutral/active = informational count. */
  tone?: Tone;
  /** Pin to the top-right corner of a relatively positioned icon button. */
  overlay?: boolean;
  max?: number;
  className?: string;
  label?: string;
}

const toneCls: Record<Tone, string> = {
  danger: 'bg-danger text-white',
  primary: 'bg-primary text-primary-foreground',
  neutral: 'bg-muted text-muted-foreground',
  active: 'bg-accent text-accent-foreground'
};

/**
 * The one count / notification badge used across Sabab (bell, sidebar, module strip, tabs).
 * Fixed 18px height, perfectly centred digits, pill grows for 2–3 digits, caps at 99+.
 */
export function CountBadge({ count, tone = 'danger', overlay, max = 99, className, label }: CountBadgeProps) {
  if (count <= 0) return null;
  const text = count > max ? `${max}+` : String(count);
  return (
    <span
      aria-label={label ?? `${count}`}
      className={cn(
        'inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-[5px] text-[10.5px] font-semibold leading-none tabular-nums',
        toneCls[tone],
        overlay && 'pointer-events-none absolute -right-1 -top-1 ring-2 ring-card',
        className
      )}>
      
      {text}
    </span>);

}
import React, { useId } from 'react';
import { LayoutGroup, MotionConfig, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface SegmentedProps<T extends string> {
  options: Array<{value: T;label: React.ReactNode;count?: number;}>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
  /** default = 36px (matches inputs/buttons), sm = 32px for dense toolbars. */
  size?: 'default' | 'sm';
}

/**
 * HisabIQ segmented filter. Standard geometry used everywhere:
 * 4px even inset on all sides, outer radius 8px → inner radius 5px (concentric),
 * total height equals the control height (36px / 32px) so it aligns with inputs and buttons.
 * The raised "thumb" glides between options with a soft spring; arrow keys move the selection.
 */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel, className, size = 'default' }: SegmentedProps<T>) {
  const groupId = useId();

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={groupId}>
        <div
          role="radiogroup"
          aria-label={ariaLabel}
          onKeyDown={onKeyDown}
          className={cn('inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-muted p-[3px]', size === 'sm' ? 'h-8' : 'h-9', className)}>
          
          {options.map((o) => {
            const on = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => onChange(o.value)}
                className={cn(
                  'relative inline-flex h-full items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] text-xs font-medium leading-none outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
                  size === 'sm' ? 'px-2.5' : 'px-3',
                  on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}>
                
                {on &&
                <motion.span
                  layoutId="segmented-thumb"
                  aria-hidden
                  className="absolute inset-0 rounded-[5px] bg-card shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_var(--border)]"
                  transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.7 }} />

                }
                <span className="relative z-[1] inline-flex items-center gap-1.5">
                  {o.label}
                  {typeof o.count === 'number' &&
                  <span className={cn('text-[10.5px] tabular-nums transition-colors duration-200', on ? 'text-muted-foreground' : 'text-subtle')}>{o.count}</span>
                  }
                </span>
              </button>);

          })}
        </div>
      </LayoutGroup>
    </MotionConfig>);

}
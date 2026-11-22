import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StepperProps {
  steps: Array<{id: string;label: string;}>;
  current: string;
  className?: string;
}

/** Horizontal lifecycle stepper (exam stages, onboarding, approvals). */
export function Stepper({ steps, current, className }: StepperProps) {
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <ol className={cn('flex items-center gap-1 overflow-x-auto scrollbar-thin', className)} aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s.id} className="flex shrink-0 items-center gap-1" aria-current={active ? 'step' : undefined}>
            <span
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium',
                done && 'text-success',
                active && 'bg-accent text-accent-foreground',
                !done && !active && 'text-muted-foreground'
              )}>
              
              <span className={cn('grid size-4 place-items-center rounded-full text-[10px]', done ? 'bg-success text-white dark:text-background' : active ? 'bg-primary text-primary-foreground' : 'border border-border')}>
                {done ? <Check className="size-2.5" /> : i + 1}
              </span>
              {s.label}
            </span>
            {i < steps.length - 1 && <span className={cn('h-px w-4', done ? 'bg-success' : 'bg-border')} aria-hidden />}
          </li>);

      })}
    </ol>);

}
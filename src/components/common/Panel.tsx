import React from 'react';
import { cn } from '../../utils/cn';

interface PanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
  id?: string;
}

/** HisabIQ Panel: rounded-xl bordered surface with a compact header. */
export function Panel({ title, description, actions, children, className, bodyClassName, flush, id }: PanelProps) {
  return (
    <section id={id} className={cn('min-w-0 rounded-xl border border-border bg-card shadow-card', className)}>
      {(title || actions) &&
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      }
      <div className={cn(flush ? '' : 'p-4', bodyClassName)}>{children}</div>
    </section>);

}
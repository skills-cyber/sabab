import React from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  title: string;
  bn?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

/** HisabIQ PageHeader: compact title + Bangla helper + right-aligned actions. */
export function PageHeader({ title, bn, description, actions, meta, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-baseline gap-x-2 text-xl font-semibold tracking-tight text-foreground">
          {title}
          {bn && <span lang="bn" className="font-bn text-sm font-normal text-muted-foreground">{bn}</span>}
        </h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        {meta && <div className="mt-1.5 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>);

}
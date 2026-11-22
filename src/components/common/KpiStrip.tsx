import React from "react";
import { cn } from "../../utils/cn";
import { StatusTone } from "../../utils/status";
import { BoxIcon } from "lucide-react";
export interface KpiItem {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: BoxIcon;
  tone?: StatusTone;
  onClick?: () => void;
}
const iconTone: Record<StatusTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-accent text-accent-foreground'
};

/** One bordered strip of compact metrics (avoids a wall of oversized cards). */
export function KpiStrip({
  items,
  className



}: {items: KpiItem[];className?: string;}) {
  const cols = items.length >= 6 ? 'lg:grid-cols-6' : items.length === 5 ? 'lg:grid-cols-5' : items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
  return <div className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card sm:grid-cols-3', cols, className)}>
      {items.map((k) => {
      const Inner = <>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[12px] font-medium text-muted-foreground">{k.label}</span>
              {k.icon && <span className={cn('grid size-6 shrink-0 place-items-center rounded-md', iconTone[k.tone ?? 'neutral'])}>
                  <k.icon className="size-3.5" aria-hidden />
                </span>}
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-foreground tabular">{k.value}</div>
            {k.sub && <div className="truncate text-[11.5px] text-muted-foreground">{k.sub}</div>}
          </>;
      return k.onClick ? <button key={k.label} type="button" onClick={k.onClick} className="bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60">
            {Inner}
          </button> : <div key={k.label} className="bg-card px-3 py-2.5">{Inner}</div>;
    })}
    </div>;
}
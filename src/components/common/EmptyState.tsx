import React from "react";
import { Inbox, BoxIcon } from "lucide-react";
import { cn } from "../../utils/cn";
interface EmptyStateProps {
  icon?: BoxIcon;
  title: string;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}
export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint,
  action,
  className
}: EmptyStateProps) {
  return <div className={cn('flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center', className)}>
      <span className="grid size-9 place-items-center rounded-lg bg-muted text-subtle">
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>;
}
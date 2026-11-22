import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Lock, OctagonAlert, WifiOff } from 'lucide-react';
import { cn } from '../../utils/cn';

type NoticeKind = 'info' | 'warning' | 'locked' | 'offline' | 'preview' | 'success' | 'error';

const styles: Record<NoticeKind, {cls: string;Icon: typeof Info;}> = {
  success: { cls: 'border-success/20 bg-success-bg text-success', Icon: CheckCircle2 },
  error: { cls: 'border-danger/20 bg-danger-bg text-danger', Icon: OctagonAlert },
  info: { cls: 'border-info/20 bg-info-bg text-info', Icon: Info },
  warning: { cls: 'border-warning/20 bg-warning-bg text-warning', Icon: AlertTriangle },
  locked: { cls: 'border-border bg-muted text-muted-foreground', Icon: Lock },
  offline: { cls: 'border-warning/20 bg-warning-bg text-warning', Icon: WifiOff },
  preview: { cls: 'border-dashed border-border bg-card text-muted-foreground', Icon: Info }
};

/** Inline banner for read-only, permission, offline and "prototype only" states. */
export function Notice({ kind = 'info', children, action, className }: {kind?: NoticeKind;children: React.ReactNode;action?: React.ReactNode;className?: string;}) {
  const { cls, Icon } = styles[kind];
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px]', cls, className)} role={kind === 'warning' || kind === 'error' ? 'alert' : 'note'}>
      <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>);

}
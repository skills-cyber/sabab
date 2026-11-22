import React from 'react';
import type { TimelineEntry } from '../../types/academic';
import { cn } from '../../utils/cn';

const dot: Record<NonNullable<TimelineEntry['tone']>, string> = {
  default: 'bg-subtle',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info'
};

/** Who / what / when audit trail used for approvals, exams, makeups and plan versions. */
export function ApprovalTimeline({ entries, className }: {entries: TimelineEntry[];className?: string;}) {
  return (
    <ol className={cn('relative space-y-3 pl-4', className)}>
      <span className="absolute bottom-1 left-[3px] top-1 w-px bg-border" aria-hidden />
      {entries.map((e, i) =>
      <li key={`${e.at}-${i}`} className="relative">
          <span className={cn('absolute -left-4 top-1.5 size-[7px] rounded-full ring-2 ring-card', dot[e.tone ?? 'default'])} aria-hidden />
          <p className="text-[13px] font-medium text-foreground">{e.action}</p>
          <p className="text-[11.5px] text-muted-foreground">{e.actor} · {e.at}</p>
          {e.note && <p className="mt-0.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">“{e.note}”</p>}
        </li>
      )}
    </ol>);

}
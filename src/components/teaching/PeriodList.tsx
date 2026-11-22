import React from 'react';
import { Coffee, CloudUpload, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { TodayPeriod } from '../../types/academic';
import { periodSlots, rooms } from '../../data/school';
import { SubjectChip } from '../common/SubjectChip';
import { StatusBadge } from '../common/StatusBadge';
import { sectionLabel } from '../../utils/timetable';
import { NOW_TIME } from '../../utils/format';
import { cn } from '../../utils/cn';

interface PeriodListProps {
  periods: TodayPeriod[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function PeriodList({ periods, selectedId, onSelect }: PeriodListProps) {
  return (
    <ol className="space-y-1" aria-label="Today's periods">
      {periodSlots.filter((s) => s.n <= 7).map((slot) => {
        const p = periods.find((x) => x.period === slot.n);
        const showBreak = slot.n === 4 || slot.n === 7;
        const past = slot.end <= NOW_TIME;
        const next = !past && slot.start > NOW_TIME && periods.filter((x) => x.status === 'upcoming' && periodSlots.find((s) => s.n === x.period)!.start > NOW_TIME)[0]?.period === slot.n;
        return (
          <React.Fragment key={slot.n}>
            {showBreak &&
            <li className="flex items-center gap-2 px-2 py-1 text-[11px] text-subtle">
                <Coffee className="size-3" aria-hidden /> {slot.n === 4 ? 'Break 10:00–10:20' : 'Zuhr break 12:20–12:50'}
                {slot.n === 4 && NOW_TIME >= '10:00' && NOW_TIME < '10:20' && <span className="ml-auto rounded bg-accent px-1.5 text-[10px] font-medium text-accent-foreground">Now {NOW_TIME}</span>}
              </li>
            }
            {p ?
            <li>
                <button
                type="button"
                onClick={() => onSelect(p.id)}
                aria-current={selectedId === p.id}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors',
                  selectedId === p.id ? 'border-primary bg-accent/60 ring-1 ring-primary/30' : 'border-border bg-card hover:border-primary/40'
                )}>
                
                  <span className="w-9 shrink-0 text-center">
                    <span className="block text-[11px] font-semibold text-muted-foreground">P{slot.n}</span>
                    <span className="block text-[10.5px] text-subtle tabular">{slot.start}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                      {sectionLabel(p.sectionId)} <SubjectChip id={p.subjectId} className="font-normal" />
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">{rooms.find((r) => r.id === p.roomId)?.label}</span>
                  </span>
                  {p.status === 'submitted' ?
                p.sync === 'pending-sync' ?
                <CloudUpload className="size-4 shrink-0 text-warning" aria-label="Pending sync" /> :

                <CheckCircle2 className={cn('size-4 shrink-0', p.outcome === 'missed' || p.outcome === 'cancelled' ? 'text-danger' : 'text-success')} aria-label={p.outcome} /> :

                past ?
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-warning"><AlertCircle className="size-3.5" /> Log</span> :
                next ?
                <StatusBadge status="in-progress" label="Next" /> :

                <Clock className="size-3.5 shrink-0 text-subtle" aria-label="Upcoming" />
                }
                </button>
              </li> :

            <li className="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-[12px] text-subtle">
                <span className="w-9 text-center font-semibold">P{slot.n}</span> Free period
              </li>
            }
          </React.Fragment>);

      })}
    </ol>);

}
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Panel } from '../common/Panel';
import { Segmented } from '../common/Segmented';
import { Button } from '../ui/Button';
import { AddEventDialog } from './AddEventDialog';
import { eventTypeMeta } from './eventStyles';
import { useAcademic } from '../../contexts/AcademicContext';
import { useApp } from '../../contexts/AppContext';
import { terms } from '../../data/academic';
import type { CalendarEvent } from '../../types/academic';
import { TODAY, formatDate, relativeDay } from '../../utils/format';
import { cn } from '../../utils/cn';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function eventsOn(iso: string, events: CalendarEvent[]): CalendarEvent[] {
  return events.filter((e) => iso >= e.start && iso <= e.end).sort((a, b) => eventTypeMeta[b.type].rank - eventTypeMeta[a.type].rank);
}

export function YearCalendar() {
  const { events } = useAcademic();
  const { canApprove, campusId } = useApp();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'year' | 'month'>('year');
  const [month, setMonth] = useState(parseISO('2026-11-01'));
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState(TODAY);

  useEffect(() => {
    if (params.get('new') === '1') {
      setAddOpen(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const scoped = useMemo(() => events.filter((e) => e.campus === 'all' || campusId === 'all' || e.campus === campusId), [events, campusId]);
  const upcoming = scoped.filter((e) => e.end >= TODAY).slice(0, 8);
  const counts = (Object.keys(eventTypeMeta) as Array<keyof typeof eventTypeMeta>).filter((t) => t !== 'term').map((t) => ({ t, n: scoped.filter((e) => e.type === t).length }));

  const openAdd = (iso: string) => {
    if (!canApprove) return;
    setAddDate(iso);
    setAddOpen(true);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Panel
        title={view === 'year' ? 'Academic year 2026' : format(month, 'MMMM yyyy')}
        description="Sun–Thu school week · Fri & Sat weekend (configurable)"
        actions={
        <>
            {view === 'month' &&
          <>
                <Button size="icon-sm" variant="outline" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft className="size-4" /></Button>
                <Button size="icon-sm" variant="outline" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="size-4" /></Button>
              </>
          }
            <Segmented ariaLabel="Calendar view" value={view} onChange={setView} options={[{ value: 'year', label: 'Year' }, { value: 'month', label: 'Month' }]} />
            {canApprove && <Button size="sm" onClick={() => openAdd(TODAY)}><Plus className="size-4" /> Event</Button>}
          </>
        }>
        
        {view === 'year' ?
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, m) => {
            const first = new Date(2026, m, 1);
            const days = eachDayOfInterval({ start: startOfMonth(first), end: endOfMonth(first) });
            const lead = getDay(first);
            return (
              <div key={m}>
                  <button type="button" onClick={() => {setMonth(first);setView('month');}} className="mb-1 text-[12.5px] font-semibold hover:text-primary">{format(first, 'MMMM')}</button>
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {WEEKDAYS.map((d, i) => <span key={i} className={cn('text-[9.5px] font-medium text-subtle', (i === 5 || i === 6) && 'opacity-60')}>{d}</span>)}
                    {Array.from({ length: lead }).map((_, i) => <span key={`l${i}`} />)}
                    {days.map((d) => {
                    const iso = format(d, 'yyyy-MM-dd');
                    const evs = eventsOn(iso, scoped);
                    const wk = getDay(d) === 5 || getDay(d) === 6;
                    const top = evs[0];
                    return (
                      <span
                        key={iso}
                        title={evs.map((e) => e.title).join(' · ') || (wk ? 'Weekend' : 'School day')}
                        className={cn('grid h-5 place-items-center rounded text-[10px] tabular', top ? eventTypeMeta[top.type].cell : wk ? 'text-subtle/60' : 'text-foreground', iso === TODAY && 'ring-2 ring-primary', iso < TODAY && !top && !wk && 'text-muted-foreground')}>
                        
                          {format(d, 'd')}
                        </span>);

                  })}
                  </div>
                </div>);

          })}
          </div> :

        <MonthGrid month={month} events={scoped} onDayClick={openAdd} canAdd={canApprove} />
        }
        <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3">
          {counts.map(({ t, n }) =>
          <span key={t} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className={cn('size-2.5 rounded-sm', eventTypeMeta[t].cell)} />{eventTypeMeta[t].label} <b className="text-foreground tabular">{n}</b></span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="size-2.5 rounded-sm ring-2 ring-primary" />Today</span>
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title="Terms & working days" flush>
          <ul className="divide-y divide-border">
            {terms.map((t) =>
            <li key={t.id} className="flex items-center justify-between px-4 py-2 text-[12.5px]">
                <span><b className="font-medium">{t.name}</b><span className="block text-[11px] text-muted-foreground">{formatDate(t.start, 'd MMM')} – {formatDate(t.end, 'd MMM')}</span></span>
                <span className="text-right tabular"><b>{t.workingDays}</b><span className="block text-[11px] text-muted-foreground">working days</span></span>
              </li>
            )}
          </ul>
        </Panel>
        <Panel title="Upcoming" flush>
          <ul className="divide-y divide-border">
            {upcoming.map((e) =>
            <li key={e.id} className="flex items-start gap-2 px-4 py-2 text-[12.5px]">
                <span className={cn('mt-0.5 rounded px-1.5 text-[10px] font-medium', eventTypeMeta[e.type].chip)}>{eventTypeMeta[e.type].label}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{e.title}</span>
                  <span className="block text-[11px] text-muted-foreground">{formatDate(e.start, 'd MMM')}{e.end !== e.start ? ` – ${formatDate(e.end, 'd MMM')}` : ''} · {relativeDay(e.start)}{e.campus !== 'all' ? ` · ${e.campus}` : ''}</span>
                  {e.bn && <span lang="bn" className="block font-bn text-[11px] text-muted-foreground">{e.bn}</span>}
                </span>
              </li>
            )}
          </ul>
        </Panel>
      </div>
      <AddEventDialog open={addOpen} onOpenChange={setAddOpen} defaultDate={addDate} />
    </div>);

}

function MonthGrid({ month, events, onDayClick, canAdd }: {month: Date;events: CalendarEvent[];onDayClick: (iso: string) => void;canAdd: boolean;}) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const lead = getDay(days[0]);
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="grid min-w-[620px] grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">{d}</div>)}
        {Array.from({ length: lead }).map((_, i) => <div key={`l${i}`} className="bg-card" />)}
        {days.map((d) => {
          const iso = format(d, 'yyyy-MM-dd');
          const evs = eventsOn(iso, events);
          const wk = getDay(d) === 5 || getDay(d) === 6;
          return (
            <button
              type="button"
              key={iso}
              onClick={() => onDayClick(iso)}
              disabled={!canAdd}
              className={cn('min-h-[78px] bg-card p-1.5 text-left align-top transition-colors enabled:hover:bg-muted/50', wk && 'bg-muted/40')}
              aria-label={`${format(d, 'd MMMM')}${evs.length ? ': ' + evs.map((e) => e.title).join(', ') : ''}`}>
              
              <span className={cn('inline-grid size-5 place-items-center rounded-full text-[11px] tabular', iso === TODAY ? 'bg-primary font-semibold text-primary-foreground' : wk ? 'text-subtle' : 'text-foreground')}>{format(d, 'd')}</span>
              <div className="mt-1 space-y-0.5">
                {evs.slice(0, 3).map((e) => <span key={e.id} className={cn('block truncate rounded px-1 text-[10.5px] font-medium', eventTypeMeta[e.type].chip)}>{e.title}</span>)}
                {evs.length > 3 && <span className="block text-[10px] text-muted-foreground">+{evs.length - 3} more</span>}
              </div>
            </button>);

        })}
      </div>
    </div>);

}
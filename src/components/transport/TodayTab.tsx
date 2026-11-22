import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, CheckCircle2, ChevronDown, Clock, Navigation, PlayCircle, Satellite, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '../common/Panel';
import { StatusBadge } from '../common/StatusBadge';
import { Segmented } from '../common/Segmented';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import type { Trip } from '../../types/transport';
import type { TransportStore } from './useTransport';
import { sectionLabel } from '../../utils/timetable';
import { revealVariants } from '../../utils/motion';
import { cn } from '../../utils/cn';

interface Props {
  store: TransportStore;
  campusId: string;
  canOperate: boolean;
}

/** Live trip board for today: depart / arrive / delay / cancel with guardian SMS, and stop-wise boarding check. */
export function TodayTab({ store, campusId, canOperate }: Props) {
  const [leg, setLeg] = useState<Trip['leg']>('afternoon');
  const [openId, setOpenId] = useState<string | null>(null);
  const [delay, setDelay] = useState<Trip | null>(null);
  const [delayMin, setDelayMin] = useState('15');
  const [cancel, setCancel] = useState<Trip | null>(null);

  const trips = store.trips.filter((t) => t.leg === leg && (campusId === 'all' || store.routes.find((r) => r.id === t.routeId)?.campusId === campusId));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented ariaLabel="Trip leg" value={leg} onChange={setLeg} options={[{ value: 'morning', label: 'Morning pickup' }, { value: 'afternoon', label: 'Afternoon drop' }]} />
        <p className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground"><Satellite className="size-3.5" /> GPS tracking is designed — live map needs device integration.</p>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {trips.map((t) => {
          const route = store.routes.find((r) => r.id === t.routeId)!;
          const v = store.vehicleOf(route.id);
          const driver = store.staff.find((s) => s.id === route.driverId);
          const riderList = store.ridersOf(route.id).filter((r) => r.mode === 'both' || r.mode === leg);
          const expanded = openId === t.id;
          const closed = t.state === 'arrived' || t.state === 'cancelled';
          return (
            <Panel key={t.id} flush>
              <div className="flex items-start gap-3 p-3">
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', t.state === 'arrived' ? 'bg-success-bg text-success' : t.state === 'cancelled' ? 'bg-danger-bg text-danger' : t.state === 'delayed' ? 'bg-warning-bg text-warning' : t.state === 'departed' ? 'bg-info-bg text-info' : 'bg-muted text-muted-foreground')}>
                  <Navigation className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold">{route.id} · {route.name}</p>
                    <StatusBadge status={t.state} label={t.state === 'delayed' ? `Delayed ${t.delayMin} min` : undefined} />
                  </div>
                  <p className="text-[12px] text-muted-foreground">{v ? `${v.id} · ${v.regNo}` : 'No vehicle'} · {driver?.name ?? 'No driver'}{driver ? ` · ${driver.phone}` : ''}</p>
                  <p className="mt-0.5 text-[12px] tabular text-muted-foreground">
                    {t.departedAt ? `Departed ${t.departedAt}` : `Starts ${leg === 'morning' ? route.stops[0]?.pickup : '14:00'}`}
                    {t.arrivedAt && ` · completed ${t.arrivedAt}`} · boarded <b className="text-foreground">{t.boarded.length}/{riderList.length}</b>
                  </p>
                  {t.note && <p className="mt-1 text-[12px] text-muted-foreground">“{t.note}”</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-3 py-2">
                {t.state === 'scheduled' && <Button size="xs" disabled={!canOperate || !v || v.status !== 'active'} onClick={() => {store.depart(t.id);toast.success(`${route.id} departed`);}}><PlayCircle className="size-3.5" /> Depart</Button>}
                {(t.state === 'departed' || t.state === 'delayed') && <Button size="xs" disabled={!canOperate} onClick={() => {const n = store.arrive(t.id);toast.success(`${route.id} trip completed`, { description: n ? `Arrival SMS queued to ${n} guardians` : undefined });}}><CheckCircle2 className="size-3.5" /> Mark completed</Button>}
                {!closed && <Button size="xs" variant="outline" disabled={!canOperate} onClick={() => {setDelay(t);setDelayMin(String(t.delayMin || 15));}}><Clock className="size-3.5" /> Delay</Button>}
                {!closed && <Button size="xs" variant="ghost" className="text-danger hover:text-danger" disabled={!canOperate} onClick={() => setCancel(t)}><Ban className="size-3.5" /> Cancel</Button>}
                <Button size="xs" variant="ghost" className="ml-auto" aria-expanded={expanded} onClick={() => setOpenId(expanded ? null : t.id)}>
                  <UserCheck className="size-3.5" /> Boarding <ChevronDown className={cn('size-3.5 transition-transform duration-200', expanded && 'rotate-180')} />
                </Button>
              </div>
              {v && v.status !== 'active' && t.state === 'scheduled' && <Notice kind="warning" className="m-3">{v.id} is in the workshop — reassign a vehicle in Routes or cancel this trip.</Notice>}
              <AnimatePresence initial={false}>
                {expanded &&
                <motion.div variants={revealVariants} initial="hidden" animate="show" exit="exit" className="overflow-hidden border-t border-border">
                    {riderList.length === 0 ?
                  <p className="px-3 py-4 text-center text-[12.5px] text-muted-foreground">No riders on this leg.</p> :

                  <>
                        {route.stops.map((stop) => {
                      const atStop = riderList.filter((r) => r.stopId === stop.id);
                      if (!atStop.length) return null;
                      return (
                        <div key={stop.id} className="border-b border-border last:border-0">
                              <p className="flex justify-between bg-muted/60 px-3 py-1 text-[11.5px] font-medium text-muted-foreground"><span>{stop.name}</span><span className="tabular">{leg === 'morning' ? stop.pickup : stop.drop}</span></p>
                              <ul>
                                {atStop.map((r) => {
                              const s = store.students.find((x) => x.id === r.studentId);
                              if (!s) return null;
                              const on = t.boarded.includes(s.id);
                              return (
                                <li key={s.id}>
                                      <label className={cn('flex min-h-10 cursor-pointer items-center gap-3 px-3 py-1.5 text-[13px] transition-colors hover:bg-muted', (t.state === 'cancelled' || !canOperate) && 'cursor-not-allowed opacity-60')}>
                                        <Checkbox checked={on} disabled={t.state === 'cancelled' || !canOperate} onCheckedChange={() => store.toggleBoard(t.id, s.id)} aria-label={`${s.name} boarded`} />
                                        <span className="flex-1 font-medium">{s.name}</span>
                                        <span className="text-[11.5px] text-muted-foreground">{sectionLabel(s.sectionId)}</span>
                                      </label>
                                    </li>);

                            })}
                              </ul>
                            </div>);

                    })}
                        {canOperate && t.state !== 'cancelled' &&
                    <div className="flex justify-end gap-2 px-3 py-2">
                            <Button size="xs" variant="ghost" onClick={() => store.boardAll(t.id, [])}>Clear</Button>
                            <Button size="xs" variant="outline" onClick={() => {store.boardAll(t.id, riderList.map((r) => r.studentId));toast.success('All riders marked boarded');}}>Mark all boarded</Button>
                          </div>
                    }
                      </>
                  }
                  </motion.div>
                }
              </AnimatePresence>
            </Panel>);

        })}
      </div>
      {trips.length === 0 && <Panel><p className="py-6 text-center text-[13px] text-muted-foreground">No trips for this campus.</p></Panel>}

      <ConfirmDialog
        open={!!delay}
        onOpenChange={(o) => !o && setDelay(null)}
        title={`Report delay · ${delay?.routeId}`}
        description="Guardians of riders on this route who opted in receive an SMS."
        confirmLabel="Notify guardians"
        reasonLabel="Cause (sent in SMS)"
        onConfirm={(r) => {
          const m = Number(delayMin);
          if (!delay || !Number.isFinite(m) || m < 1) return;
          const n = store.markDelay(delay.id, m, r);
          toast.success(`Delay reported`, { description: `SMS queued to ${n} guardians` });
          setDelay(null);
        }}>
        
        <Field label="Expected delay (minutes)" htmlFor="tr-delay"><Input id="tr-delay" type="number" min={1} max={180} className="w-28 tabular" value={delayMin} onChange={(e) => setDelayMin(e.target.value)} /></Field>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!cancel}
        onOpenChange={(o) => !o && setCancel(null)}
        title={`Cancel ${cancel?.routeId} ${cancel?.leg} trip?`}
        description="Guardians are told to arrange their own pickup. This cannot be undone for today."
        confirmLabel="Cancel trip"
        destructive
        reasonLabel="Reason"
        onConfirm={(r) => {if (!cancel) return;const n = store.cancelTrip(cancel.id, r);toast.success('Trip cancelled', { description: `SMS queued to ${n} guardians` });setCancel(null);}} />
      
    </div>);

}
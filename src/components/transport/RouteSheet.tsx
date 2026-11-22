import React, { useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { UnderlineTabs } from '../common/UnderlineTabs';
import { StatusBadge } from '../common/StatusBadge';
import { SelectField } from '../common/SelectField';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { campuses } from '../../data/school';
import { zoneFees } from '../../data/transport';
import type { BusRoute } from '../../types/transport';
import type { TransportStore } from './useTransport';
import { formatBDT } from '../../utils/format';
import { sectionLabel } from '../../utils/timetable';
import { cn } from '../../utils/cn';

interface Props {
  route: BusRoute | null;
  store: TransportStore;
  canEdit: boolean;
  onOpenChange: (o: boolean) => void;
}

/** Route detail: crew & vehicle (with capacity check), stop editor, rider manifest. */
export function RouteSheet({ route, store, canEdit, onOpenChange }: Props) {
  const [tab, setTab] = useState('stops');
  const [stop, setStop] = useState({ name: '', pickup: '07:00', drop: '14:30' });
  const [stopErr, setStopErr] = useState<string | null>(null);
  const r = route;
  const riders = r ? store.ridersOf(r.id) : [];
  const none = { value: 'none', label: 'Not assigned' };

  const assignVehicle = (vid: string) => {
    if (!r) return;
    const v = store.vehicles.find((x) => x.id === vid);
    if (v && riders.length > v.capacity) return toast.error(`${v.id} seats ${v.capacity} — ${riders.length} riders on this route`);
    const other = store.routes.find((x) => x.vehicleId === vid && x.id !== r.id);
    store.updateRoute(r.id, { vehicleId: vid === 'none' ? null : vid }, 'Vehicle reassigned');
    toast.success(vid === 'none' ? 'Vehicle removed' : `${vid} assigned`, { description: other ? `Also serves ${other.id} — check timings don't overlap.` : undefined });
  };

  const addStop = () => {
    if (!r) return;
    if (stop.name.trim().length < 3) return setStopErr('Stop name is required.');
    if (r.stops.some((s) => s.name.toLowerCase() === stop.name.trim().toLowerCase())) return setStopErr('Stop already exists on this route.');
    store.addStop(r.id, { ...stop, name: stop.name.trim() });
    setStop({ name: '', pickup: '07:00', drop: '14:30' });
    setStopErr(null);
    toast.success('Stop added');
  };

  return (
    <Sheet open={!!r} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {r &&
        <>
            <SheetHeader className="border-b border-border">
              <SheetTitle>{r.id} · {r.name}</SheetTitle>
              <SheetDescription>{campuses.find((c) => c.id === r.campusId)?.short} · Zone {r.zone} · {formatBDT(zoneFees[r.zone])}/month · {r.stops.length} stops · {riders.length} riders</SheetDescription>
              <div className="flex flex-wrap gap-1.5 pt-1"><StatusBadge status={r.status} /></div>
            </SheetHeader>

            <section className="grid gap-3 border-b border-border p-4 sm:grid-cols-3">
              <Field label="Vehicle" htmlFor="rs-v"><SelectField id="rs-v" size="sm" disabled={!canEdit} value={r.vehicleId ?? 'none'} onValueChange={assignVehicle} options={[none, ...store.vehicles.filter((v) => v.status !== 'retired').map((v) => ({ value: v.id, label: `${v.id} · ${v.capacity} seats${v.status === 'maintenance' ? ' · workshop' : ''}` }))]} /></Field>
              <Field label="Driver" htmlFor="rs-d"><SelectField id="rs-d" size="sm" disabled={!canEdit} value={r.driverId ?? 'none'} onValueChange={(v) => {store.updateRoute(r.id, { driverId: v === 'none' ? null : v }, 'Driver reassigned');toast.success('Driver updated');}} options={[none, ...store.staff.filter((s) => s.role === 'Driver').map((s) => ({ value: s.id, label: s.name }))]} /></Field>
              <Field label="Attendant" htmlFor="rs-a"><SelectField id="rs-a" size="sm" disabled={!canEdit} value={r.attendantId ?? 'none'} onValueChange={(v) => {store.updateRoute(r.id, { attendantId: v === 'none' ? null : v }, 'Attendant reassigned');toast.success('Attendant updated');}} options={[none, ...store.staff.filter((s) => s.role === 'Attendant').map((s) => ({ value: s.id, label: s.name }))]} /></Field>
              {!r.attendantId && <Notice kind="warning" className="sm:col-span-3">No attendant — school policy requires a female attendant on routes carrying primary students.</Notice>}
            </section>

            <div className="px-4 pt-2"><UnderlineTabs layoutId="route-sheet-tabs" value={tab} onChange={setTab} tabs={[{ id: 'stops', label: 'Stops', count: r.stops.length }, { id: 'riders', label: 'Riders', count: riders.length }]} /></div>

            <div className="p-4">
              {tab === 'stops' &&
            <div className="space-y-3">
                  <ol className="relative space-y-0 rounded-lg border border-border">
                    {r.stops.map((s, i) => {
                  const n = riders.filter((x) => x.stopId === s.id).length;
                  return (
                    <li key={s.id} className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-0">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground tabular">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground">{n} rider{n === 1 ? '' : 's'}</p>
                          </div>
                          <label className="text-[10.5px] text-muted-foreground">AM<Input aria-label={`${s.name} pickup`} type="time" disabled={!canEdit} className="h-8 w-[92px] tabular" defaultValue={s.pickup} onBlur={(e) => e.target.value !== s.pickup && (store.updateStop(r.id, s.id, { pickup: e.target.value }), toast.success('Pickup time updated', { description: 'Riders at this stop will be notified on next SMS.' }))} /></label>
                          <label className="text-[10.5px] text-muted-foreground">PM<Input aria-label={`${s.name} drop`} type="time" disabled={!canEdit} className="h-8 w-[92px] tabular" defaultValue={s.drop} onBlur={(e) => e.target.value !== s.drop && (store.updateStop(r.id, s.id, { drop: e.target.value }), toast.success('Drop time updated'))} /></label>
                          <Button size="icon-sm" variant="ghost" className="mt-3 text-muted-foreground hover:text-danger" disabled={!canEdit || n > 0} title={n > 0 ? 'Move riders before removing this stop' : 'Remove stop'} aria-label={`Remove ${s.name}`} onClick={() => {store.removeStop(r.id, s.id);toast.success('Stop removed');}}><Trash2 className="size-3.5" /></Button>
                        </li>);

                })}
                  </ol>
                  {canEdit &&
              <div className="rounded-lg border border-dashed border-border p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold"><MapPin className="size-3.5 text-primary" /> Add stop</p>
                      <div className="grid gap-2 sm:grid-cols-[1fr_96px_96px_auto] sm:items-end">
                        <Field label="Name" error={stopErr ?? undefined} htmlFor="st-n"><Input id="st-n" className="h-8" value={stop.name} onChange={(e) => setStop({ ...stop, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addStop()} placeholder="e.g. Agargaon IDB" /></Field>
                        <Field label="Pickup" htmlFor="st-p"><Input id="st-p" type="time" className="h-8 tabular" value={stop.pickup} onChange={(e) => setStop({ ...stop, pickup: e.target.value })} /></Field>
                        <Field label="Drop" htmlFor="st-d"><Input id="st-d" type="time" className="h-8 tabular" value={stop.drop} onChange={(e) => setStop({ ...stop, drop: e.target.value })} /></Field>
                        <Button size="sm" onClick={addStop}><Plus className="size-4" /> Add</Button>
                      </div>
                    </div>
              }
                </div>
            }
              {tab === 'riders' && (
            riders.length === 0 ? <p className="py-6 text-center text-[13px] text-muted-foreground">No riders yet — assign from the Riders tab.</p> :
            <ul className="divide-y divide-border rounded-lg border border-border">
                    {riders.map((x) => {
                const s = store.students.find((y) => y.id === x.studentId);
                const st = r.stops.find((y) => y.id === x.stopId);
                return s ?
                <li key={x.studentId} className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
                          <div><p className="font-medium">{s.name}</p><p className="text-[11px] text-muted-foreground">{sectionLabel(s.sectionId)} · {s.guardianPhone}</p></div>
                          <div className="text-right"><p className="text-[12px]">{st?.name}</p><p className={cn('text-[11px] text-muted-foreground', x.mode !== 'both' && 'text-warning')}>{x.mode === 'both' ? 'Both ways' : x.mode === 'morning' ? 'Morning only' : 'Afternoon only'}</p></div>
                        </li> :
                null;
              })}
                  </ul>)

            }
            </div>
          </>
        }
      </SheetContent>
    </Sheet>);

}
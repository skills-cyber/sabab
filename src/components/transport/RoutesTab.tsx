import React, { useState } from 'react';
import { Eye, PauseCircle, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { campuses } from '../../data/school';
import { zoneFees } from '../../data/transport';
import type { BusRoute } from '../../types/transport';
import type { TransportStore } from './useTransport';
import { RouteSheet } from './RouteSheet';
import { formatBDT } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Props {
  store: TransportStore;
  campusId: string;
  canEdit: boolean;
  newOpen: boolean;
  setNewOpen: (o: boolean) => void;
}

type StopDraft = {name: string;pickup: string;drop: string;};

/** Route list with load %, crew, zone fee — inline rename, suspend/resume, new-route dialog with stops. */
export function RoutesTab({ store, campusId, canEdit, newOpen, setNewOpen }: Props) {
  const [viewId, setViewId] = useState<string | null>(null);
  const [suspend, setSuspend] = useState<BusRoute | null>(null);
  const [form, setForm] = useState({ name: '', campusId: 'mirpur', zone: 'A' as BusRoute['zone'], vehicleId: 'none', driverId: 'none' });
  const [stops, setStops] = useState<StopDraft[]>([{ name: '', pickup: '07:00', drop: '14:30' }]);
  const [err, setErr] = useState<Record<string, string>>({});
  const rows = store.routes.filter((r) => campusId === 'all' || r.campusId === campusId);

  const columns: Column<BusRoute>[] = [
  {
    id: 'name', header: 'Route', sortValue: (r) => r.id, cell: (r) => <div><p className="font-medium">{r.id} · {r.name}</p><p className="text-[11px] text-muted-foreground">{campuses.find((c) => c.id === r.campusId)?.short} · {r.stops.length} stops · {r.stops[0]?.pickup}–{r.stops.at(-1)?.pickup}</p></div>,
    edit: { value: (r) => r.name, lockedReason: () => !canEdit ? 'Transport managers only.' : null, onSave: (r, v) => {if (v.trim().length < 3) return 'Min 3 characters';store.updateRoute(r.id, { name: v.trim() }, 'Route renamed');} }
  },
  { id: 'zone', header: 'Zone · fee', sortValue: (r) => zoneFees[r.zone], cell: (r) => <span className="whitespace-nowrap">Zone {r.zone} <span className="text-muted-foreground tabular">· {formatBDT(zoneFees[r.zone])}</span></span> },
  { id: 'vehicle', header: 'Vehicle', mobileHidden: true, cell: (r) => {const v = store.vehicles.find((x) => x.id === r.vehicleId);return v ? <span className={cn(v.status !== 'active' && 'text-warning')}>{v.id}{v.status !== 'active' && ' · workshop'}</span> : <span className="text-danger">Unassigned</span>;} },
  { id: 'crew', header: 'Driver', mobileHidden: true, cell: (r) => store.staff.find((s) => s.id === r.driverId)?.name ?? <span className="text-danger">Unassigned</span> },
  {
    id: 'load', header: 'Load', sortValue: (r) => store.loadOf(r.id).pct, cell: (r) => {
      const l = store.loadOf(r.id);
      return (
        <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><span className={cn('block h-full rounded-full', l.pct > 100 ? 'bg-danger' : l.pct >= 85 ? 'bg-warning' : 'bg-primary')} style={{ width: `${Math.min(100, l.pct)}%` }} /></span>
            <span className="text-[12px] tabular">{l.riders}/{l.capacity || '—'}</span>
          </span>);

    }
  },
  { id: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> }];


  const create = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = 'Route name is required.';
    const valid = stops.filter((s) => s.name.trim());
    if (valid.length < 2) e.stops = 'Add at least two stops.';
    setErr(e);
    if (Object.keys(e).length) return;
    const id = store.addRoute({ name: form.name.trim(), campusId: form.campusId, zone: form.zone, vehicleId: form.vehicleId === 'none' ? null : form.vehicleId, driverId: form.driverId === 'none' ? null : form.driverId, attendantId: null, stops: valid.map((s) => ({ ...s, name: s.name.trim() })) });
    toast.success(`${id} created`, { description: 'Assign riders from the Riders tab.' });
    setNewOpen(false);
    setForm({ name: '', campusId: 'mirpur', zone: 'A', vehicleId: 'none', driverId: 'none' });
    setStops([{ name: '', pickup: '07:00', drop: '14:30' }]);
  };

  return (
    <>
      <DataTable
        ariaLabel="Routes"
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={(r) => setViewId(r.id)}
        searchText={(r) => `${r.id} ${r.name} ${r.stops.map((s) => s.name).join(' ')}`}
        searchPlaceholder="Route or stop…"
        rowActions={(r) => [
        { label: 'Open route', icon: Eye, onSelect: () => setViewId(r.id) },
        r.status === 'active' ?
        { label: 'Suspend route', icon: PauseCircle, destructive: true, separatorBefore: true, disabled: !canEdit, onSelect: () => setSuspend(r) } :
        { label: 'Resume route', icon: PlayCircle, separatorBefore: true, disabled: !canEdit, onSelect: () => {store.updateRoute(r.id, { status: 'active' }, 'Route resumed');toast.success(`${r.id} resumed`);} }]
        }
        emptyTitle="No routes for this campus"
        emptyAction={canEdit ? <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="size-4" /> New route</Button> : undefined}
        footerNote="Fictional sample routes" />
      

      <RouteSheet route={store.routes.find((r) => r.id === viewId) ?? null} store={store} canEdit={canEdit} onOpenChange={(o) => !o && setViewId(null)} />

      <ConfirmDialog
        open={!!suspend}
        onOpenChange={(o) => !o && setSuspend(null)}
        title={`Suspend ${suspend?.id}?`}
        description={`${suspend ? store.ridersOf(suspend.id).length : 0} riders keep their assignment; no trips run and guardians are notified.`}
        confirmLabel="Suspend"
        destructive
        reasonLabel="Reason"
        onConfirm={(reason) => {if (suspend) {store.updateRoute(suspend.id, { status: 'suspended' }, `Route suspended: ${reason}`);toast.success(`${suspend.id} suspended`);}setSuspend(null);}} />
      

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New route</DialogTitle>
            <DialogDescription>Stops are ordered by pickup time. The monthly fee comes from the zone.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Route name" required error={err.name} htmlFor="nr-n" className="sm:col-span-2"><Input id="nr-n" data-autofocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Agargaon – Taltola" /></Field>
            <Field label="Campus" htmlFor="nr-c"><SelectField id="nr-c" value={form.campusId} onValueChange={(v) => setForm({ ...form, campusId: v })} options={campuses.map((c) => ({ value: c.id, label: c.short }))} /></Field>
            <Field label="Zone" htmlFor="nr-z"><SelectField id="nr-z" value={form.zone} onValueChange={(v) => setForm({ ...form, zone: v as BusRoute['zone'] })} options={(['A', 'B', 'C'] as const).map((z) => ({ value: z, label: `Zone ${z} · ${formatBDT(zoneFees[z])}/mo` }))} /></Field>
            <Field label="Vehicle" htmlFor="nr-v"><SelectField id="nr-v" value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })} options={[{ value: 'none', label: 'Assign later' }, ...store.vehicles.filter((v) => v.status === 'active').map((v) => ({ value: v.id, label: `${v.id} · ${v.capacity} seats` }))]} /></Field>
            <Field label="Driver" htmlFor="nr-d"><SelectField id="nr-d" value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })} options={[{ value: 'none', label: 'Assign later' }, ...store.staff.filter((s) => s.role === 'Driver').map((s) => ({ value: s.id, label: s.name }))]} /></Field>
          </div>
          <div className="space-y-2">
            <p className="text-[12px] font-semibold">Stops {err.stops && <span className="font-normal text-danger">· {err.stops}</span>}</p>
            {stops.map((s, i) =>
            <div key={i} className="grid grid-cols-[1fr_92px_92px_auto] gap-2">
                <Input aria-label={`Stop ${i + 1} name`} className="h-8" value={s.name} onChange={(e) => setStops(stops.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder={`Stop ${i + 1}`} />
                <Input aria-label={`Stop ${i + 1} pickup`} type="time" className="h-8 tabular" value={s.pickup} onChange={(e) => setStops(stops.map((x, j) => j === i ? { ...x, pickup: e.target.value } : x))} />
                <Input aria-label={`Stop ${i + 1} drop`} type="time" className="h-8 tabular" value={s.drop} onChange={(e) => setStops(stops.map((x, j) => j === i ? { ...x, drop: e.target.value } : x))} />
                <Button size="icon-sm" variant="ghost" aria-label="Remove stop" disabled={stops.length === 1} onClick={() => setStops(stops.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button>
              </div>
            )}
            <Button size="xs" variant="ghost" onClick={() => setStops([...stops, { name: '', pickup: stops.at(-1)?.pickup ?? '07:00', drop: stops.at(-1)?.drop ?? '14:30' }])}><Plus className="size-3.5" /> Add stop</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create route</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

}
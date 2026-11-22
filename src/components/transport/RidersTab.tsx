import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, Download, MessageSquare, Plus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { PersonCell } from '../common/PersonCell';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useAdmin } from '../../contexts/AdminContext';
import { zoneFees } from '../../data/transport';
import type { RiderAssignment } from '../../types/transport';
import type { TransportStore } from './useTransport';
import { TODAY, downloadCsv, formatBDT } from '../../utils/format';
import { sectionLabel } from '../../utils/timetable';

interface Row extends RiderAssignment {
  name: string;
  nameBn: string;
  section: string;
  phone: string;
}

interface Props {
  store: TransportStore;
  campusId: string;
  canEdit: boolean;
  assignOpen: boolean;
  setAssignOpen: (o: boolean) => void;
}

/** Rider list with route/stop, monthly fee, move/remove; assign dialog with capacity check. */
export function RidersTab({ store, campusId, canEdit, assignOpen, setAssignOpen }: Props) {
  const { queueMessage } = useAdmin();
  const [routeFilter, setRouteFilter] = useState('all');
  const [editing, setEditing] = useState<RiderAssignment | null>(null);
  const [form, setForm] = useState<RiderAssignment>({ studentId: '', routeId: 'R1', stopId: 'R1-1', since: TODAY, mode: 'both' });
  const [remove, setRemove] = useState<Row | null>(null);

  const routesInScope = store.routes.filter((r) => campusId === 'all' || r.campusId === campusId);
  const rows: Row[] = useMemo(
    () =>
    store.riders.
    filter((a) => routesInScope.some((r) => r.id === a.routeId) && (routeFilter === 'all' || a.routeId === routeFilter)).
    map((a) => {
      const s = store.students.find((x) => x.id === a.studentId);
      return { ...a, name: s?.name ?? a.studentId, nameBn: s?.nameBn ?? '', section: s ? sectionLabel(s.sectionId) : '—', phone: s?.guardianPhone ?? '' };
    }),
    [store.riders, store.students, routesInScope, routeFilter]
  );

  const columns: Column<Row>[] = [
  { id: 'name', header: 'Student', sortValue: (r) => r.name, cell: (r) => <PersonCell name={r.name} bn={r.nameBn} sub={r.section} /> },
  { id: 'route', header: 'Route', sortValue: (r) => r.routeId, cell: (r) => <span className="whitespace-nowrap">{r.routeId} · {store.routes.find((x) => x.id === r.routeId)?.name}</span> },
  { id: 'stop', header: 'Stop', mobileHidden: true, cell: (r) => {const st = store.routes.find((x) => x.id === r.routeId)?.stops.find((s) => s.id === r.stopId);return st ? <span>{st.name} <span className="text-[11px] text-muted-foreground tabular">· {st.pickup}</span></span> : <span className="text-danger">Stop removed</span>;} },
  { id: 'mode', header: 'Ways', cell: (r) => r.mode === 'both' ? 'Both' : r.mode === 'morning' ? 'Morning' : 'Afternoon' },
  { id: 'fee', header: 'Fee / month', align: 'right', sortValue: (r) => zoneFees[store.routes.find((x) => x.id === r.routeId)?.zone ?? 'A'], cell: (r) => {const z = store.routes.find((x) => x.id === r.routeId)?.zone ?? 'A';const f = r.mode === 'both' ? zoneFees[z] : Math.round(zoneFees[z] * 0.6);return <span className="tabular">{formatBDT(f)}</span>;} },
  { id: 'phone', header: 'Guardian', hideable: true, mobileHidden: true, cell: (r) => <span className="tabular text-muted-foreground">{r.phone}</span> }];


  const openAssign = (a?: RiderAssignment) => {
    setEditing(a ?? null);
    const r = routesInScope[0] ?? store.routes[0];
    setForm(a ?? { studentId: '', routeId: r.id, stopId: r.stops[0]?.id ?? '', since: TODAY, mode: 'both' });
    setAssignOpen(true);
  };

  const route = store.routes.find((r) => r.id === form.routeId);
  const load = route ? store.loadOf(route.id) : { riders: 0, capacity: 0, pct: 0 };
  const willExceed = route && load.capacity > 0 && load.riders + (editing?.routeId === route.id ? 0 : 1) > load.capacity;
  const candidates = store.students.filter((s) => s.status === 'active' && (campusId === 'all' || s.campusId === campusId) && (!store.riders.some((r) => r.studentId === s.id) || s.id === editing?.studentId));

  const save = () => {
    if (!form.studentId) return toast.error('Choose a student');
    if (!form.stopId) return toast.error('Choose a stop');
    if (willExceed) return toast.error(`${route?.vehicleId} is full (${load.capacity} seats)`);
    store.assignRider(form);
    const s = store.students.find((x) => x.id === form.studentId);
    toast.success(editing ? `${s?.name} moved to ${form.routeId}` : `${s?.name} added to ${form.routeId}`, { description: 'Transport fee is added to the next monthly invoice.' });
    setAssignOpen(false);
  };

  return (
    <>
      <DataTable
        ariaLabel="Riders"
        rows={rows}
        columns={columns}
        getRowId={(r) => r.studentId}
        searchText={(r) => `${r.name} ${r.nameBn} ${r.section} ${r.phone}`}
        searchPlaceholder="Student, class or phone…"
        toolbar={<SelectField size="sm" className="w-48" ariaLabel="Route" value={routeFilter} onValueChange={setRouteFilter} options={[{ value: 'all', label: 'All routes' }, ...routesInScope.map((r) => ({ value: r.id, label: `${r.id} · ${r.name}` }))]} />}
        rowActions={(r) => [
        { label: 'Change route / stop', icon: ArrowRightLeft, disabled: !canEdit, onSelect: () => openAssign(r) },
        { label: 'SMS guardian', icon: MessageSquare, onSelect: () => {queueMessage({ channel: 'SMS', audience: `Guardian of ${r.name}`, recipients: 1, template: 'Transport', body: 'Transport update', credits: 1 });toast.success('SMS queued');} },
        { label: 'Remove from transport', icon: UserMinus, destructive: true, separatorBefore: true, disabled: !canEdit, onSelect: () => setRemove(r) }]
        }
        bulkActions={(ids, clear) =>
        <Button size="xs" variant="outline" onClick={() => {downloadCsv('riders.csv', rows.filter((r) => ids.includes(r.studentId)).map((r) => ({ Student: r.name, Class: r.section, Route: r.routeId, Stop: r.stopId, Ways: r.mode, Phone: r.phone })));clear();}}><Download className="size-3.5" /> Export</Button>
        }
        emptyTitle="No riders"
        emptyAction={canEdit ? <Button size="sm" onClick={() => openAssign()}><Plus className="size-4" /> Assign rider</Button> : undefined}
        footerNote="One-way riders pay 60% of the zone fee" />
      

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Change route / stop' : 'Assign rider'}</DialogTitle>
            <DialogDescription>Fee changes apply from the next invoice; the guardian gets the pickup time by SMS.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Student" htmlFor="ra-s"><SelectField id="ra-s" disabled={!!editing} value={form.studentId || 'none'} onValueChange={(v) => setForm({ ...form, studentId: v === 'none' ? '' : v })} options={[{ value: 'none', label: 'Select student…' }, ...candidates.map((s) => ({ value: s.id, label: `${s.name} · ${sectionLabel(s.sectionId)}` }))]} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Route" htmlFor="ra-r"><SelectField id="ra-r" value={form.routeId} onValueChange={(v) => setForm({ ...form, routeId: v, stopId: store.routes.find((r) => r.id === v)?.stops[0]?.id ?? '' })} options={routesInScope.filter((r) => r.status === 'active').map((r) => ({ value: r.id, label: `${r.id} · ${r.name}` }))} /></Field>
              <Field label="Stop" htmlFor="ra-st"><SelectField id="ra-st" value={form.stopId} onValueChange={(v) => setForm({ ...form, stopId: v })} options={(route?.stops ?? []).map((s) => ({ value: s.id, label: `${s.name} · ${s.pickup}` }))} /></Field>
            </div>
            <Field label="Ways"><Segmented ariaLabel="Ways" value={form.mode} onChange={(v) => setForm({ ...form, mode: v })} options={[{ value: 'both', label: 'Both ways' }, { value: 'morning', label: 'Morning' }, { value: 'afternoon', label: 'Afternoon' }]} /></Field>
            {route && <p className="text-[12px] text-muted-foreground">Monthly fee <b className="text-foreground">{formatBDT(form.mode === 'both' ? zoneFees[route.zone] : Math.round(zoneFees[route.zone] * 0.6))}</b> · load {load.riders}/{load.capacity || '—'}</p>}
            {willExceed && <Notice kind="error">{route?.vehicleId} is full. Choose another route or a larger vehicle.</Notice>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button disabled={!!willExceed} onClick={save}>{editing ? 'Save change' : 'Assign'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!remove}
        onOpenChange={(o) => !o && setRemove(null)}
        title={`Remove ${remove?.name} from transport?`}
        description="Transport fee stops from next month. Past trips and invoices stay in history."
        confirmLabel="Remove"
        destructive
        reasonLabel="Reason"
        onConfirm={(reason) => {if (remove) {store.removeRider(remove.studentId, reason);toast.success(`${remove.name} removed from ${remove.routeId}`);}setRemove(null);}} />
      
    </>);

}
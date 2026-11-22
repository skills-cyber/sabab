import React, { useState } from 'react';
import { CalendarCheck2, CheckCircle2, Plus, Satellite, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Panel } from '../common/Panel';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import type { Vehicle } from '../../types/transport';
import { DOC_FIELDS, daysUntil, expiryState, type TransportStore } from './useTransport';
import { TODAY, formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Props {
  store: TransportStore;
  canEdit: boolean;
  addOpen: boolean;
  setAddOpen: (o: boolean) => void;
}

const ExpiryCell = ({ iso }: {iso: string;}) => {
  const s = expiryState(iso);
  const d = daysUntil(iso);
  return <span className={cn('whitespace-nowrap tabular', s === 'expired' && 'font-semibold text-danger', s === 'expiring' && 'font-medium text-warning')} title={s === 'active' ? undefined : s === 'expired' ? `Expired ${-d} days ago` : `${d} days left`}>{formatDate(iso, 'd MMM yy')}</span>;
};

const blankVehicle = { id: '', regNo: '', model: '', capacity: '40', fitnessUntil: '2027-06-30', taxTokenUntil: '2027-01-31', insuranceUntil: '2027-06-30', routePermitUntil: '2027-06-30', gps: true };

/** Fleet register with compliance expiry (fitness, tax token, insurance, permit), renewals and maintenance log. */
export function FleetTab({ store, canEdit, addOpen, setAddOpen }: Props) {
  const [maint, setMaint] = useState<Vehicle | null>(null);
  const [mForm, setMForm] = useState({ work: '', cost: '', odometer: '', workshop: false });
  const [renew, setRenew] = useState<{v: Vehicle;key: (typeof DOC_FIELDS)[number]['key'];} | null>(null);
  const [renewDate, setRenewDate] = useState('2027-11-01');
  const [vf, setVf] = useState(blankVehicle);
  const [vErr, setVErr] = useState<Record<string, string>>({});

  const columns: Column<Vehicle>[] = [
  { id: 'id', header: 'Vehicle', sortValue: (v) => v.id, cell: (v) => <div><p className="flex items-center gap-1.5 font-medium">{v.id}{v.gps && <Satellite className="size-3 text-primary" aria-label="GPS fitted" />}</p><p className="text-[11px] text-muted-foreground">{v.regNo}</p></div> },
  { id: 'model', header: 'Model', mobileHidden: true, cell: (v) => <span className="text-[12.5px]">{v.model}</span> },
  { id: 'route', header: 'Route', cell: (v) => store.routes.filter((r) => r.vehicleId === v.id).map((r) => r.id).join(', ') || <span className="text-subtle">—</span> },
  ...DOC_FIELDS.map((d) => ({ id: d.key, header: d.label, sortValue: (v: Vehicle) => v[d.key], cell: (v: Vehicle) => <ExpiryCell iso={v[d.key]} /> })),
  {
    id: 'odo', header: 'Odometer', align: 'right', hideable: true, sortValue: (v) => v.odometer, cell: (v) => <span className="tabular">{v.odometer.toLocaleString('en-IN')} km</span>,
    edit: { value: (v) => String(v.odometer), type: 'number', lockedReason: () => !canEdit ? 'Transport managers only.' : null, onSave: (v, val) => {const n = Number(val);if (!Number.isInteger(n) || n < v.odometer) return `Must be ≥ ${v.odometer}`;store.updateVehicle(v.id, { odometer: n }, 'Odometer updated');} }
  },
  { id: 'status', header: 'Status', cell: (v) => <StatusBadge status={v.status} /> }];


  const saveMaint = () => {
    if (!maint) return;
    const cost = Number(mForm.cost);
    const odo = Number(mForm.odometer || maint.odometer);
    if (mForm.work.trim().length < 3) return toast.error('Describe the work done');
    if (!Number.isFinite(cost) || cost < 0) return toast.error('Enter a valid cost');
    if (odo < maint.odometer) return toast.error(`Odometer must be ≥ ${maint.odometer}`);
    store.logMaintenance(maint.id, { on: TODAY, work: mForm.work.trim(), cost, odometer: odo }, mForm.workshop);
    toast.success('Maintenance logged', { description: cost ? `${formatBDT(cost)} · post the expense in Accounts` : undefined });
    setMaint(null);
  };

  const addVehicle = () => {
    const e: Record<string, string> = {};
    if (!/^[A-Z]{2,3}-\d{2}$/.test(vf.id.trim().toUpperCase())) e.id = 'Use a code like BUS-05 or MB-06.';
    if (store.vehicles.some((v) => v.id === vf.id.trim().toUpperCase())) e.id = 'Code already used.';
    if (vf.regNo.trim().length < 6) e.regNo = 'Registration number is required.';
    const cap = Number(vf.capacity);
    if (!Number.isInteger(cap) || cap < 4 || cap > 80) e.capacity = '4–80 seats.';
    setVErr(e);
    if (Object.keys(e).length) return;
    store.addVehicle({ id: vf.id.trim().toUpperCase(), regNo: vf.regNo.trim(), model: vf.model.trim() || '—', capacity: cap, fitnessUntil: vf.fitnessUntil, taxTokenUntil: vf.taxTokenUntil, insuranceUntil: vf.insuranceUntil, routePermitUntil: vf.routePermitUntil, odometer: 0, status: 'active', gps: vf.gps });
    toast.success(`${vf.id.toUpperCase()} added to fleet`);
    setVf(blankVehicle);
    setAddOpen(false);
  };

  return (
    <div className="space-y-4">
      {store.complianceAlerts.length > 0 &&
      <Panel title="Compliance due" description="Renew before expiry — expired vehicles must not run" flush>
          <ul className="divide-y divide-border">
            {store.complianceAlerts.map((a) =>
          <li key={a.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                <StatusBadge status={a.state} />
                <span className="flex-1 font-medium">{a.label}</span>
                <span className="text-[12px] tabular text-muted-foreground">{formatDate(a.date, 'd MMM yyyy')} · {a.state === 'expired' ? `${-daysUntil(a.date)}d ago` : `${daysUntil(a.date)}d left`}</span>
              </li>
          )}
          </ul>
        </Panel>
      }

      <DataTable
        ariaLabel="Fleet"
        rows={store.vehicles}
        columns={columns}
        getRowId={(v) => v.id}
        searchText={(v) => `${v.id} ${v.regNo} ${v.model}`}
        searchPlaceholder="Code, registration or model…"
        rowActions={(v) => [
        { label: 'Log maintenance', icon: Wrench, disabled: !canEdit, onSelect: () => {setMaint(v);setMForm({ work: '', cost: '', odometer: String(v.odometer), workshop: false });} },
        ...DOC_FIELDS.map((d, i) => ({ label: `Renew ${d.label.toLowerCase()}`, icon: CalendarCheck2, separatorBefore: i === 0, disabled: !canEdit, onSelect: () => {setRenew({ v, key: d.key });setRenewDate(`${Number(v[d.key].slice(0, 4)) + 1}${v[d.key].slice(4)}`);} })),
        v.status === 'maintenance' ?
        { label: 'Back in service', icon: CheckCircle2, separatorBefore: true, disabled: !canEdit, onSelect: () => {store.updateVehicle(v.id, { status: 'active' }, 'Back in service');toast.success(`${v.id} back in service`);} } :
        { label: 'Send to workshop', icon: Wrench, separatorBefore: true, disabled: !canEdit || v.status === 'retired', onSelect: () => {store.updateVehicle(v.id, { status: 'maintenance' }, 'Sent to workshop');toast.success(`${v.id} in workshop`, { description: store.routes.some((r) => r.vehicleId === v.id) ? 'Reassign its route or cancel trips in Today.' : undefined });} }]
        }
        emptyTitle="No vehicles"
        footerNote="Hover a highlighted date for days remaining" />
      

      <Dialog open={!!maint} onOpenChange={(o) => !o && setMaint(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log maintenance · {maint?.id}</DialogTitle>
            <DialogDescription>Recorded in the vehicle history. Costs are posted as expenses in Accounts.</DialogDescription>
          </DialogHeader>
          {maint && maint.maintenance.length > 0 &&
          <ul className="max-h-32 divide-y divide-border overflow-y-auto rounded-lg border border-border text-[12px] scrollbar-thin">
              {maint.maintenance.map((m, i) => <li key={i} className="flex justify-between gap-2 px-3 py-1.5"><span>{formatDate(m.on, 'd MMM')} · {m.work}</span><span className="tabular text-muted-foreground">{m.cost ? formatBDT(m.cost) : '—'}</span></li>)}
            </ul>
          }
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Work done" required htmlFor="mt-w" className="sm:col-span-2"><Input id="mt-w" data-autofocus value={mForm.work} onChange={(e) => setMForm({ ...mForm, work: e.target.value })} placeholder="e.g. Tyre replacement (rear)" /></Field>
            <Field label="Cost (৳)" htmlFor="mt-c"><Input id="mt-c" type="number" min={0} className="tabular" value={mForm.cost} onChange={(e) => setMForm({ ...mForm, cost: e.target.value })} /></Field>
            <Field label="Odometer (km)" htmlFor="mt-o"><Input id="mt-o" type="number" className="tabular" value={mForm.odometer} onChange={(e) => setMForm({ ...mForm, odometer: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-[13px] sm:col-span-2"><Checkbox checked={mForm.workshop} onCheckedChange={(v) => setMForm({ ...mForm, workshop: v === true })} /> Vehicle stays in workshop (out of service)</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaint(null)}>Cancel</Button>
            <Button onClick={saveMaint}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renew} onOpenChange={(o) => !o && setRenew(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renew {DOC_FIELDS.find((d) => d.key === renew?.key)?.label.toLowerCase()} · {renew?.v.id}</DialogTitle>
            <DialogDescription>Current expiry {renew ? formatDate(renew.v[renew.key]) : ''}. Upload of the renewed paper is designed for the backend phase.</DialogDescription>
          </DialogHeader>
          <Field label="Valid until" htmlFor="rn-d"><Input id="rn-d" type="date" min={TODAY} value={renewDate} onChange={(e) => setRenewDate(e.target.value)} /></Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenew(null)}>Cancel</Button>
            <Button disabled={!renewDate || renewDate <= TODAY} onClick={() => {if (!renew) return;store.updateVehicle(renew.v.id, { [renew.key]: renewDate } as Partial<Vehicle>, 'Document renewed');toast.success('Renewal recorded', { description: `Valid until ${formatDate(renewDate)}` });setRenew(null);}}>Save renewal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add vehicle</DialogTitle>
            <DialogDescription>Owned or hired vehicle. Compliance dates drive the expiry alerts.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Code" required error={vErr.id} htmlFor="av-id"><Input id="av-id" data-autofocus className="uppercase" value={vf.id} onChange={(e) => setVf({ ...vf, id: e.target.value })} placeholder="BUS-05" /></Field>
            <Field label="Seats" required error={vErr.capacity} htmlFor="av-cap"><Input id="av-cap" type="number" className="tabular" value={vf.capacity} onChange={(e) => setVf({ ...vf, capacity: e.target.value })} /></Field>
            <Field label="Registration no." required error={vErr.regNo} htmlFor="av-reg" className="sm:col-span-2"><Input id="av-reg" value={vf.regNo} onChange={(e) => setVf({ ...vf, regNo: e.target.value })} placeholder="Dhaka Metro-JA 11-0000" /></Field>
            <Field label="Model" htmlFor="av-m" className="sm:col-span-2"><Input id="av-m" value={vf.model} onChange={(e) => setVf({ ...vf, model: e.target.value })} /></Field>
            {DOC_FIELDS.map((d) => <Field key={d.key} label={`${d.label} until`} htmlFor={`av-${d.key}`}><Input id={`av-${d.key}`} type="date" value={vf[d.key]} onChange={(e) => setVf({ ...vf, [d.key]: e.target.value })} /></Field>)}
            <label className="flex items-center gap-2 text-[13px] sm:col-span-2"><Checkbox checked={vf.gps} onCheckedChange={(v) => setVf({ ...vf, gps: v === true })} /> GPS tracker fitted</label>
          </div>
          {DOC_FIELDS.some((d) => vf[d.key] <= TODAY) && <Notice kind="warning">Some documents are already expired — the vehicle will show in Compliance due.</Notice>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addVehicle}><Plus className="size-4" /> Add vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}
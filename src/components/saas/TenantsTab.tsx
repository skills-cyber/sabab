import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Ban, Eye, PlayCircle, Plus, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Segmented } from '../common/Segmented';
import { SelectField } from '../common/SelectField';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { TenantSheet } from './TenantSheet';
import { useAdmin } from '../../contexts/AdminContext';
import { plans } from '../../data/saas';
import type { Tenant, TenantStatus } from '../../types/saas';
import { formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

type Filter = 'all' | TenantStatus;

export function TenantsTab() {
  const { tenants, updateTenant } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const [suspend, setSuspend] = useState<Tenant | null>(null);
  const [change, setChange] = useState<Tenant | null>(null);
  const [newPlan, setNewPlan] = useState('growth');

  useEffect(() => {
    const id = params.get('id');
    if (id) {
      setViewId(id);
      params.delete('id');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const rows = useMemo(() => tenants.filter((t) => filter === 'all' || t.status === filter), [tenants, filter]);
  const target = plans.find((p) => p.id === newPlan);
  const overLimit = change && target ? [change.students > target.studentLimit && `students ${change.students} > ${target.studentLimit}`, change.campuses > target.campusLimit && `campuses ${change.campuses} > ${target.campusLimit}`].filter(Boolean) as string[] : [];

  const columns: Column<Tenant>[] = [
  { id: 'name', header: 'School', sortValue: (t) => t.name, cell: (t) => <div className="min-w-[200px]"><p className="font-medium">{t.name}</p><p className="text-[11px] text-muted-foreground">{t.id} · {t.district}</p></div> },
  { id: 'plan', header: 'Plan', sortValue: (t) => t.planId, cell: (t) => plans.find((p) => p.id === t.planId)?.name },
  { id: 'campuses', header: 'Campuses', align: 'right', mobileHidden: true, cell: (t) => <span className="tabular">{t.campuses}/{t.campusLimit}</span> },
  { id: 'students', header: 'Students', align: 'right', sortValue: (t) => t.students / t.studentLimit, cell: (t) => <span className={cn('tabular', t.students / t.studentLimit >= 0.95 && 'font-semibold text-danger')}>{t.students.toLocaleString('en-IN')}<span className="text-muted-foreground">/{t.studentLimit.toLocaleString('en-IN')}</span></span> },
  { id: 'sms', header: 'SMS', align: 'right', hideable: true, sortValue: (t) => t.smsCredits, cell: (t) => <span className={cn('tabular', t.smsCredits < 200 && 'text-warning')}>{t.smsCredits.toLocaleString('en-IN')}</span> },
  { id: 'mrr', header: 'MRR', align: 'right', mobileHidden: true, sortValue: (t) => t.mrr, cell: (t) => <span className="tabular">{t.mrr ? formatBDT(t.mrr) : '—'}</span> },
  { id: 'renews', header: 'Renews', mobileHidden: true, sortValue: (t) => t.renewsOn, cell: (t) => <span className="whitespace-nowrap tabular">{formatDate(t.renewsOn, 'd MMM yy')}</span> },
  { id: 'status', header: 'Status', sortValue: (t) => t.status, cell: (t) => <StatusBadge status={t.status} /> }];


  return (
    <>
      <DataTable
        ariaLabel="Tenants"
        rows={rows}
        columns={columns}
        getRowId={(t) => t.id}
        onRowClick={(t) => setViewId(t.id)}
        searchText={(t) => `${t.name} ${t.id} ${t.district} ${t.contact}`}
        searchPlaceholder="School, ID, district…"
        toolbar={<Segmented ariaLabel="Status" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'trial', label: 'Trial' }, { value: 'grace', label: 'Grace' }, { value: 'suspended', label: 'Suspended' }]} />}
        toolbarRight={<Button size="sm" onClick={() => toast.info('Tenant onboarding wizard', { description: 'Designed: institution → campuses → year → roster import. Not interactive in this prototype.' })}><Plus className="size-4" /> New tenant</Button>}
        rowActions={(t) => [
        { label: 'Entitlements & features', icon: Eye, onSelect: () => setViewId(t.id) },
        { label: 'Change plan', icon: ArrowUpDown, onSelect: () => {setChange(t);setNewPlan(t.planId);} },
        { label: 'Extend grace 7 days', icon: TimerReset, disabled: t.status !== 'grace', onSelect: () => {updateTenant(t.id, { renewsOn: '2026-11-09' }, 'Grace extended 7 days');toast.success('Grace extended to 9 Nov');} },
        { label: 'Reactivate', icon: PlayCircle, disabled: t.status !== 'suspended' && t.status !== 'grace', onSelect: () => {updateTenant(t.id, { status: 'active', health: 'good' }, 'Tenant reactivated');toast.success(`${t.name} reactivated`);} },
        { label: 'Suspend (read-only)', icon: Ban, destructive: true, separatorBefore: true, disabled: t.status === 'suspended', onSelect: () => setSuspend(t) }]
        } />
      
      <TenantSheet tenant={tenants.find((t) => t.id === viewId) ?? null} onOpenChange={(o) => !o && setViewId(null)} />
      <ConfirmDialog
        open={!!suspend}
        onOpenChange={(o) => !o && setSuspend(null)}
        title={`Suspend ${suspend?.name}?`}
        description="The school switches to read-only. No data is deleted; staff can still export records."
        confirmLabel="Suspend"
        destructive
        reasonLabel="Reason"
        onConfirm={(r) => {if (suspend) {updateTenant(suspend.id, { status: 'suspended', health: 'critical' }, `Suspended: ${r}`);toast.warning(`${suspend.name} suspended`);}}} />
      
      <Dialog open={!!change} onOpenChange={(o) => !o && setChange(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change plan · {change?.name}</DialogTitle>
            <DialogDescription>Takes effect at the next billing cycle. Downgrades never delete data.</DialogDescription>
          </DialogHeader>
          <Field label="New plan" htmlFor="tp-plan">
            <SelectField id="tp-plan" value={newPlan} onValueChange={setNewPlan} options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${formatBDT(p.priceMonthly)}/mo · ${p.campusLimit} campus · ${p.studentLimit.toLocaleString('en-IN')} students` }))} />
          </Field>
          {overLimit.length > 0 && <Notice kind="warning">Over the new limits ({overLimit.join(', ')}). Existing records stay readable; adding new records is blocked until within limits.</Notice>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChange(null)}>Cancel</Button>
            <Button disabled={!change || newPlan === change.planId} onClick={() => {if (change && target) {updateTenant(change.id, { planId: newPlan, campusLimit: target.campusLimit, studentLimit: target.studentLimit, mrr: change.mrr ? target.priceMonthly : 0 }, `Plan changed → ${target.name}`);toast.success(`Plan changed to ${target.name}`);setChange(null);}}}>Confirm change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

}
import React from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Switch } from '../ui/Switch';
import { StatusBadge } from '../common/StatusBadge';
import { Notice } from '../common/Notice';
import { useAdmin } from '../../contexts/AdminContext';
import { featureFlags, plans } from '../../data/saas';
import type { Tenant } from '../../types/saas';
import { formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

function Meter({ label, used, limit }: {label: string;used: number;limit: number;}) {
  const p = Math.min(100, Math.round(used / limit * 100));
  return (
    <div>
      <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">{label}</span><span className="tabular">{used.toLocaleString('en-IN')} / {limit.toLocaleString('en-IN')}</span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', p >= 95 ? 'bg-danger' : p >= 80 ? 'bg-warning' : 'bg-primary')} style={{ width: `${p}%` }} /></div>
    </div>);

}

/** Tenant entitlements — platform data only; no access to the school's student records. */
export function TenantSheet({ tenant, onOpenChange }: {tenant: Tenant | null;onOpenChange: (o: boolean) => void;}) {
  const { updateTenant } = useAdmin();
  const t = tenant;
  const plan = plans.find((p) => p.id === t?.planId);

  return (
    <Sheet open={!!t} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {t && plan &&
        <>
            <SheetHeader className="border-b border-border">
              <SheetTitle>{t.name}</SheetTitle>
              <SheetDescription>{t.id} · {t.district} · since {formatDate(t.createdOn, 'MMM yyyy')}</SheetDescription>
              <div className="flex gap-1.5 pt-1"><StatusBadge status={t.status} /><StatusBadge status="published" label={`${plan.name} plan`} /></div>
            </SheetHeader>
            <div className="space-y-5 p-4 text-[13px]">
              <dl className="grid grid-cols-2 gap-3">
                <div><dt className="text-xs text-muted-foreground">Billing contact</dt><dd>{t.contact}</dd><dd className="text-[11.5px] text-muted-foreground tabular">{t.contactPhone}</dd></div>
                <div><dt className="text-xs text-muted-foreground">MRR</dt><dd className="tabular">{formatBDT(t.mrr)}</dd><dd className="text-[11.5px] text-muted-foreground">Renews {formatDate(t.renewsOn)}</dd></div>
              </dl>
              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Usage vs plan limits</h3>
                <Meter label="Campuses" used={t.campuses} limit={t.campusLimit} />
                <Meter label="Students" used={t.students} limit={t.studentLimit} />
                <p className="text-[12px] text-muted-foreground">SMS credits: <b className="text-foreground tabular">{t.smsCredits.toLocaleString('en-IN')}</b></p>
              </section>
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Feature gates</h3>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {featureFlags.map((f) => {
                  const inPlan = plan.features.includes(f.id);
                  return (
                    <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="min-w-0"><span className="block font-medium">{f.label}</span><span className="text-[11.5px] text-muted-foreground">{inPlan ? f.description : 'Add-on — not in plan'}</span></span>
                        <Switch
                        checked={!!t.features[f.id]}
                        aria-label={`${f.label} for ${t.name}`}
                        onCheckedChange={(v) => {updateTenant(t.id, { features: { ...t.features, [f.id]: v } }, `Feature ${f.id} ${v ? 'enabled' : 'disabled'}`);toast.success(`${f.label} ${v ? 'enabled' : 'disabled'}`, { description: v && !inPlan ? 'Billed as add-on from next cycle.' : 'Existing data is kept.' });}} />
                      
                      </li>);

                })}
                </ul>
              </section>
              <Notice kind="locked">Platform staff see tenant metadata only. Support access to school data requires explicit, time-boxed consent from the school admin (designed).</Notice>
            </div>
          </>
        }
      </SheetContent>
    </Sheet>);

}
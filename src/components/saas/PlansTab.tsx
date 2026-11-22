import React from 'react';
import { Check, Minus } from 'lucide-react';
import { Panel } from '../common/Panel';
import { useAdmin } from '../../contexts/AdminContext';
import { featureFlags, plans } from '../../data/saas';
import { formatBDT } from '../../utils/format';

export function PlansTab() {
  const { tenants } = useAdmin();
  return (
    <Panel title="Plans & feature gates" description="Entitlements enforced in UI and API contracts · prices in BDT (sample)" flush>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="h-9 px-4 text-left font-medium">Entitlement</th>
              {plans.map((p) => <th key={p.id} className="px-4 text-center font-medium">{p.name}<span className="block text-[11px] font-normal">{tenants.filter((t) => t.planId === p.id).length} tenants</span></th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border"><td className="px-4 py-2 font-medium">Price / month</td>{plans.map((p) => <td key={p.id} className="px-4 py-2 text-center font-semibold tabular">{formatBDT(p.priceMonthly)}</td>)}</tr>
            <tr className="border-t border-border"><td className="px-4 py-2">Campuses</td>{plans.map((p) => <td key={p.id} className="px-4 py-2 text-center tabular">{p.campusLimit}</td>)}</tr>
            <tr className="border-t border-border"><td className="px-4 py-2">Students</td>{plans.map((p) => <td key={p.id} className="px-4 py-2 text-center tabular">{p.studentLimit.toLocaleString('en-IN')}</td>)}</tr>
            <tr className="border-t border-border"><td className="px-4 py-2">SMS included / month</td>{plans.map((p) => <td key={p.id} className="px-4 py-2 text-center tabular">{p.smsIncluded.toLocaleString('en-IN')}</td>)}</tr>
            {featureFlags.map((f) =>
            <tr key={f.id} className="border-t border-border">
                <td className="px-4 py-2"><span className="font-medium">{f.label}</span><span className="block text-[11px] text-muted-foreground">{f.description}</span></td>
                {plans.map((p) => <td key={p.id} className="px-4 py-2 text-center">{p.features.includes(f.id) ? <Check className="mx-auto size-4 text-success" aria-label="Included" /> : <Minus className="mx-auto size-4 text-subtle" aria-label="Not included" />}</td>)}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Trial: 30 days on Growth. Grace: 7 days after failed renewal, then read-only. Per-tenant overrides live in Tenants › Entitlements.</p>
    </Panel>);

}
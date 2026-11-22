import React, { useState } from 'react';
import { toast } from 'sonner';
import { Panel } from '../common/Panel';
import { StatusBadge } from '../common/StatusBadge';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { useAdmin } from '../../contexts/AdminContext';
import { smsPackages, smsProviders } from '../../data/saas';
import { formatBDT } from '../../utils/format';

export function SmsTab() {
  const { tenants, updateTenant } = useAdmin();
  const [tenantId, setTenantId] = useState('TN-0005');
  const [pkgId, setPkgId] = useState('K2');
  const pkg = smsPackages.find((p) => p.id === pkgId)!;
  const tenant = tenants.find((t) => t.id === tenantId)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel title="Providers" description="Balances and 30-day usage (sample)" flush>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr><th className="h-9 px-4 text-left font-medium">Provider</th><th className="px-4 text-right font-medium">Balance</th><th className="px-4 text-right font-medium">Cost/msg</th><th className="px-4 text-right font-medium">Sent 30d</th><th className="px-4 text-right font-medium">Fail rate</th><th className="px-4 text-left font-medium">Status</th></tr>
            </thead>
            <tbody>
              {smsProviders.map((p) =>
              <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{p.name}<span className="block text-[11px] font-normal text-muted-foreground">{p.channel}</span></td>
                  <td className="px-4 py-2 text-right tabular">{formatBDT(p.balance)}</td>
                  <td className="px-4 py-2 text-right tabular">৳{p.costPerSms.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right tabular">{p.sent30d.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2 text-right tabular">{p.sent30d ? `${(p.failed30d / p.sent30d * 100).toFixed(1)}%` : '—'}</td>
                  <td className="px-4 py-2"><StatusBadge status={p.status === 'active' ? 'active' : p.status === 'pending' ? 'pending' : 'failed'} label={p.status === 'pending' ? 'Template approval pending' : undefined} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border p-3"><Notice kind="preview">Provider APIs, delivery callbacks and WhatsApp template approval require backend integration and provider agreements.</Notice></div>
      </Panel>
      <Panel title="Top up tenant credits" description="Manual allocation after payment confirmation">
        <div className="space-y-3">
          <Field label="Tenant" htmlFor="sms-t"><SelectField id="sms-t" value={tenantId} onValueChange={setTenantId} options={tenants.map((t) => ({ value: t.id, label: `${t.name} · ${t.smsCredits.toLocaleString('en-IN')} left` }))} /></Field>
          <Field label="Package" htmlFor="sms-p"><SelectField id="sms-p" value={pkgId} onValueChange={setPkgId} options={smsPackages.map((p) => ({ value: p.id, label: `${p.name} · ${formatBDT(p.price)}` }))} /></Field>
          <div className="flex justify-between rounded-lg bg-muted px-3 py-2 text-[13px]"><span className="text-muted-foreground">New balance</span><b className="tabular">{(tenant.smsCredits + pkg.credits).toLocaleString('en-IN')}</b></div>
          <Button className="w-full" disabled={tenant.status === 'suspended'} onClick={() => {updateTenant(tenant.id, { smsCredits: tenant.smsCredits + pkg.credits }, `SMS credits +${pkg.credits}`);toast.success(`${pkg.credits.toLocaleString('en-IN')} credits added`, { description: `${tenant.name} · invoice ${formatBDT(pkg.price)} (sample)` });}}>Allocate credits</Button>
          {tenant.status === 'suspended' && <p className="text-[11.5px] text-danger">Suspended tenants cannot receive credits.</p>}
        </div>
      </Panel>
    </div>);

}
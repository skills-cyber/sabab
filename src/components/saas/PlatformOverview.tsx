import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, Coins, LifeBuoy, TrendingUp, Users } from 'lucide-react';
import { KpiStrip } from '../common/KpiStrip';
import { Panel } from '../common/Panel';
import { StatusBadge } from '../common/StatusBadge';
import { useAdmin } from '../../contexts/AdminContext';
import { mrrTrend, supportTickets } from '../../data/saas';
import { formatBDT, formatDate, daysFromToday } from '../../utils/format';

export function PlatformOverview() {
  const { tenants } = useAdmin();
  const navigate = useNavigate();
  const mrr = tenants.filter((t) => t.status === 'active' || t.status === 'grace').reduce((s, t) => s + t.mrr, 0);
  const max = Math.max(...mrrTrend.map((m) => m.value));
  const alerts = tenants.filter((t) => t.status === 'grace' || t.status === 'suspended' || t.students / t.studentLimit >= 0.95 || t.smsCredits < 200 || t.status === 'trial' && daysFromToday(t.renewsOn) <= 14);

  return (
    <div className="space-y-4">
      <KpiStrip
        items={[
        { label: 'MRR', value: formatBDT(mrr), sub: 'Active + grace', icon: TrendingUp, tone: 'primary' },
        { label: 'Tenants', value: tenants.length, sub: `${tenants.filter((t) => t.status === 'active').length} active`, icon: Building2, tone: 'info', onClick: () => navigate('/platform/tenants') },
        { label: 'Trials', value: tenants.filter((t) => t.status === 'trial').length, sub: 'Convert before expiry', icon: Users, tone: 'warning' },
        { label: 'Students served', value: tenants.reduce((s, t) => s + t.students, 0).toLocaleString('en-IN'), sub: 'Across all schools', icon: Users, tone: 'success' },
        { label: 'SMS credits', value: tenants.reduce((s, t) => s + t.smsCredits, 0).toLocaleString('en-IN'), sub: 'Tenant wallets', icon: Coins, tone: 'neutral', onClick: () => navigate('/platform/sms') },
        { label: 'Open tickets', value: supportTickets.filter((t) => t.status === 'open').length, sub: 'Support queue', icon: LifeBuoy, tone: 'danger', onClick: () => navigate('/platform/audit') }]
        } />
      
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Monthly recurring revenue" description="Last 6 months · Nov dip from grace/suspended tenants">
          <div className="flex h-40 items-end gap-3" role="img" aria-label="MRR by month">
            {mrrTrend.map((m) =>
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10.5px] text-muted-foreground tabular">{Math.round(m.value / 1000)}k</span>
                <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${m.value / max * 110}px` }} />
                <span className="text-[11px] text-muted-foreground">{m.month}</span>
              </div>
            )}
          </div>
        </Panel>
        <Panel title="Needs attention" description="Billing, limits and credits" flush actions={<AlertTriangle className="size-4 text-warning" />}>
          <ul className="divide-y divide-border">
            {alerts.map((t) => {
              const reason = t.status === 'grace' ? 'Renewal failed — grace period' : t.status === 'suspended' ? 'Suspended — read-only access' : t.students / t.studentLimit >= 0.95 ? `${Math.round(t.students / t.studentLimit * 100)}% of student limit` : t.smsCredits < 200 ? `Low SMS credits (${t.smsCredits})` : `Trial ends ${formatDate(t.renewsOn, 'd MMM')}`;
              return (
                <li key={t.id}>
                  <button type="button" onClick={() => navigate(`/platform/tenants?id=${t.id}`)} className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[13px] hover:bg-muted/50">
                    <span className="min-w-0"><span className="block truncate font-medium">{t.name}</span><span className="text-[11.5px] text-muted-foreground">{reason}</span></span>
                    <StatusBadge status={t.status} />
                  </button>
                </li>);

            })}
          </ul>
        </Panel>
      </div>
    </div>);

}
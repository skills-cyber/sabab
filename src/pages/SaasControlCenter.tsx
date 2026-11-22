import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { StatusBadge } from '../components/common/StatusBadge';
import { PlatformOverview } from '../components/saas/PlatformOverview';
import { TenantsTab } from '../components/saas/TenantsTab';
import { PlansTab } from '../components/saas/PlansTab';
import { SmsTab } from '../components/saas/SmsTab';
import { AuditTab } from '../components/saas/AuditTab';
import { useAdmin } from '../contexts/AdminContext';

const TABS = ['overview', 'tenants', 'plans', 'sms', 'audit'];

export function SaasControlCenter() {
  const { tab } = useParams();
  const { tenants } = useAdmin();
  if (!TABS.includes(tab ?? '')) return <Navigate to="/platform/overview" replace />;
  const alerts = tenants.filter((t) => t.status === 'grace' || t.status === 'suspended').length;
  return (
    <div className="space-y-4">
      <PageHeader
        title="SaaS Control Center"
        bn="নিয়ন্ত্রণ কেন্দ্র"
        description="Sabab platform operations · tenants, plans, entitlements and messaging · no access to school records"
        meta={<StatusBadge status="scheduled" label="Platform scope" />} />
      
      <UnderlineTabs
        layoutId="platform-tabs"
        tabs={[
        { id: 'overview', label: 'Overview', to: '/platform/overview' },
        { id: 'tenants', label: 'Tenants & campuses', to: '/platform/tenants', count: alerts || undefined },
        { id: 'plans', label: 'Plans & features', to: '/platform/plans' },
        { id: 'sms', label: 'SMS & WhatsApp', to: '/platform/sms' },
        { id: 'audit', label: 'Audit & support', to: '/platform/audit' }]
        } />
      
      {tab === 'overview' && <PlatformOverview />}
      {tab === 'tenants' && <TenantsTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'sms' && <SmsTab />}
      {tab === 'audit' && <AuditTab />}
    </div>);

}
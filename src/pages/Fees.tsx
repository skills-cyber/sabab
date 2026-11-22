import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { StatusBadge } from '../components/common/StatusBadge';
import { CollectionTab } from '../components/fees/CollectionTab';
import { InvoicesTab } from '../components/fees/InvoicesTab';
import { StructureTab } from '../components/fees/StructureTab';
import { DailyCloseTab } from '../components/fees/DailyCloseTab';
import { ConcessionsTab } from '../components/fees/ConcessionsTab';
import { useAdmin } from '../contexts/AdminContext';
import { invoiceStatus } from '../utils/fees';

const TABS = ['collection', 'invoices', 'structure', 'concessions', 'close'];

export function Fees() {
  const { tab } = useParams();
  const { invoices, dayClose, concessions } = useAdmin();
  if (!TABS.includes(tab ?? '')) return <Navigate to="/fees/collection" replace />;
  const overdue = invoices.filter((i) => invoiceStatus(i) === 'overdue').length;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Fees & Collection"
        bn="ফি আদায়"
        description="Mirpur campus · AY 2026 · cash, bank, bKash and Nagad (gateway integration pending)"
        meta={dayClose ? <StatusBadge status="approved" label="Today closed" /> : <StatusBadge status="pending" label="Today open" />} />
      
      <UnderlineTabs
        layoutId="fee-tabs"
        tabs={[
        { id: 'collection', label: 'Collection', to: '/fees/collection' },
        { id: 'invoices', label: 'Invoices & dues', to: '/fees/invoices', count: overdue || undefined },
        { id: 'structure', label: 'Fee structure', to: '/fees/structure' },
        { id: 'concessions', label: 'Concessions', to: '/fees/concessions', count: concessions.filter((c) => c.status === 'pending').length || undefined },
        { id: 'close', label: 'Daily close', to: '/fees/close' }]
        } />
      
      {tab === 'concessions' && <ConcessionsTab />}
      {tab === 'collection' && <CollectionTab />}
      {tab === 'invoices' && <InvoicesTab />}
      {tab === 'structure' && <StructureTab />}
      {tab === 'close' && <DailyCloseTab />}
    </div>);

}
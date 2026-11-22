import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Bus, Navigation, Plus, Users, Wallet } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { KpiStrip } from '../components/common/KpiStrip';
import { Notice } from '../components/common/Notice';
import { Button } from '../components/ui/Button';
import { useTransport } from '../components/transport/useTransport';
import { TodayTab } from '../components/transport/TodayTab';
import { RoutesTab } from '../components/transport/RoutesTab';
import { RidersTab } from '../components/transport/RidersTab';
import { FleetTab } from '../components/transport/FleetTab';
import { useApp } from '../contexts/AppContext';
import { zoneFees } from '../data/transport';
import { formatBDT } from '../utils/format';

const TABS = ['today', 'routes', 'riders', 'fleet'];

/** Transport — live trips, routes & stops, rider assignment and fleet compliance. */
export function Transport() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { role, campusId } = useApp();
  const store = useTransport();
  const [routeOpen, setRouteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);

  const canEdit = role === 'owner' || role === 'principal' || role === 'office';
  if (!tab || !TABS.includes(tab)) return <Navigate to="/transport/today" replace />;

  const routes = store.routes.filter((r) => campusId === 'all' || r.campusId === campusId);
  const riders = store.riders.filter((a) => routes.some((r) => r.id === a.routeId));
  const live = store.trips.filter((t) => routes.some((r) => r.id === t.routeId) && (t.state === 'departed' || t.state === 'delayed')).length;
  const revenue = riders.reduce((s, a) => {const z = store.routes.find((r) => r.id === a.routeId)?.zone ?? 'A';return s + (a.mode === 'both' ? zoneFees[z] : Math.round(zoneFees[z] * 0.6));}, 0);
  const seats = routes.reduce((s, r) => s + (store.vehicleOf(r.id)?.capacity ?? 0), 0);
  const alerts = store.complianceAlerts.length;

  const action =
  tab === 'routes' ? <Button size="sm" disabled={!canEdit} onClick={() => setRouteOpen(true)}><Plus className="size-4" /> New route</Button> :
  tab === 'riders' ? <Button size="sm" disabled={!canEdit} onClick={() => setAssignOpen(true)}><Plus className="size-4" /> Assign rider</Button> :
  tab === 'fleet' ? <Button size="sm" disabled={!canEdit} onClick={() => setVehicleOpen(true)}><Plus className="size-4" /> Add vehicle</Button> :
  null;

  return (
    <div className="space-y-4">
      <PageHeader title="Transport" bn="পরিবহন" description="School buses · routes, riders, daily trips and fleet compliance" actions={action} />
      <UnderlineTabs
        layoutId="tr-tabs"
        tabs={[
        { id: 'today', label: 'Today', to: '/transport/today', count: live || undefined },
        { id: 'routes', label: 'Routes', to: '/transport/routes', count: routes.length },
        { id: 'riders', label: 'Riders', to: '/transport/riders', count: riders.length },
        { id: 'fleet', label: 'Fleet', to: '/transport/fleet', count: alerts || undefined }]
        } />
      
      {!canEdit && <Notice kind="locked">Read-only — transport is managed by the office, principal and owner.</Notice>}

      {tab === 'today' &&
      <KpiStrip
        items={[
        { label: 'Trips on the road', value: live, sub: 'Departed or delayed', icon: Navigation, tone: live ? 'info' : 'neutral' },
        { label: 'Riders', value: riders.length, sub: `${seats} seats across ${routes.length} routes`, icon: Users, tone: 'primary', onClick: () => navigate('/transport/riders') },
        { label: 'Transport fees / month', value: formatBDT(revenue), sub: 'Billed with monthly invoice', icon: Wallet, tone: 'success' },
        { label: 'Compliance alerts', value: alerts, sub: 'Expired or due in 30 days', icon: AlertTriangle, tone: alerts ? 'danger' : 'success', onClick: () => navigate('/transport/fleet') }]
        } />

      }

      {tab === 'today' && <TodayTab store={store} campusId={campusId} canOperate={canEdit} />}
      {tab === 'routes' && <RoutesTab store={store} campusId={campusId} canEdit={canEdit} newOpen={routeOpen} setNewOpen={setRouteOpen} />}
      {tab === 'riders' && <RidersTab store={store} campusId={campusId} canEdit={canEdit} assignOpen={assignOpen} setAssignOpen={setAssignOpen} />}
      {tab === 'fleet' && <FleetTab store={store} canEdit={canEdit} addOpen={vehicleOpen} setAddOpen={setVehicleOpen} />}
      <p className="flex items-center gap-1.5 text-[11.5px] text-subtle"><Bus className="size-3.5" /> Fictional sample fleet. Live GPS, driver app and fee auto-billing require backend integration.</p>
    </div>);

}
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BadgeCheck, CalendarClock, ClipboardList, PhoneCall, Plus, Timer } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { KpiStrip } from '../components/common/KpiStrip';
import { Notice } from '../components/common/Notice';
import { Button } from '../components/ui/Button';
import { useAdmissions } from '../components/admissions/useAdmissions';
import { ApplicationsTab } from '../components/admissions/ApplicationsTab';
import { TestsTab } from '../components/admissions/TestsTab';
import { EnquiriesTab } from '../components/admissions/EnquiriesTab';
import { SeatsTab } from '../components/admissions/SeatsTab';
import { ApplicationSheet } from '../components/admissions/ApplicationSheet';
import { NewApplicationDialog, type ApplicationPrefill } from '../components/admissions/NewApplicationDialog';
import { useApp } from '../contexts/AppContext';
import { TODAY } from '../utils/format';

const TABS = ['applications', 'tests', 'enquiries', 'seats'];

/** Admissions & CRM — enquiry → application → documents → test → merit list → offer → fee → admitted student. */
export function Admissions() {
  const { tab } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, campusId } = useApp();
  const store = useAdmissions();
  const [viewId, setViewId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [prefill, setPrefill] = useState<ApplicationPrefill | null>(null);
  const [enqOpen, setEnqOpen] = useState(false);

  const canEdit = role === 'office' || role === 'principal' || role === 'owner';
  const canDecide = role === 'principal' || role === 'owner';

  useEffect(() => {
    if (params.get('new') === '1') {
      setPrefill(null);
      setNewOpen(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  if (!tab || !TABS.includes(tab)) return <Navigate to="/admissions/applications" replace />;

  const scoped = store.apps.filter((a) => campusId === 'all' || a.campusId === campusId);
  const inProgress = scoped.filter((a) => !['admitted', 'rejected', 'withdrawn'].includes(a.stage)).length;
  const awaitingDecision = scoped.filter((a) => a.stage === 'tested').length;
  const offered = scoped.filter((a) => a.stage === 'offered').length;
  const admitted = scoped.filter((a) => a.stage === 'admitted').length;
  const followUps = store.enquiries.filter((e) => (campusId === 'all' || e.campusId === campusId) && (e.status === 'new' || e.status === 'contacted') && e.followUp <= TODAY).length;
  const viewing = store.apps.find((a) => a.id === viewId) ?? null;

  const primary =
  tab === 'enquiries' ?
  <Button size="sm" disabled={!canEdit} onClick={() => setEnqOpen(true)}><Plus className="size-4" /> Log enquiry</Button> :

  <Button size="sm" disabled={!canEdit} onClick={() => {setPrefill(null);setNewOpen(true);}}><Plus className="size-4" /> New application</Button>;


  return (
    <div className="space-y-4">
      <PageHeader title="Admissions" bn="ভর্তি" description="Session 2027 · enquiries, applications, admission tests, merit list and seat plan" actions={primary} />
      <UnderlineTabs
        layoutId="adm-tabs"
        tabs={[
        { id: 'applications', label: 'Applications', to: '/admissions/applications', count: inProgress || undefined },
        { id: 'tests', label: 'Admission tests', to: '/admissions/tests' },
        { id: 'enquiries', label: 'Enquiries', to: '/admissions/enquiries', count: followUps || undefined },
        { id: 'seats', label: 'Seat plan', to: '/admissions/seats' }]
        } />
      
      {!canEdit && <Notice kind="locked">Read-only — admissions are managed by office staff, the principal and the owner.</Notice>}

      {tab === 'applications' &&
      <>
          <KpiStrip
          items={[
          { label: 'In progress', value: inProgress, sub: 'Applied → offered', icon: ClipboardList, tone: 'primary' },
          { label: 'Awaiting decision', value: awaitingDecision, sub: 'Scored, not decided', icon: Timer, tone: awaitingDecision ? 'warning' : 'success', onClick: () => navigate('/admissions/tests') },
          { label: 'Offers pending fee', value: offered, sub: 'Valid 7 days', icon: CalendarClock, tone: 'info' },
          { label: 'Admitted', value: admitted, sub: 'Student records created', icon: BadgeCheck, tone: 'success' },
          { label: 'Follow-ups due', value: followUps, sub: 'Enquiries today or overdue', icon: PhoneCall, tone: followUps ? 'danger' : 'success', onClick: () => navigate('/admissions/enquiries') }]
          } />
        
          <ApplicationsTab store={store} campusId={campusId} canEdit={canEdit} onOpen={setViewId} onNew={() => {setPrefill(null);setNewOpen(true);}} />
        </>
      }
      {tab === 'tests' && <TestsTab store={store} campusId={campusId} canEdit={canEdit} canDecide={canDecide} onOpen={setViewId} />}
      {tab === 'enquiries' &&
      <EnquiriesTab
        store={store}
        campusId={campusId}
        canEdit={canEdit}
        newOpen={enqOpen}
        setNewOpen={setEnqOpen}
        onConvert={(p) => {setPrefill(p);setNewOpen(true);}} />

      }
      {tab === 'seats' && <SeatsTab store={store} campusId={campusId} canDecide={canDecide} />}

      <ApplicationSheet app={viewing} store={store} canEdit={canEdit} canDecide={canDecide} onOpenChange={(o) => !o && setViewId(null)} />
      <NewApplicationDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        store={store}
        prefill={prefill}
        onCreated={(id, enquiryId) => {
          if (enquiryId) store.updateEnquiry(enquiryId, { status: 'converted', note: `Applied as ${id}` });
          navigate('/admissions/applications');
          setViewId(id);
        }} />
      
    </div>);

}
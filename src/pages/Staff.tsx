import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { CalendarOff, Plus } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { Panel } from '../components/common/Panel';
import { Notice } from '../components/common/Notice';
import { Avatar } from '../components/common/PersonCell';
import { Button } from '../components/ui/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../components/ui/Sheet';
import { StaffDirectory } from '../components/staff/StaffDirectory';
import { LeaveTab } from '../components/staff/LeaveTab';
import { StaffProfile } from '../components/staff/StaffProfile';
import { StaffDialog } from '../components/staff/StaffDialog';
import { LeaveRequestDialog } from '../components/staff/LeaveRequestDialog';
import { SalaryStructureDialog } from '../components/payroll/SalaryStructureDialog';
import { AdvanceDialog } from '../components/payroll/AdvanceDialog';
import { useApp } from '../contexts/AppContext';
import { useStaff } from '../contexts/StaffContext';
import { usePayroll } from '../contexts/PayrollContext';
import type { StaffMember } from '../types/staff';
import { formatDate } from '../utils/format';

const TABS = ['directory', 'leave'];

/** Teachers & Staff — directory, profiles with salary & ledger, and leave. Teachers see “My leave & pay”. */
export function Staff() {
  const { tab } = useParams();
  const [params, setParams] = useSearchParams();
  const { role } = useApp();
  const store = useStaff();
  const payroll = usePayroll();
  const selfOnly = role === 'teacher';

  const [viewId, setViewId] = useState<string | null>(null);
  const [staffDialog, setStaffDialog] = useState<{open: boolean;editing?: StaffMember | null;}>({ open: false });
  const [leave, setLeave] = useState<{open: boolean;staffId?: string;}>({ open: false });
  const [salaryFor, setSalaryFor] = useState<StaffMember | null>(null);
  const [advance, setAdvance] = useState<{open: boolean;staffId?: string;}>({ open: false });

  useEffect(() => {
    const n = params.get('new');
    if (!n) return;
    if (tab === 'leave') setLeave({ open: true });else
    if (store.canManage) setStaffDialog({ open: true });
    params.delete('new');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (!TABS.includes(tab ?? '')) return <Navigate to="/staff/directory" replace />;

  const viewing = store.staff.find((s) => s.id === viewId) ?? null;
  const actionsFor = (p: StaffMember) => ({
    onEdit: store.canManage ? () => setStaffDialog({ open: true, editing: p }) : undefined,
    onSalary: store.canSeeSalary && p.status !== 'resigned' ? () => setSalaryFor(p) : undefined,
    onLeave: store.canManage || p.id === store.me?.id ? () => setLeave({ open: true, staffId: p.id }) : undefined,
    onAdvance: payroll.canPrepare && p.status !== 'resigned' ? () => setAdvance({ open: true, staffId: p.id }) : undefined
  });

  const dialogs =
  <>
      <StaffDialog open={staffDialog.open} editing={staffDialog.editing} onOpenChange={(o) => setStaffDialog((s) => ({ ...s, open: o }))} onCreated={(id) => setViewId(id)} />
      <LeaveRequestDialog open={leave.open} staffId={leave.staffId} onOpenChange={(o) => setLeave((s) => ({ ...s, open: o }))} />
      <SalaryStructureDialog person={salaryFor} onOpenChange={(o) => !o && setSalaryFor(null)} />
      <AdvanceDialog open={advance.open} staffId={advance.staffId} onOpenChange={(o) => setAdvance((s) => ({ ...s, open: o }))} />
    </>;


  if (selfOnly) {
    const me = store.me;
    return (
      <div className="space-y-4">
        <PageHeader title="My leave & pay" bn="আমার ছুটি ও বেতন" description="Your leave balance, requests, payslips and salary ledger" actions={me ? <Button size="sm" onClick={() => setLeave({ open: true, staffId: me.id })}><CalendarOff className="size-4" /> Request leave</Button> : undefined} />
        {me ?
        <Panel title={<span className="flex items-center gap-2"><Avatar name={me.name} />{me.name}</span>} description={`${me.id} · ${me.designation} · joined ${formatDate(me.joined, 'MMM yyyy')}`}>
            <StaffProfile person={me} selfView actions={{ onLeave: () => setLeave({ open: true, staffId: me.id }) }} />
          </Panel> :
        <Notice kind="info">Your staff record isn’t linked yet — ask the office to add you.</Notice>}
        {dialogs}
      </div>);

  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Teachers & Staff"
        bn="শিক্ষক ও কর্মী"
        description="Teaching and support staff · profiles, salary, ledger and leave"
        actions={
        <>
            <Button size="sm" variant="outline" onClick={() => setLeave({ open: true })}><CalendarOff className="size-4" /> Request leave</Button>
            {store.canManage && <Button size="sm" onClick={() => setStaffDialog({ open: true })}><Plus className="size-4" /> Add staff</Button>}
          </>
        } />
      
      <UnderlineTabs
        layoutId="staff-tabs"
        tabs={[
        { id: 'directory', label: 'Staff directory', to: '/staff/directory', count: store.staff.filter((s) => s.status !== 'resigned').length },
        { id: 'leave', label: 'Leave requests', to: '/staff/leave', count: store.leaves.filter((l) => l.status === 'pending').length || undefined }]
        } />
      
      {!store.canManage && <Notice kind="locked">View only — the office, principal or owner add and edit staff.</Notice>}

      {tab === 'directory' &&
      <StaffDirectory
        onView={setViewId}
        onAdd={() => setStaffDialog({ open: true })}
        onEdit={(s) => setStaffDialog({ open: true, editing: s })}
        onSalary={setSalaryFor}
        onLeave={(id) => setLeave({ open: true, staffId: id })}
        onAdvance={(id) => setAdvance({ open: true, staffId: id })} />

      }
      {tab === 'leave' && <LeaveTab onRequest={() => setLeave({ open: true })} />}

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewId(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          {viewing &&
          <>
              <SheetHeader className="border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar name={viewing.name} size="md" />
                  <div className="min-w-0">
                    <SheetTitle>{viewing.name} <span lang="bn" className="font-bn text-[13px] font-normal text-muted-foreground">{viewing.bn}</span></SheetTitle>
                    <SheetDescription>{viewing.id} · {viewing.designation} · joined {formatDate(viewing.joined, 'MMM yyyy')}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="p-4">
                <StaffProfile key={viewing.id} person={viewing} actions={actionsFor(viewing)} />
              </div>
            </>
          }
        </SheetContent>
      </Sheet>
      {dialogs}
    </div>);

}
import { useMemo } from 'react';
import { useAcademic } from '../contexts/AcademicContext';
import { useAdmin } from '../contexts/AdminContext';
import { useApp } from '../contexts/AppContext';
import { useAccounts } from '../contexts/AccountsContext';
import { useStaff } from '../contexts/StaffContext';
import { usePayroll } from '../contexts/PayrollContext';
import { periodSlots } from '../data/school';
import { NOW_TIME } from '../utils/format';

export function periodEnd(n: number): string {
  return periodSlots.find((p) => p.n === n)?.end ?? '23:59';
}

/** Live counts that drive sidebar badges and the principal's action queue. */
export function useNavBadges(): Record<string, number> {
  const { plans, makeups, assessments, periods, corrections } = useAcademic();
  const { tenants, concessions } = useAdmin();
  const { role } = useApp();
  const { pending, returned } = useAccounts();
  const { leaves } = useStaff();
  const { sheets } = usePayroll();
  return useMemo(() => {
    const leader = role === 'owner' || role === 'principal';
    const finance = pending.length;
    const financeApprovals = role === 'accountant' ? returned.length : leader ? finance : 0;
    const pendingLeave = leaves.filter((l) => l.status === 'pending').length;
    const submittedSheets = sheets.filter((s) => s.status === 'submitted').length;
    const returnedSheets = sheets.filter((s) => s.status === 'returned').length;
    const pendingConcessions = concessions.filter((c) => c.status === 'pending').length;
    const approvals =
    (leader ? finance + pendingLeave + submittedSheets + pendingConcessions : 0) +
    plans.filter((p) => p.status === 'submitted').length +
    makeups.filter((m) => m.status === 'proposed').length +
    assessments.filter((a) => a.stage === 'moderation' || a.stage === 'verification').length +
    corrections.filter((c) => c.status === 'pending').length;
    const makeupCount = role === 'teacher' ?
    makeups.filter((m) => m.teacherId === 'T01' && (m.status === 'gap-open' || m.status === 'approved')).length :
    makeups.filter((m) => m.status === 'proposed' || m.status === 'gap-open').length;
    const pendingLessons = periods.filter((p) => p.status === 'upcoming' && periodEnd(p.period) <= NOW_TIME).length;
    const tenantAlerts = tenants.filter((t) => t.status === 'grace' || t.health === 'critical').length;
    const leaveRequests = leader ? pendingLeave : 0;
    const payrollApprovals = leader ? submittedSheets : role === 'accountant' ? returnedSheets : 0;
    return { approvals, makeups: makeupCount, pendingLessons, tenantAlerts, financeApprovals, leaveRequests, payrollApprovals };
  }, [plans, makeups, assessments, periods, corrections, tenants, concessions, role, pending, returned, leaves, sheets]);
}
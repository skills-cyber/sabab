import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Section, Subject } from '../types/school';
import type { ClassSubject, LeaveRequest, LeaveType, SalaryStructure, StaffMember, SubjectAssignment, SubjectType } from '../types/staff';
import { sections as seedSections, subjects as seedSubjects } from '../data/school';
import { classSubjects as seedClassSubjects, leaveRequests as seedLeaves, staffMembers as seedStaff, subjectAssignments as seedAssignments, subjectTypes } from '../data/staff';
import { TODAY, nowStamp } from '../utils/format';
import { workingDaysBetween } from '../utils/payroll';
import { useAdmin } from './AdminContext';
import { useApp } from './AppContext';

export interface ManagedSubject extends Subject {
  type: SubjectType;
  archived: boolean;
}
export interface ManagedSection extends Section {
  capacity: number;
  archived: boolean;
}

/**
 * People & school structure store — frontend contract for /staff, /leave, /subjects, /sections APIs.
 * Teaching and support staff, leave requests and balances, subjects, class–subject map, teacher assignment and sections.
 */
function useStaffStore() {
  const { role, roleInfo } = useApp();
  const { addAudit } = useAdmin();
  const actor = roleInfo.user;
  const [staff, setStaff] = useState<StaffMember[]>(seedStaff);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(seedLeaves);
  const [subjects, setSubjects] = useState<ManagedSubject[]>(seedSubjects.map((s) => ({ ...s, type: subjectTypes[s.id] ?? 'Core', archived: false })));
  const [classSubjects, setClassSubjects] = useState<Record<number, ClassSubject[]>>(seedClassSubjects);
  const [assignments, setAssignments] = useState<SubjectAssignment[]>(seedAssignments);
  const [sections, setSections] = useState<ManagedSection[]>(seedSections.map((s) => ({ ...s, capacity: s.grade <= 5 ? 35 : 40, archived: false })));

  const canManage = role === 'owner' || role === 'principal' || role === 'office';
  const canSeeSalary = role === 'owner' || role === 'principal' || role === 'accountant';
  const canApproveLeave = role === 'owner' || role === 'principal';
  const canEditStructure = role === 'owner' || role === 'principal';
  const me = staff.find((s) => s.name === actor);

  // ---------- Staff ----------
  const nextStaffId = (kind: StaffMember['kind']) => {
    const prefix = kind === 'teaching' ? 'T' : 'S';
    const nums = staff.filter((s) => s.id.startsWith(prefix)).map((s) => Number(s.id.slice(1)) || 0);
    return `${prefix}${String(Math.max(0, ...nums) + 1).padStart(2, '0')}`;
  };
  const addStaff = (s: Omit<StaffMember, 'id' | 'salaryHistory'>) => {
    const id = nextStaffId(s.kind);
    setStaff((l) => [...l, { ...s, id, salaryHistory: [{ ...s.salary, changedBy: actor, at: nowStamp(), note: 'Joining salary' }] }]);
    addAudit('Staff', 'Staff added', `${id} · ${s.name} · ${s.designation}`);
    return id;
  };
  const updateStaff = (id: string, patch: Partial<StaffMember>, action = 'Staff profile updated') => {
    setStaff((l) => l.map((s) => s.id === id ? { ...s, ...patch } : s));
    addAudit('Staff', action, id);
  };
  const changeSalary = (id: string, salary: SalaryStructure, note: string) => {
    setStaff((l) => l.map((s) => s.id === id ? { ...s, salary, salaryHistory: [{ ...salary, changedBy: actor, at: nowStamp(), note }, ...s.salaryHistory] } : s));
    addAudit('Payroll', 'Salary structure changed', `${id} · from ${salary.effectiveFrom} · ${note}`, 'warning');
  };
  const resign = (id: string, lastDay: string, reason: string) => {
    setStaff((l) => l.map((s) => s.id === id ? { ...s, status: 'resigned', lastDay } : s));
    setAssignments((l) => l.filter((a) => a.teacherId !== id));
    addAudit('Staff', 'Marked resigned', `${id} · last day ${lastDay} · ${reason}`, 'warning');
  };
  const reactivate = (id: string) => {
    setStaff((l) => l.map((s) => s.id === id ? { ...s, status: 'active', lastDay: undefined } : s));
    addAudit('Staff', 'Reactivated', id);
  };

  // ---------- Leave ----------
  const leaveUsed = useCallback((staffId: string, type: LeaveType) => leaves.filter((l) => l.staffId === staffId && l.type === type && l.status === 'approved' && l.from.startsWith(TODAY.slice(0, 4))).reduce((s, l) => s + l.days, 0), [leaves]);
  const unpaidDaysIn = useCallback((staffId: string, month: string) => leaves.filter((l) => l.staffId === staffId && l.type === 'unpaid' && l.status === 'approved').reduce((s, l) => s + workingDaysBetween(l.from, l.to, month), 0), [leaves]);

  const requestLeave = (r: Pick<LeaveRequest, 'staffId' | 'type' | 'from' | 'to' | 'reason' | 'substituteId'>) => {
    const id = `LV-${33 + leaves.length}`;
    const days = workingDaysBetween(r.from, r.to);
    setLeaves((l) => [{ ...r, id, days, status: 'pending', requestedBy: actor, history: [{ at: nowStamp(), actor, action: 'Requested', tone: 'info' }] }, ...l]);
    addAudit('Staff', 'Leave requested', `${id} · ${r.staffId} · ${days} day(s)`);
    return id;
  };
  const decideLeave = (id: string, approve: boolean, note = '') => {
    const req = leaves.find((l) => l.id === id);
    setLeaves((l) => l.map((x) => x.id === id ? { ...x, status: approve ? 'approved' : 'rejected', history: [...x.history, { at: nowStamp(), actor, action: approve ? 'Approved' : 'Rejected', tone: approve ? 'success' : 'danger', note: note || undefined }] } : x));
    if (approve && req && req.from <= TODAY && req.to >= TODAY) setStaff((l) => l.map((s) => s.id === req.staffId ? { ...s, status: 'on-leave' } : s));
    addAudit('Staff', approve ? 'Leave approved' : 'Leave rejected', `${id}${note ? ` · ${note}` : ''}`);
  };
  const cancelLeave = (id: string) => {
    setLeaves((l) => l.map((x) => x.id === id ? { ...x, status: 'cancelled', history: [...x.history, { at: nowStamp(), actor, action: 'Cancelled', tone: 'warning' }] } : x));
    addAudit('Staff', 'Leave cancelled', id);
  };

  // ---------- Subjects & structure ----------
  const addSubject = (s: Omit<ManagedSubject, 'archived'>) => {
    setSubjects((l) => [...l, { ...s, archived: false }]);
    addAudit('Settings', 'Subject added', `${s.id} · ${s.name}`);
  };
  const updateSubject = (id: string, patch: Partial<ManagedSubject>, action = 'Subject updated') => {
    setSubjects((l) => l.map((s) => s.id === id ? { ...s, ...patch } : s));
    addAudit('Settings', action, id);
  };
  const setClassSubject = (grade: number, subjectId: string, periods: number | null) => {
    setClassSubjects((m) => {
      const list = m[grade] ?? [];
      const next = periods === null ? list.filter((c) => c.subjectId !== subjectId) : list.some((c) => c.subjectId === subjectId) ? list.map((c) => c.subjectId === subjectId ? { ...c, periods } : c) : [...list, { subjectId, periods }];
      return { ...m, [grade]: next };
    });
    addAudit('Settings', periods === null ? 'Subject removed from class' : 'Class subject updated', `Class ${grade} · ${subjectId}${periods !== null ? ` · ${periods}/wk` : ''}`);
  };
  const assign = (sectionId: string, subjectId: string, teacherId: string) => {
    setAssignments((l) => [...l.filter((a) => !(a.sectionId === sectionId && a.subjectId === subjectId)), ...(teacherId ? [{ sectionId, subjectId, teacherId }] : [])]);
    addAudit('Settings', 'Teacher assigned', `${sectionId} · ${subjectId} → ${teacherId || 'unassigned'}`);
  };
  /** Weekly periods a teacher is assigned across all sections (from the class–subject map). */
  const assignedLoad = useCallback((teacherId: string) => assignments.filter((a) => a.teacherId === teacherId).reduce((s, a) => {
    const grade = sections.find((x) => x.id === a.sectionId)?.grade ?? 0;
    return s + (classSubjects[grade]?.find((c) => c.subjectId === a.subjectId)?.periods ?? 0);
  }, 0), [assignments, sections, classSubjects]);

  const addSection = (s: Omit<ManagedSection, 'archived'>) => {
    setSections((l) => [...l, { ...s, archived: false }]);
    addAudit('Settings', 'Section added', `${s.label} · ${s.campusId}`);
  };
  const updateSection = (id: string, patch: Partial<ManagedSection>, action = 'Section updated') => {
    setSections((l) => l.map((s) => s.id === id ? { ...s, ...patch } : s));
    addAudit('Settings', action, id);
  };

  const teachers = staff.filter((s) => s.kind === 'teaching');

  return {
    actor, me, canManage, canSeeSalary, canApproveLeave, canEditStructure,
    staff, teachers, addStaff, updateStaff, changeSalary, resign, reactivate,
    leaves, leaveUsed, unpaidDaysIn, requestLeave, decideLeave, cancelLeave,
    subjects, addSubject, updateSubject, classSubjects, setClassSubject, assignments, assign, assignedLoad,
    sections, addSection, updateSection
  };
}

export type StaffStore = ReturnType<typeof useStaffStore>;
const StaffContext = createContext<StaffStore | null>(null);

export function StaffProvider({ children }: {children: React.ReactNode;}) {
  const store = useStaffStore();
  return <StaffContext.Provider value={store}>{children}</StaffContext.Provider>;
}

export function useStaff(): StaffStore {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error('useStaff must be used inside StaffProvider');
  return ctx;
}

/** Safe outside the provider (falls back to seed data) — used by tiny shared chips. */
export function useSubjectList(): Subject[] {
  const ctx = useContext(StaffContext);
  return useMemo(() => ctx?.subjects ?? seedSubjects, [ctx?.subjects]);
}
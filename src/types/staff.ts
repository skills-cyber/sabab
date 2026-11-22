import type { TimelineEntry } from './academic';
import type { Teacher } from './school';

export type StaffKind = 'teaching' | 'support';
export type StaffStatus = 'active' | 'on-leave' | 'resigned';
export type EmploymentType = 'permanent' | 'contract' | 'part-time';
export type PayMethod = 'Cash' | 'Bank transfer' | 'bKash' | 'Nagad';

export interface PayLine {
  id: string;
  label: string;
  amount: number;
}

/** Salary structure. A change takes effect from `effectiveFrom` (YYYY-MM) and never alters approved sheets. */
export interface SalaryStructure {
  basic: number;
  allowances: PayLine[];
  deductions: PayLine[];
  effectiveFrom: string;
}

export interface SalaryRevision extends SalaryStructure {
  changedBy: string;
  at: string;
  note?: string;
}

/** Teaching and support staff share one record. Support staff have no subjects and 0 max periods. */
export interface StaffMember extends Omit<Teacher, 'status'> {
  kind: StaffKind;
  status: StaffStatus;
  employment: EmploymentType;
  nid: string;
  address: string;
  emergencyContact: string;
  payMethod: PayMethod;
  /** Bank account or wallet number (masked in the UI). */
  payAccount?: string;
  salary: SalaryStructure;
  salaryHistory: SalaryRevision[];
  lastDay?: string;
  /** Linked Accounts party (created on first payment). */
  partyId?: string;
}

export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  staffId: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  substituteId?: string;
  status: LeaveStatus;
  requestedBy: string;
  history: TimelineEntry[];
}

export const LEAVE_QUOTA: Record<LeaveType, number> = { casual: 10, sick: 14, earned: 20, unpaid: 0 };
export const LEAVE_LABEL: Record<LeaveType, string> = { casual: 'Casual', sick: 'Sick', earned: 'Earned', unpaid: 'Unpaid' };

export type SubjectType = 'Core' | 'Elective' | 'Practical';
export interface ClassSubject {
  subjectId: string;
  periods: number;
}
export interface SubjectAssignment {
  sectionId: string;
  subjectId: string;
  teacherId: string;
}
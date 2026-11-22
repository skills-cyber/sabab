import type { SubjectTone } from '../utils/tones';
import type { YearRecord } from './promotion';

export type RoleId = 'platform' | 'owner' | 'principal' | 'coordinator' | 'teacher' | 'accountant' | 'office' | 'parent';

export interface Role {
  id: RoleId;
  label: string;
  bn: string;
  user: string;
  title: string;
  home: string;
  scope: string;
}

export interface Campus {
  id: string;
  name: string;
  bn: string;
  short: string;
  students: number;
}

export interface Teacher {
  id: string;
  name: string;
  bn: string;
  designation: string;
  subjects: string[];
  campusId: string;
  phone: string;
  email: string;
  maxPeriods: number;
  status: 'active' | 'on-leave';
  joined: string;
  qualification: string;
}

export interface Section {
  id: string;
  label: string;
  grade: number;
  campusId: string;
  classTeacherId: string;
  room: string;
  stream?: string;
}

export interface Subject {
  id: string;
  name: string;
  bn: string;
  short: string;
  tone: SubjectTone;
}

export interface Room {
  id: string;
  label: string;
  capacity: number;
  type: 'Classroom' | 'Lab' | 'Field' | 'Hall';
}

export type StudentStatus = 'active' | 'admission-pending' | 'transferred' | 'withdrawn' | 'graduated';

export interface Student {
  id: string;
  studentNo: string;
  name: string;
  nameBn: string;
  roll: number;
  sectionId: string;
  campusId: string;
  gender: 'M' | 'F';
  dob: string;
  guardianName: string;
  guardianRelation: 'Father' | 'Mother' | 'Guardian';
  guardianPhone: string;
  guardianVerified: boolean;
  smsOptIn: boolean;
  attendancePct: number;
  status: StudentStatus;
  siblingIds: string[];
  remarks: string;
  admittedOn: string;
  transport: boolean;
  /** Monthly transport fee from the student's route zone (set by Transport). */
  transportFee?: number;
  /** Invoice line label, e.g. “Transport · Mirpur–Pallabi (Zone B, both ways)”. */
  transportLabel?: string;
  /** Household record (Students › Families). Guardian fields above mirror the family’s primary guardian. */
  familyId?: string;
  /** Archived academic years (class, roll, result, outcome). */
  yearHistory?: YearRecord[];
}
import type { ClassSubject, LeaveRequest, PayLine, SalaryStructure, StaffMember, SubjectAssignment, SubjectType } from '../types/staff';
import { teachers } from './school';
import { teacherAllocation, weeklyRequirement } from './timetable';

/** FICTIONAL SAMPLE DATA — salaries are illustrative only. */

const structure = (basic: number, opts: {pf?: boolean;transport?: number;} = {}): SalaryStructure => {
  const allowances: PayLine[] = [
  { id: 'house', label: 'House rent', amount: Math.round(basic * 0.4) },
  { id: 'medical', label: 'Medical', amount: 1500 }];

  if (opts.transport) allowances.push({ id: 'transport', label: 'Transport', amount: opts.transport });
  const deductions: PayLine[] = opts.pf ? [{ id: 'pf', label: 'Provident fund (5%)', amount: Math.round(basic * 0.05) }] : [];
  return { basic, allowances, deductions, effectiveFrom: '2026-01' };
};

const BASIC: Record<string, number> = { 'Senior Teacher': 30000, 'Assistant Teacher': 22000, 'ICT Instructor': 21000, 'Physical Instructor': 18000 };

const teaching: StaffMember[] = teachers.map((t, i) => {
  const salary = structure(BASIC[t.designation] ?? 22000, { pf: i % 4 !== 3, transport: 1000 });
  return {
    ...t,
    kind: 'teaching',
    status: t.status,
    employment: i === 11 ? 'contract' : 'permanent',
    nid: `19${80 + i}26${(1000000 + i * 7919).toString().slice(0, 7)}`,
    address: ['Mirpur 10, Dhaka', 'Pallabi, Dhaka', 'Kazipara, Dhaka', 'Shewrapara, Dhaka'][i % 4],
    emergencyContact: `01819-${String(400100 + i).slice(-6)}`,
    payMethod: i % 3 === 2 ? 'bKash' : 'Bank transfer',
    payAccount: i % 3 === 2 ? t.phone : `10711000${String(52000 + i * 37)}`,
    salary,
    salaryHistory: [{ ...salary, changedBy: 'Alhaj Rezaul Karim', at: '01 Jan 2026', note: 'Annual revision 2026' }]
  };
});

const support = (s: Omit<StaffMember, 'kind' | 'subjects' | 'maxPeriods' | 'salaryHistory' | 'email' | 'qualification'> & {email?: string;qualification?: string;}): StaffMember => ({
  ...s,
  kind: 'support',
  subjects: [],
  maxPeriods: 0,
  email: s.email ?? '',
  qualification: s.qualification ?? '',
  salaryHistory: [{ ...s.salary, changedBy: 'Alhaj Rezaul Karim', at: '01 Jan 2026', note: 'Annual revision 2026' }]
});

const supportStaff: StaffMember[] = [
support({ id: 'S01', name: 'Mizanur Rahman', bn: 'মিজানুর রহমান', designation: 'Accountant & Cashier', campusId: 'mirpur', phone: '01711-000201', email: 'mizan@shapla.sample', status: 'active', joined: '2016-05-01', qualification: 'M.Com. Accounting', employment: 'permanent', nid: '1985261234567', address: 'Mirpur 2, Dhaka', emergencyContact: '01819-500201', payMethod: 'Bank transfer', payAccount: '1071100055120', salary: structure(26000, { pf: true, transport: 1000 }) }),
support({ id: 'S02', name: 'Shirin Sultana', bn: 'শিরিন সুলতানা', designation: 'Admission Officer', campusId: 'mirpur', phone: '01711-000202', email: 'shirin@shapla.sample', status: 'active', joined: '2019-02-10', qualification: 'B.A.', employment: 'permanent', nid: '1990261234568', address: 'Pallabi, Dhaka', emergencyContact: '01819-500202', payMethod: 'Bank transfer', payAccount: '1071100055121', salary: structure(18000, { pf: true, transport: 1000 }) }),
support({ id: 'S03', name: 'Abdul Halim', bn: 'আব্দুল হালিম', designation: 'Driver', campusId: 'mirpur', phone: '01729-880011', status: 'active', joined: '2018-09-01', employment: 'permanent', nid: '1982261234569', address: 'Rupnagar, Dhaka', emergencyContact: '01729-880099', payMethod: 'Cash', salary: structure(12000), partyId: 'P12' }),
support({ id: 'S04', name: 'Md. Jalal Uddin', bn: 'মো. জালাল উদ্দিন', designation: 'Security Guard', campusId: 'mirpur', phone: '01733-220014', status: 'active', joined: '2020-03-01', employment: 'contract', nid: '1979261234570', address: 'Mirpur 11, Dhaka', emergencyContact: '01733-220099', payMethod: 'Cash', salary: structure(10000) }),
support({ id: 'S05', name: 'Kamal Mia', bn: 'কামাল মিয়া', designation: 'Security Guard (night)', campusId: 'mirpur', phone: '01733-220015', status: 'active', joined: '2021-06-15', employment: 'contract', nid: '1987261234571', address: 'Mirpur 12, Dhaka', emergencyContact: '01733-220098', payMethod: 'bKash', payAccount: '01733-220015', salary: structure(10000) }),
support({ id: 'S06', name: 'Rahima Khatun', bn: 'রহিমা খাতুন', designation: 'Office Assistant', campusId: 'mirpur', phone: '01741-118822', status: 'active', joined: '2017-11-01', employment: 'permanent', nid: '1984261234572', address: 'Kafrul, Dhaka', emergencyContact: '01741-118899', payMethod: 'bKash', payAccount: '01741-118822', salary: structure(13000, { pf: true }) }),
support({ id: 'S07', name: 'Sufia Begum', bn: 'সুফিয়া বেগম', designation: 'Cleaner', campusId: 'mirpur', phone: '01752-334400', status: 'active', joined: '2022-01-10', employment: 'part-time', nid: '1981261234573', address: 'Bhashantek, Dhaka', emergencyContact: '01752-334499', payMethod: 'Cash', salary: { basic: 7000, allowances: [{ id: 'medical', label: 'Medical', amount: 500 }], deductions: [], effectiveFrom: '2026-01' } }),
support({ id: 'S08', name: 'Nurul Amin', bn: 'নুরুল আমিন', designation: 'Caretaker', campusId: 'uttara', phone: '01768-901122', status: 'active', joined: '2023-04-01', employment: 'contract', nid: '1983261234574', address: 'Uttara Sector 10, Dhaka', emergencyContact: '01768-901199', payMethod: 'Cash', salary: structure(11000) })];


export const staffMembers: StaffMember[] = [...teaching, ...supportStaff];

export const SUPPORT_DESIGNATIONS = ['Accountant & Cashier', 'Admission Officer', 'Office Assistant', 'Librarian', 'Lab Assistant', 'Driver', 'Security Guard', 'Cleaner', 'Caretaker', 'Peon'];
export const TEACHING_DESIGNATIONS = ['Head Teacher', 'Assistant Head Teacher', 'Senior Teacher', 'Assistant Teacher', 'ICT Instructor', 'Physical Instructor', 'Part-time Teacher'];

const h = (at: string, actor: string, action: string, tone?: 'success' | 'warning' | 'danger' | 'info', note?: string) => ({ at, actor, action, tone, note });

export const leaveRequests: LeaveRequest[] = [
{ id: 'LV-31', staffId: 'T12', type: 'sick', from: '2026-11-03', to: '2026-11-12', days: 8, reason: 'Medical leave extension after surgery', substituteId: 'T04', status: 'pending', requestedBy: 'Imran Hossain', history: [h('01 Nov 2026 · 18:20', 'Imran Hossain', 'Requested', 'info')] },
{ id: 'LV-32', staffId: 'T11', type: 'casual', from: '2026-11-05', to: '2026-11-05', days: 1, reason: 'Family event', status: 'pending', requestedBy: 'Rumana Afroz', history: [h('02 Nov 2026 · 08:05', 'Rumana Afroz', 'Requested', 'info')] },
{ id: 'LV-28', staffId: 'T12', type: 'sick', from: '2026-10-25', to: '2026-11-02', days: 7, reason: 'Surgery and recovery', substituteId: 'T04', status: 'approved', requestedBy: 'Imran Hossain', history: [h('24 Oct 2026 · 10:00', 'Imran Hossain', 'Requested'), h('24 Oct 2026 · 12:10', 'Dr. Nasrin Akter', 'Approved', 'success')] },
{ id: 'LV-29', staffId: 'T09', type: 'casual', from: '2026-10-12', to: '2026-10-13', days: 2, reason: 'Personal', status: 'approved', requestedBy: 'Tahmina Begum', history: [h('08 Oct 2026 · 09:00', 'Tahmina Begum', 'Requested'), h('08 Oct 2026 · 11:30', 'Dr. Nasrin Akter', 'Approved', 'success')] },
{ id: 'LV-30', staffId: 'S03', type: 'unpaid', from: '2026-10-20', to: '2026-10-21', days: 2, reason: 'Village visit', status: 'approved', requestedBy: 'Abdul Halim', history: [h('15 Oct 2026 · 13:00', 'Abdul Halim', 'Requested'), h('15 Oct 2026 · 15:40', 'Dr. Nasrin Akter', 'Approved', 'success', 'Unpaid — deducted from October salary')] },
{ id: 'LV-27', staffId: 'S06', type: 'sick', from: '2026-09-14', to: '2026-09-16', days: 3, reason: 'Fever', status: 'approved', requestedBy: 'Rahima Khatun', history: [h('14 Sep 2026 · 07:40', 'Rahima Khatun', 'Requested'), h('14 Sep 2026 · 09:00', 'Dr. Nasrin Akter', 'Approved', 'success')] }];


/** Subject metadata not present on the base Subject type. */
export const subjectTypes: Record<string, SubjectType> = { ICT: 'Practical', PHY: 'Elective', CHEM: 'Elective', BIO: 'Elective', HMATH: 'Elective', PE: 'Practical', ART: 'Practical' };

/** Class → subject map with weekly periods (seeded from the curriculum rules). */
export const classSubjects: Record<number, ClassSubject[]> = {
  4: [{ subjectId: 'BAN', periods: 6 }, { subjectId: 'ENG', periods: 6 }, { subjectId: 'MATH', periods: 6 }, { subjectId: 'SCI', periods: 4 }, { subjectId: 'BGS', periods: 3 }, { subjectId: 'REL', periods: 3 }, { subjectId: 'ART', periods: 2 }, { subjectId: 'PE', periods: 2 }],
  6: Object.entries(weeklyRequirement['7A']).map(([subjectId, periods]) => ({ subjectId, periods })),
  7: Object.entries(weeklyRequirement['7A']).map(([subjectId, periods]) => ({ subjectId, periods })),
  8: Object.entries(weeklyRequirement['8A']).map(([subjectId, periods]) => ({ subjectId, periods })),
  9: Object.entries(weeklyRequirement['9A']).map(([subjectId, periods]) => ({ subjectId, periods }))
};

export const subjectAssignments: SubjectAssignment[] = Object.entries(teacherAllocation).flatMap(([sectionId, m]) => Object.entries(m).map(([subjectId, teacherId]) => ({ sectionId, subjectId, teacherId })));
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, CalendarRange, Clock3, BookOpenCheck, CalendarClock, RefreshCcw, ClipboardCheck, BookOpen, Users, UserCheck,
  GraduationCap, MessagesSquare, Wallet, Landmark, BarChart3, Settings, Library, Bus, BedDouble, HandCoins, Boxes, UserPlus,
  Baby, Building2, Map, Rocket } from
'lucide-react';
import type { RoleId } from '../types/school';

export interface NavChild {
  label: string;
  path: string;
  /** Limit a tab to some roles (defaults to the parent item's roles). */
  roles?: RoleId[];
}

export interface NavItem {
  id: string;
  label: string;
  bn: string;
  icon: LucideIcon;
  path: string;
  roles: RoleId[];
  children?: NavChild[];
  badgeKey?: 'approvals' | 'pendingLessons' | 'makeups' | 'tenantAlerts' | 'financeApprovals' | 'leaveRequests' | 'payrollApprovals';
  phase?: 'designed' | 'planned';
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const LEADERS: RoleId[] = ['owner', 'principal', 'coordinator'];

export const navGroups: NavGroup[] = [
{
  id: 'workspace',
  label: 'Workspace',
  items: [
  { id: 'overview', label: 'Overview', bn: 'সারসংক্ষেপ', icon: LayoutDashboard, path: '/overview', roles: LEADERS, badgeKey: 'approvals' },
  { id: 'teaching', label: 'My Teaching Day', bn: 'আজকের ক্লাস', icon: BookOpenCheck, path: '/teaching', roles: ['teacher'], badgeKey: 'pendingLessons' }]

},
{
  id: 'academics',
  label: 'Academics',
  items: [
  {
    id: 'planner', label: 'Academic Planner', bn: 'একাডেমিক পরিকল্পনা', icon: CalendarRange, path: '/planner', roles: [...LEADERS, 'teacher'],
    children: [
    { label: 'Year calendar', path: '/planner/calendar' },
    { label: 'Syllabus coverage', path: '/planner/syllabus' },
    { label: 'Weekly plan', path: '/planner/weekly' },
    { label: 'Versions & approval', path: '/planner/versions' }]

  },
  { id: 'timetable', label: 'Routine & Timetable', bn: 'রুটিন', icon: Clock3, path: '/timetable', roles: [...LEADERS, 'teacher'] },
  { id: 'makeup', label: 'Cancelled & Makeup', bn: 'বাতিল ও মেকআপ ক্লাস', icon: RefreshCcw, path: '/makeup', roles: [...LEADERS, 'teacher'], badgeKey: 'makeups' },
  {
    id: 'exams', label: 'Exams & Class Tests', bn: 'পরীক্ষা ও শ্রেণি পরীক্ষা', icon: ClipboardCheck, path: '/exams', roles: [...LEADERS, 'teacher'],
    children: [
    { label: 'Assessments', path: '/exams/assessments' },
    { label: 'Question bank', path: '/exams/questions' },
    { label: 'Results', path: '/exams/results' }]

  },
  {
    id: 'lms', label: 'Homework & LMS', bn: 'বাড়ির কাজ', icon: BookOpen, path: '/lms', roles: [...LEADERS, 'teacher'],
    children: [
    { label: 'Assignments', path: '/lms/assignments' },
    { label: 'Learning materials', path: '/lms/materials' }]

  }]

},
{
  id: 'administration',
  label: 'Administration',
  items: [
  {
    id: 'students', label: 'Students', bn: 'শিক্ষার্থী', icon: GraduationCap, path: '/students', roles: [...LEADERS, 'teacher', 'accountant', 'office'],
    children: [
    { label: 'All students', path: '/students' },
    { label: 'Families', path: '/students/families' },
    { label: 'Promotion', path: '/students/promotion' }]

  },
  {
    id: 'admissions', label: 'Admissions', bn: 'ভর্তি', icon: UserPlus, path: '/admissions', roles: ['owner', 'principal', 'office'],
    children: [
    { label: 'Applications', path: '/admissions/applications' },
    { label: 'Admission tests', path: '/admissions/tests' },
    { label: 'Enquiries', path: '/admissions/enquiries' },
    { label: 'Seat plan', path: '/admissions/seats' }]

  },
  {
    id: 'transport', label: 'Transport', bn: 'পরিবহন', icon: Bus, path: '/transport', roles: ['owner', 'principal', 'office'],
    children: [
    { label: 'Today', path: '/transport/today' },
    { label: 'Routes', path: '/transport/routes' },
    { label: 'Riders', path: '/transport/riders' },
    { label: 'Fleet', path: '/transport/fleet' }]

  },
  { id: 'attendance', label: 'Attendance', bn: 'উপস্থিতি', icon: UserCheck, path: '/attendance', roles: [...LEADERS, 'teacher', 'office'] },
  {
    id: 'staff', label: 'Teachers & Staff', bn: 'শিক্ষক ও কর্মী', icon: Users, path: '/staff', roles: [...LEADERS, 'office', 'accountant', 'teacher'], badgeKey: 'leaveRequests',
    children: [
    { label: 'Staff directory', path: '/staff/directory' },
    { label: 'Leave requests', path: '/staff/leave' }]

  },
  {
    id: 'payroll', label: 'Payroll', bn: 'বেতন', icon: HandCoins, path: '/payroll', roles: ['owner', 'principal', 'accountant'], badgeKey: 'payrollApprovals',
    children: [
    { label: 'Salary sheets', path: '/payroll/sheets' },
    { label: 'Advances', path: '/payroll/advances' },
    { label: 'Payments', path: '/payroll/payments' }]

  },
  { id: 'communication', label: 'Communication', bn: 'যোগাযোগ', icon: MessagesSquare, path: '/communication', roles: [...LEADERS, 'teacher', 'office', 'accountant'] },
  {
    id: 'fees', label: 'Fees & Collection', bn: 'ফি আদায়', icon: Wallet, path: '/fees', roles: ['owner', 'principal', 'accountant'],
    children: [
    { label: 'Collection', path: '/fees/collection' },
    { label: 'Invoices & dues', path: '/fees/invoices' },
    { label: 'Fee structure', path: '/fees/structure' },
    { label: 'Concessions', path: '/fees/concessions' },
    { label: 'Daily close', path: '/fees/close' }]

  },
  {
    id: 'accounts', label: 'Accounts & Finance', bn: 'হিসাব', icon: Landmark, path: '/accounts', roles: ['owner', 'accountant', 'principal'], badgeKey: 'financeApprovals',
    children: [
    { label: 'Overview', path: '/accounts/overview' },
    { label: 'Transactions', path: '/accounts/transactions' },
    { label: 'Accounts', path: '/accounts/accounts' },
    { label: 'Parties', path: '/accounts/parties' },
    { label: 'Categories', path: '/accounts/categories' }]

  },
  {
    id: 'reports', label: 'Reports', bn: 'রিপোর্ট', icon: BarChart3, path: '/reports', roles: [...LEADERS, 'accountant'],
    children: [
    { label: 'Teaching coverage', path: '/reports/academic' },
    { label: 'Attendance', path: '/reports/attendance' },
    { label: 'Fees & dues', path: '/reports/fees' },
    { label: 'Assessment', path: '/reports/assessment' },
    { label: 'Income & expenditure', path: '/reports/income', roles: ['owner', 'principal', 'accountant'] },
    { label: 'Balance sheet', path: '/reports/balance', roles: ['owner', 'principal', 'accountant'] }]

  },
  { id: 'onboarding', label: 'School Setup', bn: 'সেটআপ', icon: Rocket, path: '/setup', roles: ['owner', 'principal'] },
  {
    id: 'settings', label: 'Settings', bn: 'সেটিংস', icon: Settings, path: '/settings', roles: ['owner', 'principal', 'coordinator'],
    children: [
    { label: 'School profile', path: '/settings/school' },
    { label: 'Classes & sections', path: '/settings/classes' },
    { label: 'Subjects', path: '/settings/subjects' },
    { label: 'Grading rules', path: '/settings/grading' },
    { label: 'Approval workflows', path: '/settings/workflows' },
    { label: 'Roles & permissions', path: '/settings/roles' }]

  }]

},
{
  id: 'phase2',
  label: 'Phase 2 · Planned',
  items: [
  { id: 'library', label: 'Library', bn: 'গ্রন্থাগার', icon: Library, path: '/m/library', roles: ['owner', 'principal', 'office'], phase: 'planned' },
  { id: 'hostel', label: 'Hostel', bn: 'হোস্টেল', icon: BedDouble, path: '/m/hostel', roles: ['owner', 'principal'], phase: 'planned' },
  { id: 'inventory', label: 'Inventory', bn: 'মালামাল', icon: Boxes, path: '/m/inventory', roles: ['owner', 'accountant'], phase: 'planned' }]

},
{
  id: 'guardian',
  label: 'My Children',
  items: [
  {
    id: 'parent', label: 'Children overview', bn: 'আমার সন্তান', icon: Baby, path: '/parent', roles: ['parent'],
    children: [
    { label: 'Overview', path: '/parent/overview' },
    { label: 'Homework', path: '/parent/homework' },
    { label: 'Results', path: '/parent/results' },
    { label: 'Attendance', path: '/parent/attendance' },
    { label: 'Fees', path: '/parent/fees' }]

  }]

},
{
  id: 'platform',
  label: 'SaaS Platform',
  items: [
  {
    id: 'platform', label: 'Control Center', bn: 'নিয়ন্ত্রণ কেন্দ্র', icon: Building2, path: '/platform', roles: ['platform'], badgeKey: 'tenantAlerts',
    children: [
    { label: 'Overview', path: '/platform/overview' },
    { label: 'Tenants & campuses', path: '/platform/tenants' },
    { label: 'Plans & features', path: '/platform/plans' },
    { label: 'SMS & WhatsApp', path: '/platform/sms' },
    { label: 'Audit & support', path: '/platform/audit' }]

  }]

},
{
  id: 'help',
  label: 'Foundation',
  items: [{ id: 'guide', label: 'Prototype guide', bn: 'নির্দেশিকা', icon: Map, path: '/guide', roles: ['platform', 'owner', 'principal', 'coordinator', 'teacher', 'accountant', 'office', 'parent'] }]
}];


export function navForRole(role: RoleId): NavGroup[] {
  return navGroups.
  map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)).map((i) => i.children ? { ...i, children: i.children.filter((c) => !c.roles || c.roles.includes(role)) } : i) })).
  filter((g) => g.items.length > 0);
}

export function canAccess(role: RoleId, pathname: string): boolean {
  if (pathname === '/' || pathname.startsWith('/guide')) return true;
  const all = navGroups.flatMap((g) => g.items);
  const match = all.filter((i) => pathname === i.path || pathname.startsWith(i.path + '/')).sort((a, b) => b.path.length - a.path.length)[0];
  return match ? match.roles.includes(role) : true;
}
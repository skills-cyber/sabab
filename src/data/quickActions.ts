import type { LucideIcon } from 'lucide-react';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, BookOpenCheck, CalendarPlus, ClipboardPlus, CreditCard, FilePlus2, Megaphone, MessageSquarePlus, ReceiptText, RefreshCcw, ShieldCheck, UserPlus, Building2, HandCoins, CalendarOff, UserRoundPlus } from 'lucide-react';
import type { RoleId } from '../types/school';

export const quickActions: Partial<Record<RoleId, Array<{label: string;icon: LucideIcon;href: string;}>>> = {
  principal: [
  { label: 'Review approvals', icon: ShieldCheck, href: '/overview' },
  { label: 'Add calendar event', icon: CalendarPlus, href: '/planner/calendar?new=1' },
  { label: 'New assessment', icon: ClipboardPlus, href: '/exams/assessments?new=1' },
  { label: 'Send announcement', icon: Megaphone, href: '/communication?compose=1' },
  { label: 'Add staff member', icon: UserRoundPlus, href: '/staff/directory?new=1' }],

  owner: [
  { label: 'Review approvals', icon: ShieldCheck, href: '/overview' },
  { label: 'Fee collection', icon: ReceiptText, href: '/fees/collection' },
  { label: 'Transfer money', icon: ArrowRightLeft, href: '/accounts/transactions?new=transfer' },
  { label: 'Record income', icon: ArrowDownLeft, href: '/accounts/transactions?new=income' },
  { label: 'Record expense', icon: ArrowUpRight, href: '/accounts/transactions?new=expense' },
  { label: 'Salary sheet', icon: HandCoins, href: '/payroll/sheets?new=1' }],

  coordinator: [
  { label: 'Add calendar event', icon: CalendarPlus, href: '/planner/calendar?new=1' },
  { label: 'New plan revision', icon: FilePlus2, href: '/planner/versions?new=1' },
  { label: 'New assessment', icon: ClipboardPlus, href: '/exams/assessments?new=1' }],

  teacher: [
  { label: 'Log my next lesson', icon: BookOpenCheck, href: '/teaching' },
  { label: 'New class test', icon: ClipboardPlus, href: '/exams/assessments?new=1' },
  { label: 'Report cancelled class', icon: RefreshCcw, href: '/makeup?new=1' },
  { label: 'Message guardians', icon: MessageSquarePlus, href: '/communication?compose=1' },
  { label: 'Request leave', icon: CalendarOff, href: '/staff/leave?new=1' }],

  accountant: [
  { label: 'Collect payment', icon: CreditCard, href: '/fees/collection?collect=1' },
  { label: 'Generate monthly dues', icon: ReceiptText, href: '/fees/invoices?generate=1' },
  { label: 'Transfer money', icon: ArrowRightLeft, href: '/accounts/transactions?new=transfer' },
  { label: 'Record income', icon: ArrowDownLeft, href: '/accounts/transactions?new=income' },
  { label: 'Record expense', icon: ArrowUpRight, href: '/accounts/transactions?new=expense' },
  { label: 'Generate salary sheet', icon: HandCoins, href: '/payroll/sheets?new=1' },
  { label: 'Give salary advance', icon: HandCoins, href: '/payroll/advances?new=1' }],

  office: [
  { label: 'Add student', icon: UserPlus, href: '/students?new=1' },
  { label: 'Add staff member', icon: UserRoundPlus, href: '/staff/directory?new=1' },
  { label: 'Send announcement', icon: Megaphone, href: '/communication?compose=1' }],

  parent: [{ label: 'Pay school fees', icon: CreditCard, href: '/parent/fees' }],
  platform: [
  { label: 'New tenant / trial', icon: Building2, href: '/platform/tenants?new=1' },
  { label: 'SMS credit top-up', icon: MessageSquarePlus, href: '/platform/sms' }]

};
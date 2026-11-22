import type { AuditEntry, Message } from '../types/finance';
import type { RoleId } from '../types/school';

export const messageTemplates = [
{ id: 'absent', name: 'Absence alert', bn: 'অনুপস্থিতি', body: 'প্রিয় অভিভাবক, আজ {date} তারিখে {student} ({class}) বিদ্যালয়ে অনুপস্থিত। — শাপলা মডেল স্কুল', credits: 2 },
{ id: 'late', name: 'Late arrival', bn: 'বিলম্ব', body: 'Dear guardian, {student} ({class}) arrived late today ({date}). — Shapla Model School', credits: 1 },
{ id: 'fee', name: 'Fee reminder', bn: 'ফি স্মরণ', body: 'প্রিয় অভিভাবক, {student}-এর {month} মাসের বকেয়া {amount}। অনুগ্রহ করে {due} তারিখের মধ্যে পরিশোধ করুন।', credits: 2 },
{ id: 'makeup', name: 'Makeup class notice', bn: 'মেকআপ ক্লাস', body: 'Makeup class for {class} {subject} on {date}, {time}. — Shapla Model School', credits: 1 },
{ id: 'result', name: 'Result published', bn: 'ফলাফল প্রকাশ', body: '{assessment} result for {student} is now available in the Sabab guardian portal.', credits: 1 }];


export const messages: Message[] = [
{ id: 'MSG-2210', channel: 'SMS', audience: '8-A guardians · absentees', recipients: 1, template: 'Absence alert', body: 'প্রিয় অভিভাবক, আজ 02 Nov 2026 তারিখে মাহির ফয়সাল (8-A) বিদ্যালয়ে অনুপস্থিত।', sentAt: '02 Nov 2026 · 08:46', sentBy: 'Farhana Rahman', status: 'delivered', delivered: 1, failed: 0, credits: 2 },
{ id: 'MSG-2207', channel: 'App', audience: 'All guardians · Mirpur', recipients: 1186, template: 'Announcement', body: 'Parent–teacher meeting on Thursday 5 Nov, 10:00–13:00. Please bring the student diary.', sentAt: '01 Nov 2026 · 17:30', sentBy: 'Dr. Nasrin Akter', status: 'delivered', delivered: 1172, failed: 14, credits: 0 },
{ id: 'MSG-2203', channel: 'SMS', audience: '7-A guardians', recipients: 41, template: 'Makeup class notice', body: 'Makeup class for 7-A Mathematics on Tue 3 Nov, 13:40.', sentAt: '28 Oct 2026 · 08:12', sentBy: 'System', status: 'delivered', delivered: 40, failed: 1, credits: 41 },
{ id: 'MSG-2198', channel: 'SMS', audience: 'Fee defaulters · Oct', recipients: 74, template: 'Fee reminder', body: 'প্রিয় অভিভাবক, অক্টোবর মাসের বকেয়া পরিশোধ করুন।', sentAt: '26 Oct 2026 · 11:00', sentBy: 'Mizanur Rahman', status: 'delivered', delivered: 70, failed: 4, credits: 148 },
{ id: 'MSG-2190', channel: 'App', audience: '8-A guardians', recipients: 40, template: 'Result published', body: 'CT-3 Mathematics result is now available in the guardian portal.', sentAt: '17 Oct 2026 · 16:05', sentBy: 'System', status: 'delivered', delivered: 40, failed: 0, credits: 0 },
{ id: 'MSG-2184', channel: 'WhatsApp', audience: 'Class 9 guardians', recipients: 88, template: 'Exam routine', body: 'Annual exam routine attached.', sentAt: '15 Oct 2026 · 10:00', sentBy: 'Mahbub Alam', status: 'failed', delivered: 0, failed: 88, credits: 0 }];


export const auditLog: AuditEntry[] = [
{ id: 'AU-9012', at: '02 Nov 2026 · 08:44', actor: 'Farhana Rahman', module: 'Teaching', action: 'Lesson submitted', target: '8-A Mathematics P1 · 10.1 Parts of a circle', severity: 'info' },
{ id: 'AU-9011', at: '02 Nov 2026 · 08:41', actor: 'Farhana Rahman', module: 'Attendance', action: 'Period attendance confirmed', target: '8-A · 18 P / 1 A / 1 L', severity: 'info' },
{ id: 'AU-9006', at: '01 Nov 2026 · 16:12', actor: 'Mizanur Rahman', module: 'Fees', action: 'Daily close', target: 'Cash ৳48,600 · bKash ৳21,400', severity: 'info' },
{ id: 'AU-8998', at: '01 Nov 2026 · 12:30', actor: 'Mizanur Rahman', module: 'Fees', action: 'Receipt reversed', target: 'RC-26-04102 · duplicate bKash entry', severity: 'warning' },
{ id: 'AU-8990', at: '31 Oct 2026 · 11:15', actor: 'Mahbub Alam', module: 'Exams', action: 'Mark correction approved', target: 'CT-3 Math · S8A11 9 → 9 (no change after recheck)', severity: 'warning' },
{ id: 'AU-8984', at: '30 Oct 2026 · 16:40', actor: 'Mahbub Alam', module: 'Planner', action: 'Plan revision submitted', target: 'Academic plan v1.2', severity: 'info' },
{ id: 'AU-8970', at: '29 Oct 2026 · 10:02', actor: 'Dr. Nasrin Akter', module: 'Settings', action: 'Role permission changed', target: 'Exam Controller · can publish CT results', severity: 'critical' }];


export const notifications: Array<{id: string;roles: RoleId[];title: string;detail: string;at: string;href: string;tone: 'info' | 'warning' | 'danger' | 'success';}> = [
{ id: 'n1', roles: ['principal', 'owner'], title: 'Plan revision v1.2 awaiting approval', detail: 'Submitted by Mahbub Alam · 4 changes', at: '2d', href: '/planner/versions', tone: 'warning' },
{ id: 'n2', roles: ['principal', 'coordinator'], title: 'Makeup class MK-104 proposed', detail: '8-B Mathematics · Wed 4 Nov', at: '1d', href: '/makeup', tone: 'info' },
{ id: 'n3', roles: ['principal', 'coordinator'], title: '9-A Physics is 15% behind plan', detail: 'Teacher on leave · gap MK-103 open', at: '4d', href: '/planner/syllabus', tone: 'danger' },
{ id: 'n4', roles: ['principal', 'coordinator'], title: 'Timetable clash on Tuesday P7', detail: 'ICT Lab double-booked (8-B, 9-A)', at: '5d', href: '/timetable', tone: 'danger' },
{ id: 'n5', roles: ['teacher'], title: 'Log lesson for 8-B (P2)', detail: 'Attendance and lesson record pending', at: '25m', href: '/teaching', tone: 'warning' },
{ id: 'n6', roles: ['teacher'], title: 'Annual Math paper in moderation', detail: 'Tahmina Begum is reviewing', at: '2d', href: '/exams/assessments', tone: 'info' },
{ id: 'n7', roles: ['teacher'], title: 'Makeup MK-102 approved', detail: '7-A · Tue 3 Nov, 13:40', at: '5d', href: '/makeup', tone: 'success' },
{ id: 'n8', roles: ['parent'], title: 'CT-3 Mathematics result published', detail: 'Ayaan Islam · 17/20', at: '16d', href: '/parent/results', tone: 'success' },
{ id: 'n9', roles: ['parent'], title: 'November fees due 10 Nov', detail: 'Ayaan ৳3,600 · Nusrat ৳1,650', at: '2d', href: '/parent/fees', tone: 'warning' },
{ id: 'n10', roles: ['accountant'], title: '18 invoices overdue (Oct)', detail: 'Send reminders from Fees › Invoices', at: '1d', href: '/fees/invoices', tone: 'danger' },
{ id: 'n11', roles: ['platform'], title: 'Karnaphuli Grammar in grace period', detail: 'Renewal failed 25 Oct · 3 days left', at: '1d', href: '/platform/tenants', tone: 'danger' },
{ id: 'n12', roles: ['platform'], title: 'Teesta Public School at 99% student limit', detail: 'Upsell or limit increase', at: '3d', href: '/platform/tenants', tone: 'warning' },
{ id: 'n13', roles: ['office'], title: 'Admission documents pending', detail: 'Arshi Rahman · birth certificate', at: '5d', href: '/students', tone: 'warning' }];
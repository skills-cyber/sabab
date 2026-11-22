import type { FeatureFlag, Plan, SmsProvider, SupportTicket, Tenant } from '../types/saas';

export const featureFlags: FeatureFlag[] = [
{ id: 'planner', label: 'Academic Planner', description: 'Annual plan, syllabus map, approvals' },
{ id: 'questionBank', label: 'Question Bank', description: 'Versioned questions & moderation' },
{ id: 'parentApp', label: 'Parent Portal', description: 'Guardian web/PWA access' },
{ id: 'onlinePay', label: 'Online Payments', description: 'MFS / gateway collection (integration pending)' },
{ id: 'lms', label: 'Homework & LMS', description: 'Assignments, materials, quizzes' },
{ id: 'multiCampus', label: 'Multi-campus', description: 'Cross-campus views and permissions' },
{ id: 'advReports', label: 'Advanced Reports', description: 'Coverage analytics & exports' },
{ id: 'whatsapp', label: 'WhatsApp channel', description: 'Template-approved messaging (pending provider)' }];


export const plans: Plan[] = [
{ id: 'starter', name: 'Starter', priceMonthly: 2500, campusLimit: 1, studentLimit: 600, smsIncluded: 1000, features: ['planner', 'parentApp'] },
{ id: 'growth', name: 'Growth', priceMonthly: 6500, campusLimit: 2, studentLimit: 2000, smsIncluded: 5000, features: ['planner', 'questionBank', 'parentApp', 'onlinePay', 'lms', 'multiCampus'] },
{ id: 'institution', name: 'Institution', priceMonthly: 14000, campusLimit: 5, studentLimit: 6000, smsIncluded: 15000, features: ['planner', 'questionBank', 'parentApp', 'onlinePay', 'lms', 'multiCampus', 'advReports', 'whatsapp'] }];


const growth = { planner: true, questionBank: true, parentApp: true, onlinePay: true, lms: true, multiCampus: true, advReports: false, whatsapp: false };
const starter = { planner: true, questionBank: false, parentApp: true, onlinePay: false, lms: false, multiCampus: false, advReports: false, whatsapp: false };
const institution = { planner: true, questionBank: true, parentApp: true, onlinePay: true, lms: true, multiCampus: true, advReports: true, whatsapp: true };

/** FICTIONAL tenants. */
export const tenants: Tenant[] = [
{ id: 'TN-0001', name: 'Shapla Model School & College', district: 'Dhaka', planId: 'growth', status: 'active', campuses: 2, campusLimit: 2, students: 1850, studentLimit: 2000, smsCredits: 3420, mrr: 6500, renewsOn: '2027-01-15', contact: 'Dr. Nasrin Akter', contactPhone: '01711-000001', features: { ...growth, advReports: true }, createdOn: '2025-11-02', health: 'good' },
{ id: 'TN-0002', name: 'Padma Valley High School', district: 'Rajshahi', planId: 'starter', status: 'active', campuses: 1, campusLimit: 1, students: 540, studentLimit: 600, smsCredits: 610, mrr: 2500, renewsOn: '2026-12-01', contact: 'Abu Taher', contactPhone: '01712-000002', features: starter, createdOn: '2025-12-10', health: 'good' },
{ id: 'TN-0003', name: 'Meghna Ideal School', district: 'Chandpur', planId: 'growth', status: 'trial', campuses: 1, campusLimit: 2, students: 320, studentLimit: 2000, smsCredits: 500, mrr: 0, renewsOn: '2026-11-14', contact: 'Salma Khatun', contactPhone: '01713-000003', features: growth, createdOn: '2026-10-15', health: 'good' },
{ id: 'TN-0004', name: 'Green Valley School', district: 'Sylhet', planId: 'institution', status: 'active', campuses: 4, campusLimit: 5, students: 4210, studentLimit: 6000, smsCredits: 12880, mrr: 14000, renewsOn: '2027-03-01', contact: 'Rubina Ahmed', contactPhone: '01714-000004', features: institution, createdOn: '2025-09-01', health: 'good' },
{ id: 'TN-0005', name: 'Karnaphuli Grammar School', district: 'Chattogram', planId: 'growth', status: 'grace', campuses: 2, campusLimit: 2, students: 1620, studentLimit: 2000, smsCredits: 45, mrr: 6500, renewsOn: '2026-10-25', contact: 'Iftekhar Uddin', contactPhone: '01715-000005', features: growth, createdOn: '2025-10-20', health: 'critical' },
{ id: 'TN-0006', name: 'Jamuna Residential Model School', district: 'Tangail', planId: 'starter', status: 'suspended', campuses: 1, campusLimit: 1, students: 410, studentLimit: 600, smsCredits: 0, mrr: 0, renewsOn: '2026-08-30', contact: 'Hafizur Rahman', contactPhone: '01716-000006', features: starter, createdOn: '2026-01-12', health: 'critical' },
{ id: 'TN-0007', name: 'Rupsha Model School', district: 'Khulna', planId: 'growth', status: 'onboarding', campuses: 1, campusLimit: 2, students: 0, studentLimit: 2000, smsCredits: 1000, mrr: 6500, renewsOn: '2027-10-30', contact: 'Moushumi Das', contactPhone: '01717-000007', features: growth, createdOn: '2026-10-30', health: 'warning' },
{ id: 'TN-0008', name: 'Teesta Public School', district: 'Rangpur', planId: 'starter', status: 'active', campuses: 1, campusLimit: 1, students: 592, studentLimit: 600, smsCredits: 120, mrr: 2500, renewsOn: '2026-11-20', contact: 'Nazmul Huda', contactPhone: '01718-000008', features: starter, createdOn: '2026-02-03', health: 'warning' },
{ id: 'TN-0009', name: 'Kirtankhola Sunrise Academy', district: 'Barishal', planId: 'growth', status: 'active', campuses: 2, campusLimit: 2, students: 1180, studentLimit: 2000, smsCredits: 2210, mrr: 6500, renewsOn: '2027-02-11', contact: 'Asif Mahmud', contactPhone: '01719-000009', features: growth, createdOn: '2026-02-11', health: 'good' },
{ id: 'TN-0010', name: "Bay View English School", district: "Cox's Bazar", planId: 'starter', status: 'trial', campuses: 1, campusLimit: 1, students: 140, studentLimit: 600, smsCredits: 300, mrr: 0, renewsOn: '2026-11-09', contact: 'Sharmin Akhter', contactPhone: '01720-000010', features: starter, createdOn: '2026-10-09', health: 'good' }];


export const smsProviders: SmsProvider[] = [
{ id: 'P1', name: 'Provider A · Masking SMS (sample)', channel: 'SMS', status: 'active', balance: 182500, costPerSms: 0.45, sent30d: 214300, failed30d: 2140 },
{ id: 'P2', name: 'Provider B · Non-masking SMS (sample)', channel: 'SMS', status: 'active', balance: 64000, costPerSms: 0.3, sent30d: 51200, failed30d: 980 },
{ id: 'P3', name: 'WhatsApp Business API (sample)', channel: 'WhatsApp', status: 'pending', balance: 0, costPerSms: 0.9, sent30d: 0, failed30d: 0 }];


export const smsPackages = [
{ id: 'K1', name: '1,000 SMS', credits: 1000, price: 550 },
{ id: 'K2', name: '5,000 SMS', credits: 5000, price: 2500 },
{ id: 'K3', name: '20,000 SMS', credits: 20000, price: 9000 },
{ id: 'K4', name: '50,000 SMS', credits: 50000, price: 21000 }];


export const supportTickets: SupportTicket[] = [
{ id: 'SUP-882', tenantId: 'TN-0005', subject: 'Payment failed — requesting renewal extension', priority: 'High', status: 'open', opened: '2026-10-31' },
{ id: 'SUP-879', tenantId: 'TN-0007', subject: 'Excel roster import: 38 guardian phone errors', priority: 'Medium', status: 'open', opened: '2026-10-30' },
{ id: 'SUP-871', tenantId: 'TN-0002', subject: 'Report card Bangla font on A4 print', priority: 'Low', status: 'resolved', opened: '2026-10-24' },
{ id: 'SUP-866', tenantId: 'TN-0008', subject: 'Approaching 600-student limit before admission season', priority: 'Medium', status: 'open', opened: '2026-10-21' }];


export const mrrTrend = [
{ month: 'Jun', value: 52500 },
{ month: 'Jul', value: 55000 },
{ month: 'Aug', value: 58500 },
{ month: 'Sep', value: 61000 },
{ month: 'Oct', value: 63500 },
{ month: 'Nov', value: 57000 }];
import type { Bill, Category, FinAccount, Party, Txn } from '../types/accounts';

export const DEFAULT_APPROVAL_LIMIT = 5000;
export const SYSTEM_CATEGORY = { fees: 'in-fees', bankCharges: 'ex-bank', adjustment: 'adj', salaries: 'ex-salaries', advance: 'ex-salary', advanceRepay: 'in-advance' } as const;

/** Monthly totals before the live month (Jun–Oct 2026) for the 6-month trend. */
export const monthlyHistory = [
{ month: 'Jun', income: 612400, expense: 498300 },
{ month: 'Jul', income: 588900, expense: 512700 },
{ month: 'Aug', income: 641200, expense: 506100 },
{ month: 'Sep', income: 603800, expense: 531900 },
{ month: 'Oct', income: 655300, expense: 547600 }];


export const finAccounts: FinAccount[] = [
{ id: 'cash-mirpur', name: 'Main cash – Mirpur', type: 'cash', campusId: 'mirpur', opening: 42000, openingDate: '2026-11-01', archived: false },
{ id: 'cash-uttara', name: 'Main cash – Uttara', type: 'cash', campusId: 'uttara', opening: 18500, openingDate: '2026-11-01', archived: false },
{ id: 'dbbl', name: 'DBBL Current – Mirpur', type: 'bank', campusId: 'mirpur', bank: 'Dutch-Bangla Bank', branch: 'Mirpur 10', number: '1071100044471', opening: 1186500, openingDate: '2026-11-01', archived: false, reconciledTo: '2026-10-31' },
{ id: 'city', name: 'City Bank Savings', type: 'bank', campusId: 'mirpur', bank: 'City Bank', branch: 'Uttara Sector 7', number: '2302114821001', opening: 640000, openingDate: '2026-11-01', archived: false },
{ id: 'bkash', name: 'bKash merchant', type: 'wallet', campusId: 'mirpur', provider: 'bKash', number: '01711-556677', opening: 63400, openingDate: '2026-11-01', archived: false },
{ id: 'nagad', name: 'Nagad merchant', type: 'wallet', campusId: 'mirpur', provider: 'Nagad', number: '01911-334455', opening: 21800, openingDate: '2026-11-01', archived: false }];


export const categories: Category[] = [
{ id: 'in-fees', name: 'Fee collection', kind: 'income', archived: false, system: true },
{ id: 'in-donation', name: 'Donations & grants', kind: 'income', archived: false },
{ id: 'in-canteen', name: 'Canteen & shop rent', kind: 'income', archived: false },
{ id: 'in-forms', name: 'Admission form sales', kind: 'income', archived: false },
{ id: 'in-hall', name: 'Hall / ground hire', kind: 'income', archived: false },
{ id: 'in-other', name: 'Other income', kind: 'income', archived: false },
{ id: 'ex-utilities', name: 'Utilities', kind: 'expense', budget: 30000, archived: false },
{ id: 'ex-stationery', name: 'Stationery & printing', kind: 'expense', budget: 12000, archived: false },
{ id: 'ex-maintenance', name: 'Maintenance', kind: 'expense', budget: 15000, archived: false },
{ id: 'ex-exam', name: 'Exam materials', kind: 'expense', budget: 10000, archived: false },
{ id: 'ex-fuel', name: 'Transport fuel', kind: 'expense', budget: 45000, archived: false },
{ id: 'ex-events', name: 'Events', kind: 'expense', budget: 8000, archived: false },
{ id: 'in-advance', name: 'Advance repayment', kind: 'income', archived: false, system: true },
{ id: 'ex-salaries', name: 'Salaries', kind: 'expense', archived: false, system: true },
{ id: 'ex-salary', name: 'Salary advance', kind: 'expense', budget: 20000, archived: false, system: true },
{ id: 'ex-bank', name: 'Bank & MFS charges', kind: 'expense', budget: 1500, archived: false, system: true },
{ id: 'ex-misc', name: 'Miscellaneous', kind: 'expense', budget: 5000, archived: false }];


export const parties: Party[] = [
{ id: 'P01', name: 'Nilkhet Printers', type: 'vendor', phone: '01711-201301', archived: false, opening: 14500, openingDirection: 'payable', openingDate: '2026-11-01' },
{ id: 'P02', name: 'DESCO', type: 'vendor', phone: '16120', note: 'Electricity · account 44120387', archived: false },
{ id: 'P03', name: 'Rahim Electric', type: 'vendor', phone: '01819-447210', archived: false },
{ id: 'P04', name: 'Padma Oil', type: 'vendor', phone: '01713-009988', archived: false },
{ id: 'P05', name: 'Shapla Stationers', type: 'vendor', phone: '01552-310045', archived: false },
{ id: 'P06', name: 'Dhaka WASA', type: 'vendor', phone: '16162', archived: false },
{ id: 'P07', name: 'Bismillah Canteen', type: 'payer', phone: '01675-220114', note: 'Monthly rent ৳12,000', archived: false, opening: 12000, openingDirection: 'receivable', openingDate: '2026-11-01' },
{ id: 'P08', name: 'Alumni Association', type: 'donor', phone: '01711-909090', archived: false },
{ id: 'P09', name: 'Mirpur Rotary Club', type: 'donor', phone: '01730-114477', archived: false },
{ id: 'P10', name: 'Green Field Sports Club', type: 'payer', phone: '01911-562340', note: 'Weekend ground hire', archived: false },
{ id: 'P11', name: 'Karim Decorators', type: 'vendor', phone: '01817-554433', archived: false },
{ id: 'P12', name: 'Abdul Halim (driver)', type: 'staff', phone: '01729-880011', archived: false }];


const ACC = 'Mizanur Rahman';
const h = (at: string, actor: string, action: string, tone?: 'success' | 'warning' | 'danger' | 'info', note?: string) => ({ at, actor, action, tone, note });

export const transactions: Txn[] = [
{ id: 'TX-3108', voucher: 'PV-1108', date: '2026-11-02', kind: 'expense', accountId: 'cash-mirpur', amount: 6800, categoryId: 'ex-exam', partyId: 'P01', method: 'Cash', note: 'Annual exam answer scripts (1,200)', status: 'pending-approval', createdBy: ACC, history: [h('02 Nov 2026 · 09:40', ACC, 'Submitted for approval', 'info')] },
{ id: 'TX-3107', voucher: 'PV-1107', date: '2026-11-02', kind: 'expense', accountId: 'dbbl', amount: 18450, categoryId: 'ex-utilities', partyId: 'P02', method: 'Bank transfer', reference: 'DBBL-NPSB-88123', note: 'Electricity · Oct', status: 'posted', createdBy: ACC, history: [h('02 Nov 2026 · 09:10', ACC, 'Submitted for approval'), h('02 Nov 2026 · 09:30', 'Alhaj Rezaul Karim', 'Approved & posted', 'success')] },
{ id: 'TX-3106', voucher: 'PV-1106', date: '2026-11-01', kind: 'expense', accountId: 'cash-mirpur', amount: 3200, categoryId: 'ex-maintenance', partyId: 'P03', method: 'Cash', note: 'Fan repair · R201, R202', status: 'posted', createdBy: ACC, history: [h('01 Nov 2026 · 12:15', ACC, 'Posted', 'success')] },
{ id: 'TX-3105', voucher: 'PV-1105', date: '2026-11-01', kind: 'expense', accountId: 'cash-mirpur', amount: 4500, categoryId: 'ex-events', partyId: 'P11', method: 'Cash', note: 'Parent–teacher meeting refreshments (est.)', status: 'returned', createdBy: ACC, history: [h('01 Nov 2026 · 11:00', ACC, 'Posted for review'), h('01 Nov 2026 · 16:20', 'Dr. Nasrin Akter', 'Returned', 'warning', 'Attach the decorator quotation and split refreshments from décor.')] },
{ id: 'TX-3104', voucher: 'PV-1104', date: '2026-10-31', kind: 'expense', accountId: 'bkash', amount: 9600, categoryId: 'ex-fuel', partyId: 'P04', method: 'bKash', reference: 'BK9XK2L7QP', status: 'posted', createdBy: ACC, history: [h('31 Oct 2026 · 15:05', ACC, 'Submitted for approval'), h('31 Oct 2026 · 17:00', 'Alhaj Rezaul Karim', 'Approved & posted', 'success')] },
{ id: 'TX-3103', voucher: 'PV-1103', date: '2026-10-30', kind: 'expense', accountId: 'cash-mirpur', amount: 2150, categoryId: 'ex-stationery', partyId: 'P05', method: 'Cash', note: 'Duplicate voucher', status: 'reversed', createdBy: ACC, history: [h('30 Oct 2026 · 10:00', ACC, 'Posted', 'success'), h('30 Oct 2026 · 14:30', ACC, 'Reversed', 'danger', 'Duplicate of PV-1101')] },
{ id: 'TX-2041', voucher: 'RV-2041', date: '2026-11-02', kind: 'income', accountId: 'cash-mirpur', amount: 12000, categoryId: 'in-canteen', partyId: 'P07', method: 'Cash', note: 'Canteen rent · Nov', status: 'posted', createdBy: ACC, history: [h('02 Nov 2026 · 08:50', ACC, 'Posted', 'success')] },
{ id: 'TX-2040', voucher: 'RV-2040', date: '2026-11-01', kind: 'income', accountId: 'city', amount: 75000, categoryId: 'in-donation', partyId: 'P08', method: 'Cheque', reference: 'CHQ 0045512', note: 'Science lab equipment fund', status: 'pending-approval', createdBy: ACC, history: [h('01 Nov 2026 · 13:10', ACC, 'Submitted for approval', 'info')] },
{ id: 'TX-2039', voucher: 'RV-2039', date: '2026-11-01', kind: 'income', accountId: 'cash-mirpur', amount: 4500, categoryId: 'in-forms', method: 'Cash', note: '9 admission forms × ৳500', status: 'posted', createdBy: ACC, history: [h('01 Nov 2026 · 15:40', ACC, 'Posted', 'success')] },
{ id: 'TX-2038', voucher: 'RV-2038', date: '2026-10-31', kind: 'income', accountId: 'bkash', amount: 6000, categoryId: 'in-hall', partyId: 'P10', method: 'bKash', reference: 'BK7HQ22PLM', note: 'Ground hire · 2 Saturdays', status: 'posted', createdBy: ACC, history: [h('31 Oct 2026 · 11:20', ACC, 'Posted', 'success')] },
{ id: 'TX-5012', voucher: 'TV-5012', date: '2026-11-02', kind: 'transfer', accountId: 'cash-mirpur', toAccountId: 'dbbl', amount: 30000, method: 'Bank transfer', reference: 'Deposit slip 778120', note: 'Cash deposit to bank', status: 'posted', createdBy: ACC, history: [h('02 Nov 2026 · 09:55', ACC, 'Submitted for approval'), h('02 Nov 2026 · 10:02', 'Dr. Nasrin Akter', 'Approved & posted', 'success')] },
{ id: 'TX-5011', voucher: 'TV-5011', date: '2026-11-01', kind: 'transfer', accountId: 'bkash', toAccountId: 'dbbl', amount: 40000, method: 'bKash', reference: 'BKB2B5501', note: 'Weekly merchant settlement', status: 'posted', createdBy: ACC, history: [h('01 Nov 2026 · 17:30', ACC, 'Submitted for approval'), h('01 Nov 2026 · 18:00', 'Alhaj Rezaul Karim', 'Approved & posted', 'success')] },
{ id: 'TX-5011F', voucher: 'PV-5011F', date: '2026-11-01', kind: 'expense', accountId: 'bkash', amount: 600, categoryId: 'ex-bank', method: 'bKash', note: 'Transfer fee · TV-5011', pairId: 'TX-5011', status: 'posted', createdBy: ACC, history: [h('01 Nov 2026 · 17:30', ACC, 'Fee recorded with transfer')] }];


export const bills: Bill[] = [
{ id: 'BL-0412', ref: 'BL-0412', partyId: 'P05', direction: 'payable', date: '2026-10-28', dueDate: '2026-11-10', amount: 8650, categoryId: 'ex-stationery', note: 'Exam stationery on credit', status: 'open', createdBy: ACC },
{ id: 'BL-0411', ref: 'BL-0411', partyId: 'P11', direction: 'payable', date: '2026-10-20', dueDate: '2026-10-31', amount: 22000, categoryId: 'ex-events', note: 'Sports day décor & sound', status: 'open', createdBy: ACC },
{ id: 'BL-0410', ref: 'BL-0410', partyId: 'P10', direction: 'receivable', date: '2026-10-26', dueDate: '2026-11-05', amount: 6000, categoryId: 'in-hall', note: 'Ground hire · 2 Saturdays (Nov)', status: 'open', createdBy: ACC }];
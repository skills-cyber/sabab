import type { Advance, SalaryPayment, SalarySheet, SheetRow } from '../types/payroll';
import type { StaffMember } from '../types/staff';
import { allowanceTotal, deductionTotal, workingDaysIn } from '../utils/payroll';
import { staffMembers } from './staff';

/** FICTIONAL SAMPLE DATA — September paid before the ledger opened; October submitted for approval. */

const h = (at: string, actor: string, action: string, tone?: 'success' | 'warning' | 'danger' | 'info', note?: string) => ({ at, actor, action, tone, note });
const ACC = 'Mizanur Rahman';

export const advances: Advance[] = [
{ id: 'ADV-104', staffId: 'S03', date: '2026-09-10', amount: 6000, installments: 3, perMonth: 2000, accountId: 'cash-mirpur', note: 'Medical emergency (family)', recoveries: [{ month: '2026-09', amount: 2000, ref: 'SAL-2026-09' }] },
{ id: 'ADV-103', staffId: 'T02', date: '2026-09-05', amount: 10000, installments: 5, perMonth: 2000, accountId: 'dbbl', note: 'House shifting', recoveries: [{ month: '2026-09', amount: 2000, ref: 'SAL-2026-09' }] }];


const row = (s: StaffMember, workingDays: number, leaveDays: number, recovery: number, paid: boolean): SheetRow => {
  const allowances = allowanceTotal(s.salary);
  const gross = s.salary.basic + allowances;
  const leaveDeduction = Math.round(gross / workingDays * leaveDays);
  const otherDeductions = deductionTotal(s.salary);
  const net = Math.max(0, gross - leaveDeduction - otherDeductions - recovery);
  return { staffId: s.id, basic: s.salary.basic, allowances, gross, leaveDays, leaveDeduction, otherDeductions, advanceRecovery: recovery, bonus: 0, net, paid: paid ? net : 0 };
};

const mirpur = staffMembers.filter((s) => s.campusId === 'mirpur');
const sepDays = workingDaysIn('2026-09');
const octDays = workingDaysIn('2026-10');

export const salarySheets: SalarySheet[] = [
{
  id: 'SAL-2026-10', month: '2026-10', campusId: 'mirpur', workingDays: octDays, status: 'submitted', createdBy: ACC,
  rows: mirpur.map((s) => row(s, octDays, s.id === 'S03' ? 2 : 0, s.id === 'S03' || s.id === 'T02' ? 2000 : 0, false)),
  history: [h('01 Nov 2026 · 10:15', ACC, 'Sheet generated'), h('01 Nov 2026 · 16:40', ACC, 'Submitted for approval', 'info')]
},
{
  id: 'SAL-2026-09', month: '2026-09', campusId: 'mirpur', workingDays: sepDays, status: 'paid', createdBy: ACC,
  rows: mirpur.map((s) => row(s, sepDays, 0, s.id === 'S03' || s.id === 'T02' ? 2000 : 0, true)),
  history: [h('01 Oct 2026 · 10:00', ACC, 'Sheet generated'), h('01 Oct 2026 · 15:00', ACC, 'Submitted for approval'), h('01 Oct 2026 · 17:20', 'Alhaj Rezaul Karim', 'Approved', 'success'), h('02 Oct 2026 · 11:00', ACC, 'Paid in full', 'success')]
}];


export const salaryPayments: SalaryPayment[] = salarySheets[1].rows.map((r, i) => {
  const s = staffMembers.find((x) => x.id === r.staffId);
  const cash = s?.payMethod === 'Cash';
  return { id: `SP-09-${i}`, sheetId: 'SAL-2026-09', staffId: r.staffId, date: '2026-10-02', amount: r.net, accountId: cash ? 'cash-mirpur' : s?.payMethod === 'bKash' ? 'bkash' : 'dbbl', method: s?.payMethod ?? 'Cash', voucher: `SP-0926-${String(i + 1).padStart(2, '0')}` };
});
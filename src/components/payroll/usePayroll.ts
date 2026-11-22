import { useCallback, useState } from 'react';
import { useAccounts } from '../../contexts/AccountsContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import { useStaff } from '../../contexts/StaffContext';
import { SYSTEM_CATEGORY } from '../../data/accounts';
import { advances as seedAdvances, salaryPayments as seedPayments, salarySheets as seedSheets } from '../../data/payroll';
import type { TxnMethod } from '../../types/accounts';
import type { Advance, LedgerRow, SalaryPayment, SalarySheet, SheetRow } from '../../types/payroll';
import type { StaffMember } from '../../types/staff';
import { formatBDT, nowStamp } from '../../utils/format';
import { allowanceTotal, deductionTotal, monthLabel, workingDaysIn } from '../../utils/payroll';

export type AdvanceState = 'pending' | 'active' | 'settled' | 'cancelled';

export const recomputeRow = (r: SheetRow, workingDays: number): SheetRow => {
  const leaveDeduction = Math.round(r.gross / workingDays * r.leaveDays);
  const net = Math.max(0, r.gross - leaveDeduction - r.otherDeductions - r.advanceRecovery + r.bonus);
  return { ...r, leaveDeduction, net };
};

/**
 * Payroll store — frontend contract for /payroll APIs: salary sheets (draft → submitted → approved → paid),
 * salary payments (posted to Accounts as "Salaries"), advances with monthly recovery, and per-person staff ledgers.
 */
export function usePayrollStore() {
  const { role, roleInfo } = useApp();
  const { addAudit } = useAdmin();
  const fin = useAccounts();
  const { staff, updateStaff, unpaidDaysIn } = useStaff();
  const actor = roleInfo.user;
  const [sheets, setSheets] = useState<SalarySheet[]>(seedSheets);
  const [payments, setPayments] = useState<SalaryPayment[]>(seedPayments);
  const [advances, setAdvances] = useState<Advance[]>(seedAdvances);

  const canPrepare = role === 'accountant' || role === 'owner';
  const canApprove = role === 'owner' || role === 'principal';
  const entry = (action: string, tone?: 'success' | 'warning' | 'danger' | 'info', note?: string) => ({ at: nowStamp(), actor, action, tone, note });

  // ---------- Advances ----------
  const advanceInfo = useCallback((a: Advance) => {
    const txn = a.txnId ? fin.txns.find((t) => t.id === a.txnId) : undefined;
    const recovered = a.recoveries.reduce((s, r) => s + r.amount, 0);
    const remaining = Math.max(0, a.amount - recovered);
    let state: AdvanceState = remaining > 0 ? 'active' : 'settled';
    if (txn?.status === 'pending-approval') state = 'pending';
    if (txn && (txn.status === 'returned' || txn.status === 'reversed')) state = 'cancelled';
    return { recovered, remaining, state, voucher: txn?.voucher };
  }, [fin.txns]);

  const activeAdvances = useCallback((staffId: string) => advances.filter((a) => a.staffId === staffId && advanceInfo(a).state === 'active'), [advances, advanceInfo]);
  const outstandingAdvance = useCallback((staffId: string) => activeAdvances(staffId).reduce((s, a) => s + advanceInfo(a).remaining, 0), [activeAdvances, advanceInfo]);

  const ensureParty = (s: StaffMember) => {
    if (s.partyId) return s.partyId;
    const id = fin.addParty({ name: s.name, type: 'staff', phone: s.phone, note: `${s.id} · ${s.designation}` });
    updateStaff(s.id, { partyId: id }, 'Linked to Accounts party');
    return id;
  };

  const giveAdvance = (d: {staffId: string;amount: number;installments: number;accountId: string;date: string;method: TxnMethod;reference?: string;note?: string;}) => {
    const s = staff.find((x) => x.id === d.staffId);
    if (!s) return null;
    const partyId = ensureParty(s);
    const r = fin.record({ kind: 'expense', date: d.date, accountId: d.accountId, amount: d.amount, categoryId: SYSTEM_CATEGORY.advance, partyId, method: d.method, reference: d.reference, note: `Salary advance · ${s.name}${d.note ? ` · ${d.note}` : ''}` });
    const id = `ADV-${105 + advances.length}`;
    setAdvances((l) => [{ id, staffId: d.staffId, date: d.date, amount: d.amount, installments: d.installments, perMonth: Math.ceil(d.amount / d.installments), accountId: d.accountId, txnId: r.id, note: d.note, recoveries: [] }, ...l]);
    addAudit('Payroll', 'Advance given', `${id} · ${s.name} · ${formatBDT(d.amount)}`);
    return { id, ...r };
  };

  const repayAdvance = (advanceId: string, amount: number, accountId: string, date: string, method: TxnMethod) => {
    const a = advances.find((x) => x.id === advanceId);
    const s = staff.find((x) => x.id === a?.staffId);
    if (!a || !s) return null;
    const r = fin.record({ kind: 'income', date, accountId, amount, categoryId: SYSTEM_CATEGORY.advanceRepay, partyId: ensureParty(s), method, note: `Advance repayment · ${a.id} · ${s.name}` }, { preApproved: true });
    setAdvances((l) => l.map((x) => x.id === advanceId ? { ...x, recoveries: [...x.recoveries, { month: date.slice(0, 7), amount, ref: r.voucher }] } : x));
    addAudit('Payroll', 'Advance repaid early', `${advanceId} · ${formatBDT(amount)}`);
    return r;
  };

  // ---------- Sheets ----------
  const buildRow = (s: StaffMember, month: string, workingDays: number): SheetRow => {
    const allowances = allowanceTotal(s.salary);
    const gross = s.salary.basic + allowances;
    const recovery = activeAdvances(s.id).filter((a) => !a.recoveries.some((r) => r.month === month)).reduce((t, a) => t + Math.min(a.perMonth, advanceInfo(a).remaining), 0);
    return recomputeRow({ staffId: s.id, basic: s.salary.basic, allowances, gross, leaveDays: unpaidDaysIn(s.id, month), leaveDeduction: 0, otherDeductions: deductionTotal(s.salary), advanceRecovery: recovery, bonus: 0, net: 0, paid: 0 }, workingDays);
  };

  const generate = (month: string, campusId: string) => {
    if (sheets.some((x) => x.month === month && x.campusId === campusId)) return { error: `A sheet for ${monthLabel(month)} already exists for this campus.` };
    const workingDays = workingDaysIn(month);
    const monthEnd = `${month}-31`;
    const people = staff.filter((s) => s.campusId === campusId && s.joined <= monthEnd && (s.status !== 'resigned' || (s.lastDay ?? '') >= `${month}-01`));
    if (!people.length) return { error: 'No active staff on this campus.' };
    const id = `SAL-${month}${campusId === 'mirpur' ? '' : `-${campusId.toUpperCase().slice(0, 3)}`}`;
    setSheets((l) => [{ id, month, campusId, workingDays, status: 'draft', createdBy: actor, rows: people.map((s) => buildRow(s, month, workingDays)), history: [entry('Sheet generated')] }, ...l]);
    addAudit('Payroll', 'Salary sheet generated', `${id} · ${people.length} staff`);
    return { id };
  };

  const updateRow = (sheetId: string, staffId: string, patch: Partial<Pick<SheetRow, 'bonus' | 'leaveDays' | 'advanceRecovery' | 'note'>>) => {
    setSheets((l) => l.map((sh) => sh.id !== sheetId ? sh : { ...sh, rows: sh.rows.map((r) => r.staffId === staffId ? recomputeRow({ ...r, ...patch }, sh.workingDays) : r) }));
  };
  const removeRow = (sheetId: string, staffId: string) => setSheets((l) => l.map((sh) => sh.id !== sheetId ? sh : { ...sh, rows: sh.rows.filter((r) => r.staffId !== staffId) }));
  const deleteDraft = (sheetId: string) => {
    setSheets((l) => l.filter((x) => x.id !== sheetId));
    addAudit('Payroll', 'Draft sheet deleted', sheetId, 'warning');
  };
  const submit = (sheetId: string) => {
    setSheets((l) => l.map((x) => x.id === sheetId ? { ...x, status: 'submitted', history: [...x.history, entry('Submitted for approval', 'info')] } : x));
    addAudit('Payroll', 'Sheet submitted', sheetId);
  };
  const decide = (sheetId: string, approve: boolean, note = '') => {
    const sh = sheets.find((x) => x.id === sheetId);
    setSheets((l) => l.map((x) => x.id === sheetId ? { ...x, status: approve ? 'approved' : 'returned', history: [...x.history, entry(approve ? 'Approved' : 'Returned', approve ? 'success' : 'warning', note || undefined)] } : x));
    if (approve && sh) {
      // Book advance recoveries FIFO against each person's active advances.
      setAdvances((list) => {
        const next = list.map((a) => ({ ...a, recoveries: [...a.recoveries] }));
        sh.rows.filter((r) => r.advanceRecovery > 0).forEach((r) => {
          let left = r.advanceRecovery;
          next.filter((a) => a.staffId === r.staffId && advanceInfo(a).state !== 'cancelled' && advanceInfo(a).state !== 'pending').sort((a, b) => a.date.localeCompare(b.date)).forEach((a) => {
            const rem = a.amount - a.recoveries.reduce((s, x) => s + x.amount, 0);
            if (left <= 0 || rem <= 0) return;
            const take = Math.min(rem, left);
            a.recoveries.push({ month: sh.month, amount: take, ref: sh.id });
            left -= take;
          });
        });
        return next;
      });
    }
    addAudit('Payroll', approve ? 'Sheet approved' : 'Sheet returned', `${sheetId}${note ? ` · ${note}` : ''}`, approve ? 'info' : 'warning');
  };

  const pay = (sheetId: string, items: Array<{staffId: string;amount: number;}>, d: {accountId: string;date: string;method: TxnMethod;reference?: string;}) => {
    const sh = sheets.find((x) => x.id === sheetId);
    if (!sh) return 0;
    const made: SalaryPayment[] = [];
    items.filter((i) => i.amount > 0).forEach((i) => {
      const s = staff.find((x) => x.id === i.staffId);
      if (!s) return;
      const r = fin.record({ kind: 'expense', date: d.date, accountId: d.accountId, amount: i.amount, categoryId: SYSTEM_CATEGORY.salaries, partyId: ensureParty(s), method: d.method, reference: d.reference, note: `Salary ${monthLabel(sh.month)} · ${s.name}` }, { preApproved: true });
      made.push({ id: `SP-${r.id}`, sheetId, staffId: s.id, date: d.date, amount: i.amount, accountId: d.accountId, method: d.method, reference: d.reference, txnId: r.id, voucher: r.voucher });
    });
    setPayments((l) => [...made, ...l]);
    setSheets((l) => l.map((x) => {
      if (x.id !== sheetId) return x;
      const rows = x.rows.map((r) => ({ ...r, paid: r.paid + made.filter((m) => m.staffId === r.staffId).reduce((s, m) => s + m.amount, 0) }));
      const allPaid = rows.every((r) => r.paid >= r.net);
      return { ...x, rows, status: allPaid ? 'paid' : 'partly-paid', history: [...x.history, entry(`${allPaid ? 'Paid in full' : 'Partly paid'} · ${made.length} staff · ${formatBDT(made.reduce((s, m) => s + m.amount, 0))}`, 'success')] };
    }));
    addAudit('Payroll', 'Salaries paid', `${sheetId} · ${made.length} staff · ${formatBDT(made.reduce((s, m) => s + m.amount, 0))}`);
    return made.length;
  };

  // ---------- Ledger ----------
  /** Balance > 0 → the school owes the person; < 0 → the person owes the school (advance outstanding). */
  const staffLedger = useCallback((staffId: string): LedgerRow[] => {
    const raw: Array<Omit<LedgerRow, 'balance'>> = [];
    sheets.filter((sh) => ['approved', 'partly-paid', 'paid'].includes(sh.status)).forEach((sh) => {
      const r = sh.rows.find((x) => x.staffId === staffId);
      if (!r) return;
      const earned = r.net + r.advanceRecovery;
      const parts = [r.leaveDeduction ? `leave −${formatBDT(r.leaveDeduction)}` : '', r.otherDeductions ? `PF/tax −${formatBDT(r.otherDeductions)}` : '', r.bonus ? `bonus +${formatBDT(r.bonus)}` : '', r.advanceRecovery ? `${formatBDT(r.advanceRecovery)} recovers advance` : ''].filter(Boolean);
      raw.push({ id: `${sh.id}-${staffId}`, date: `${sh.month}-${String(new Date(Number(sh.month.slice(0, 4)), Number(sh.month.slice(5)), 0).getDate()).padStart(2, '0')}`, ref: sh.id, description: `Salary ${monthLabel(sh.month)}`, tag: 'Salary', sub: parts.join(' · ') || `Gross ${formatBDT(r.gross)}`, debit: 0, credit: earned });
    });
    payments.filter((p) => p.staffId === staffId).forEach((p) => raw.push({ id: p.id, date: p.date, ref: p.voucher, description: `Salary paid · ${fin.accountName(p.accountId)}`, tag: 'Payment', sub: p.txnId ? p.method : `${p.method} · before ledger opening`, debit: p.amount, credit: 0 }));
    advances.filter((a) => a.staffId === staffId).forEach((a) => {
      const info = advanceInfo(a);
      if (info.state === 'pending' || info.state === 'cancelled') return;
      raw.push({ id: a.id, date: a.date, ref: info.voucher ?? a.id, description: `Advance given${a.note ? ` · ${a.note}` : ''}`, tag: 'Advance', sub: `${a.installments} × ${formatBDT(a.perMonth)}`, debit: a.amount, credit: 0 });
      a.recoveries.filter((r) => !r.ref.startsWith('SAL-')).forEach((r, i) => raw.push({ id: `${a.id}-r${i}`, date: `${r.month}-15`, ref: r.ref, description: `Advance repaid in cash · ${a.id}`, tag: 'Repayment', debit: 0, credit: r.amount }));
    });
    raw.sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    return raw.map((r) => {bal += r.credit - r.debit;return { ...r, balance: bal };});
  }, [sheets, payments, advances, advanceInfo, fin]);

  const staffBalance = useCallback((staffId: string) => {
    const rows = staffLedger(staffId);
    return rows.length ? rows[rows.length - 1].balance : 0;
  }, [staffLedger]);

  const pendingSheets = sheets.filter((x) => x.status === 'submitted');

  return {
    actor, canPrepare, canApprove, sheets, payments, advances, pendingSheets,
    advanceInfo, activeAdvances, outstandingAdvance, giveAdvance, repayAdvance,
    generate, updateRow, removeRow, deleteDraft, submit, decide, pay,
    staffLedger, staffBalance
  };
}

export type PayrollStore = ReturnType<typeof usePayrollStore>;
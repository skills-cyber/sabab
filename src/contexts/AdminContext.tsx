import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { Student } from '../types/school';
import type { AuditEntry, FeeHead, Invoice, Message, Payment, PaymentMethod } from '../types/finance';
import type { Tenant } from '../types/saas';
import { students as seedStudents } from '../data/students';
import { feeHeads as seedHeads } from '../data/fees';
import { messages as seedMessages, auditLog as seedAudit } from '../data/communication';
import { tenants as seedTenants } from '../data/saas';
import { buildInitialLedger, buildInvoiceLines, invoiceBalance } from '../utils/fees';
import { TODAY, formatDate } from '../utils/format';
import { useApp } from './AppContext';
import type { Concession } from '../types/concessions';
import { CONCESSION_APPROVAL_LIMIT, CONCESSION_LABEL } from '../types/concessions';
import { concessions as seedConcessions } from '../data/concessions';
import { concessionActiveIn, concessionAmount, periodToMonth, tuitionFor } from '../utils/concessions';
import { withTransportFees } from '../utils/transportFees';
import { buildFamilies, previousYearDue, syncSiblings } from '../utils/family';
import { useFamilyStore, type FamilyStore } from '../hooks/useFamilyStore';
import { useYearRollover, type RolloverInput, type RolloverSummary } from '../hooks/useYearRollover';

type ConcessionDraft = Pick<Concession, 'studentId' | 'type' | 'basis' | 'value' | 'from' | 'to' | 'reason' | 'applyCurrent'>;

interface DayClose {
  at: string;
  expectedCash: number;
  countedCash: number;
  note: string;
}

interface AdminContextValue {
  students: Student[];
  updateStudent: (id: string, patch: Partial<Student>, auditAction?: string) => void;
  addStudent: (s: Student) => void;
  feeHeads: FeeHead[];
  updateFeeAmount: (headId: string, grade: string, amount: number) => void;
  invoices: Invoice[];
  payments: Payment[];
  collect: (studentId: string, amount: number, method: PaymentMethod, reference?: string, accountId?: string) => string;
  reverseReceipt: (receiptNo: string, reason: string) => void;
  applyDiscount: (invoiceId: string, amount: number, note: string) => void;
  generateInvoices: (period: string, sectionIds: string[]) => number;
  dayClose: DayClose | null;
  closeDay: (expectedCash: number, countedCash: number, note: string) => void;
  messages: Message[];
  queueMessage: (m: Pick<Message, 'channel' | 'audience' | 'recipients' | 'template' | 'body' | 'credits'>) => void;
  audit: AuditEntry[];
  addAudit: (module: string, action: string, target: string, severity?: AuditEntry['severity']) => void;
  tenants: Tenant[];
  updateTenant: (id: string, patch: Partial<Tenant>, action?: string) => void;
  concessions: Concession[];
  canApproveConcession: boolean;
  addConcession: (d: ConcessionDraft) => {id: string;pending: boolean;};
  decideConcession: (id: string, approve: boolean, note?: string) => void;
  endConcession: (id: string, lastMonth: string, reason: string) => void;
  /** Families (households). */
  families: FamilyStore['families'];
  familyStore: FamilyStore;
  /** Current academic year, e.g. '2026'. */
  currentYear: string;
  previousYearDueFor: (studentIds: string[]) => number;
  rollover: (input: RolloverInput) => RolloverSummary;
  undoRollover: () => void;
  lastRollover: RolloverSummary | null;
  /** Undo is possible until the first invoice of the new year exists. */
  canUndoRollover: boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);
const seedLedger = buildInitialLedger(seedStudents, seedHeads);
const seedHouseholds = buildFamilies(withTransportFees(seedStudents));
const stamp = () => `${formatDate(TODAY)} · ${format(new Date(), 'HH:mm')}`;

export function AdminProvider({ children }: {children: React.ReactNode;}) {
  const { roleInfo, role, setYear } = useApp();
  const actor = roleInfo.user;
  const canApproveConcession = role === 'owner' || role === 'principal';
  const [concessions, setConcessions] = useState<Concession[]>(seedConcessions);
  const [students, setStudents] = useState<Student[]>(seedHouseholds.students);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>(seedHeads);
  const [invoices, setInvoices] = useState<Invoice[]>(seedLedger.invoices);
  const [payments, setPayments] = useState<Payment[]>(seedLedger.payments);
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants);
  const [dayClose, setDayClose] = useState<DayClose | null>(null);

  const addAudit = useCallback((module: string, action: string, target: string, severity: AuditEntry['severity'] = 'info') => {
    setAudit((a) => [{ id: `AU-${9100 + a.length}`, at: stamp(), actor, module, action, target, severity }, ...a]);
  }, [actor]);

  const updateStudent = useCallback((id: string, patch: Partial<Student>, auditAction?: string) => {
    setStudents((list) => list.map((s) => s.id === id ? { ...s, ...patch } : s));
    if (auditAction) addAudit('Students', auditAction, id);
  }, [addAudit]);

  const familyStore = useFamilyStore({ initial: seedHouseholds.families, students, setStudents, addAudit, actor, stamp });
  const year = useYearRollover({ students, setStudents, addAudit, setAppYear: setYear, stamp, actor });

  /** New students join the family with the same guardian phone, or start a new family. */
  const addStudent = useCallback((s: Student) => {
    const fam = familyStore.resolveFamilyFor(s);
    setStudents((list) => syncSiblings([{ ...s, ...fam.patch, familyId: fam.familyId }, ...list]));
    addAudit('Students', 'Student created', `${s.name} (${s.studentNo}) · ${fam.existing ? 'joined' : 'new'} ${fam.familyId}`);
  }, [addAudit, familyStore]);

  const previousYearDueFor = useCallback((ids: string[]) => previousYearDue(ids, invoices, year.currentYear), [invoices, year.currentYear]);
  const canUndoRollover = year.hasSnapshot && !invoices.some((i) => i.academicYear === year.currentYear);

  const updateFeeAmount = useCallback((headId: string, grade: string, amount: number) => {
    setFeeHeads((h) => h.map((x) => x.id === headId ? { ...x, amounts: { ...x.amounts, [grade]: amount } } : x));
    addAudit('Fees', 'Fee structure changed', `${headId} · Class ${grade} → ৳${amount}`, 'warning');
  }, [addAudit]);

  const collect = useCallback((studentId: string, amount: number, method: PaymentMethod, reference?: string, accountId?: string) => {
    const receiptNo = `RC-26-0${5000 + Math.floor(Math.random() * 900)}`;
    const time = format(new Date(), 'HH:mm');
    let remaining = amount;
    const open = invoices.filter((i) => i.studentId === studentId && invoiceBalance(i) > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const newPayments: Payment[] = [];
    const allocations: Record<string, number> = {};
    open.forEach((inv) => {
      if (remaining <= 0) return;
      const take = Math.min(remaining, invoiceBalance(inv));
      allocations[inv.id] = take;
      remaining -= take;
      newPayments.push({ id: `PM-${Math.random().toString(36).slice(2, 8)}`, receiptNo, invoiceId: inv.id, studentId, amount: take, method, reference, date: TODAY, time, collectedBy: actor, status: 'posted', accountId });
    });
    setInvoices((list) => list.map((i) => allocations[i.id] ? { ...i, paid: i.paid + allocations[i.id] } : i));
    setPayments((p) => [...newPayments, ...p]);
    addAudit('Fees', 'Payment posted', `${receiptNo} · ৳${amount} · ${method}`);
    return receiptNo;
  }, [invoices, actor, addAudit]);

  const reverseReceipt = useCallback((receiptNo: string, reason: string) => {
    const affected = payments.filter((p) => p.receiptNo === receiptNo && p.status === 'posted');
    setPayments((list) => list.map((p) => p.receiptNo === receiptNo ? { ...p, status: 'reversed', reversalReason: reason } : p));
    setInvoices((list) => list.map((i) => {
      const amt = affected.filter((p) => p.invoiceId === i.id).reduce((s, p) => s + p.amount, 0);
      return amt ? { ...i, paid: i.paid - amt } : i;
    }));
    addAudit('Fees', 'Receipt reversed', `${receiptNo} · ${reason}`, 'warning');
  }, [payments, addAudit]);

  const applyDiscount = useCallback((invoiceId: string, amount: number, note: string) => {
    setInvoices((list) => list.map((i) => i.id === invoiceId ? { ...i, discount: i.discount + amount, discountNote: [i.discountNote, note].filter(Boolean).join('; ') } : i));
    addAudit('Fees', 'Concession applied', `${invoiceId} · ৳${amount} · ${note}`, 'warning');
  }, [addAudit]);

  const generateInvoices = useCallback((period: string, sectionIds: string[]) => {
    const targets = students.filter((s) => s.status === 'active' && sectionIds.includes(s.sectionId) && !invoices.some((i) => i.studentId === s.id && i.period === period));
    const month = periodToMonth(period);
    const created: Invoice[] = targets.map((s) => {
      const tuition = tuitionFor(s, feeHeads);
      const active = concessions.filter((c) => c.studentId === s.id && month && concessionActiveIn(c, month));
      const discount = Math.min(tuition, active.reduce((t, c) => t + concessionAmount(c, tuition), 0));
      return {
        id: `INV-${period.slice(0, 3).toUpperCase()}${period.slice(-2)}-${s.studentNo.slice(-4)}`, studentId: s.id, period, issuedOn: TODAY, dueDate: month ? `${month}-10` : TODAY,
        lines: buildInvoiceLines(s, feeHeads, period), discount,
        discountNote: active.length ? active.map((c) => `${CONCESSION_LABEL[c.type]} ${c.basis === 'percent' ? `${c.value}%` : `৳${c.value}`} (${c.id})`).join('; ') : undefined,
        paid: 0, academicYear: year.currentYear
      };
    });
    setInvoices((list) => [...created, ...list]);
    if (created.length) addAudit('Fees', 'Dues generated', `${period} · ${created.length} invoices`);
    return created.length;
  }, [students, invoices, feeHeads, concessions, addAudit, year.currentYear]);

  /** Discounts the student's oldest unpaid invoice by one month of the concession. */
  const applyToOpenInvoice = useCallback((c: Concession) => {
    const s = students.find((x) => x.id === c.studentId);
    const inv = invoices.filter((i) => i.studentId === c.studentId && invoiceBalance(i) > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    if (!s || !inv) return;
    const amt = Math.min(invoiceBalance(inv), concessionAmount(c, tuitionFor(s, feeHeads)));
    if (amt <= 0) return;
    setInvoices((list) => list.map((i) => i.id === inv.id ? { ...i, discount: i.discount + amt, discountNote: [i.discountNote, `${CONCESSION_LABEL[c.type]} (${c.id})`].filter(Boolean).join('; ') } : i));
  }, [students, invoices, feeHeads]);

  const addConcession = useCallback((d: ConcessionDraft) => {
    const id = `CN-${101 + concessions.length}`;
    const s = students.find((x) => x.id === d.studentId);
    const monthly = concessionAmount(d, tuitionFor(s, feeHeads));
    const pending = monthly > CONCESSION_APPROVAL_LIMIT && !canApproveConcession;
    const c: Concession = {
      ...d, id, status: pending ? 'pending' : 'approved', requestedBy: actor,
      history: [{ at: stamp(), actor, action: 'Requested', tone: 'info' }, ...(pending ? [] : [{ at: stamp(), actor, action: canApproveConcession ? 'Approved' : 'Auto-approved (under limit)', tone: 'success' as const }])]
    };
    setConcessions((l) => [c, ...l]);
    if (!pending && d.applyCurrent) applyToOpenInvoice(c);
    addAudit('Fees', pending ? 'Concession requested' : 'Concession granted', `${id} · ${d.studentId} · ৳${monthly}/month`, 'warning');
    return { id, pending };
  }, [concessions.length, students, feeHeads, canApproveConcession, actor, applyToOpenInvoice, addAudit]);

  const decideConcession = useCallback((id: string, approve: boolean, note = '') => {
    const c = concessions.find((x) => x.id === id);
    setConcessions((l) => l.map((x) => x.id === id ? { ...x, status: approve ? 'approved' : 'rejected', history: [...x.history, { at: stamp(), actor, action: approve ? 'Approved' : 'Rejected', tone: approve ? 'success' : 'danger', note: note || undefined }] } : x));
    if (approve && c?.applyCurrent) applyToOpenInvoice(c);
    addAudit('Fees', approve ? 'Concession approved' : 'Concession rejected', `${id}${note ? ` · ${note}` : ''}`, 'warning');
  }, [concessions, actor, applyToOpenInvoice, addAudit]);

  const endConcession = useCallback((id: string, lastMonth: string, reason: string) => {
    setConcessions((l) => l.map((x) => x.id === id ? { ...x, status: 'ended', to: lastMonth, history: [...x.history, { at: stamp(), actor, action: `Ended after ${lastMonth}`, tone: 'warning', note: reason }] } : x));
    addAudit('Fees', 'Concession ended', `${id} · ${reason}`, 'warning');
  }, [actor, addAudit]);

  const closeDay = useCallback((expectedCash: number, countedCash: number, note: string) => {
    setDayClose({ at: stamp(), expectedCash, countedCash, note });
    addAudit('Fees', 'Daily close', `Expected ৳${expectedCash} · counted ৳${countedCash}`, expectedCash === countedCash ? 'info' : 'warning');
  }, [addAudit]);

  const queueMessage = useCallback((m: Pick<Message, 'channel' | 'audience' | 'recipients' | 'template' | 'body' | 'credits'>) => {
    const id = `MSG-${2300 + Math.floor(Math.random() * 600)}`;
    setMessages((list) => [{ ...m, id, sentAt: stamp(), sentBy: actor, status: 'queued', delivered: 0, failed: 0 }, ...list]);
    window.setTimeout(() => setMessages((list) => list.map((x) => x.id === id ? { ...x, status: 'sent' } : x)), 1200);
    window.setTimeout(() => setMessages((list) => list.map((x) => x.id === id ? { ...x, status: 'delivered', delivered: x.recipients } : x)), 3200);
  }, [actor]);

  const updateTenant = useCallback((id: string, patch: Partial<Tenant>, action?: string) => {
    setTenants((list) => list.map((t) => t.id === id ? { ...t, ...patch } : t));
    if (action) addAudit('Platform', action, id, 'warning');
  }, [addAudit]);

  const value = useMemo<AdminContextValue>(() => ({
    students, updateStudent, addStudent, feeHeads, updateFeeAmount, invoices, payments, collect, reverseReceipt, applyDiscount, generateInvoices,
    dayClose, closeDay, messages, queueMessage, audit, addAudit, tenants, updateTenant,
    concessions, canApproveConcession, addConcession, decideConcession, endConcession,
    families: familyStore.families, familyStore, currentYear: year.currentYear, previousYearDueFor,
    rollover: year.rollover, undoRollover: year.undoRollover, lastRollover: year.lastRollover, canUndoRollover
  }), [students, updateStudent, addStudent, feeHeads, updateFeeAmount, invoices, payments, collect, reverseReceipt, applyDiscount, generateInvoices, dayClose, closeDay, messages, queueMessage, audit, addAudit, tenants, updateTenant, concessions, canApproveConcession, addConcession, decideConcession, endConcession, familyStore, year, previousYearDueFor, canUndoRollover]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
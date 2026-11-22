import type { FeeHead, Invoice, InvoiceStatus, Payment, PaymentMethod } from '../types/finance';
import type { Student } from '../types/school';
import { sections } from '../data/school';
import { TODAY } from './format';

export function gradeOf(sectionId: string): number {
  return sections.find((s) => s.id === sectionId)?.grade ?? (parseInt(sectionId, 10) || 8);
}

export function invoiceTotal(inv: Invoice): number {
  return inv.lines.reduce((s, l) => s + l.amount, 0) - inv.discount;
}

export function invoiceBalance(inv: Invoice): number {
  return Math.max(0, invoiceTotal(inv) - inv.paid);
}

export function invoiceStatus(inv: Invoice): InvoiceStatus {
  const bal = invoiceBalance(inv);
  if (bal <= 0) return 'paid';
  if (inv.dueDate < TODAY) return 'overdue';
  return inv.paid > 0 ? 'partial' : 'unpaid';
}

export function buildInvoiceLines(student: Student, heads: FeeHead[], period: 'Oct 2026' | 'Nov 2026' | string): Invoice['lines'] {
  const g = String(gradeOf(student.sectionId));
  const get = (id: string) => heads.find((h) => h.id === id);
  const lines: Invoice['lines'] = [];
  const tui = get('TUI');
  if (tui) lines.push({ headId: 'TUI', label: `Tuition fee · ${period}`, amount: tui.amounts[g] ?? 0 });
  const ict = get('ICT');
  if (ict && (ict.amounts[g] ?? 0) > 0) lines.push({ headId: 'ICT', label: 'ICT lab fee', amount: ict.amounts[g] });
  const trn = get('TRN');
  if (student.transport && (student.transportFee || trn)) {
    lines.push({ headId: 'TRN', label: student.transportLabel ?? 'Transport', amount: student.transportFee ?? trn?.amounts[g] ?? 1500 });
  }
  if (period.startsWith('Nov')) {
    const exm = get('EXM');
    if (exm) lines.push({ headId: 'EXM', label: 'Annual exam fee', amount: exm.amounts[g] ?? 0 });
  }
  return lines;
}

function discountFor(student: Student, lines: Invoice['lines']): {discount: number;note?: string;} {
  const tuition = lines.find((l) => l.headId === 'TUI')?.amount ?? 0;
  if (student.remarks.includes('Scholarship')) return { discount: Math.round(tuition * 0.5), note: 'Merit scholarship 50% (tuition)' };
  if (student.siblingIds.length && student.id === 'S8A07') return { discount: Math.round(tuition * 0.1), note: 'Sibling discount 10% (tuition)' };
  return { discount: 0 };
}

const METHODS: PaymentMethod[] = ['Cash', 'bKash', 'Cash', 'Bank', 'Nagad'];

/** Seeds a deterministic, internally consistent ledger for the sample school. */
export function buildInitialLedger(students: Student[], heads: FeeHead[]): {invoices: Invoice[];payments: Payment[];} {
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  let receipt = 4100;
  const billable = students.filter((s) => s.status === 'active' && s.campusId === 'mirpur');

  const pay = (inv: Invoice, amount: number, i: number, date: string, time: string) => {
    if (amount <= 0) return;
    const method = METHODS[i % METHODS.length];
    receipt += 1;
    payments.push({
      id: `PM-${receipt}`, receiptNo: `RC-26-0${receipt}`, invoiceId: inv.id, studentId: inv.studentId, amount, method,
      reference: method === 'Cash' ? undefined : `${method === 'Bank' ? 'DBBL' : 'TRX'}${(800000 + receipt * 37).toString(36).toUpperCase()}`,
      date, time, collectedBy: 'Mizanur Rahman', status: 'posted'
    });
    inv.paid += amount;
  };

  billable.forEach((s, i) => {
    (['Oct 2026', 'Nov 2026'] as const).forEach((period) => {
      const lines = buildInvoiceLines(s, heads, period);
      const { discount, note } = discountFor(s, lines);
      const inv: Invoice = {
        id: `INV-${period.startsWith('Oct') ? '10' : '11'}-${s.studentNo.slice(-4)}`,
        studentId: s.id, period, issuedOn: period.startsWith('Oct') ? '2026-10-01' : '2026-11-01',
        dueDate: period.startsWith('Oct') ? '2026-10-10' : '2026-11-10', lines, discount, discountNote: note, paid: 0
      };
      const total = invoiceTotal(inv);
      if (period.startsWith('Oct')) {
        if (s.id === 'S8A07') pay(inv, total, i, '2026-10-08', '11:20');else
        if (i % 6 === 3) {/* overdue */} else
        if (i % 9 === 5) pay(inv, Math.round(total / 200) * 100, i, '2026-10-09', '12:05');else
        pay(inv, total, i, `2026-10-0${i % 8 + 2}`, '10:15');
      } else {
        if (s.id === 'S8A07') {/* unpaid — guardian demo */} else
        if (s.id === 'S4B01') pay(inv, 1500, i, '2026-11-01', '13:10');else
        if (i % 4 === 0) pay(inv, total, i, i % 8 === 0 ? '2026-11-02' : '2026-11-01', i % 8 === 0 ? '09:3' + i % 10 : '14:2' + i % 10);else
        if (i % 4 === 1) pay(inv, Math.round(total / 200) * 100, i, '2026-11-02', '09:5' + i % 10);
      }
      invoices.push(inv);
    });
  });
  return { invoices, payments };
}
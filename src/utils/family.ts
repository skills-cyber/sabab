import type { Family } from '../types/family';
import type { Invoice, Payment } from '../types/finance';
import type { LedgerRow } from '../types/payroll';
import type { Student } from '../types/school';
import { familyDetails } from '../data/families';
import { invoiceBalance, invoiceTotal } from './fees';
import { sectionLabel } from './timetable';

export const normalizePhone = (p: string) => p.replace(/\D/g, '');

export const familyIdFor = (n: number) => `FAM-${String(n).padStart(4, '0')}`;

/** Highest FAM-#### number in use. */
export const maxFamilyNo = (families: Family[]) => Math.max(0, ...families.map((f) => Number(f.id.slice(4)) || 0));

/** Guardian fields every child of a family mirrors. */
export function guardianPatch(f: Family): Partial<Student> {
  return { guardianName: f.guardianName, guardianRelation: f.relation, guardianPhone: f.phone, guardianVerified: f.verified, smsOptIn: f.smsOptIn };
}

/** Sibling links are derived from the family — recompute after any membership change. */
export function syncSiblings(list: Student[]): Student[] {
  const byFamily = new Map<string, string[]>();
  list.forEach((s) => {if (s.familyId) byFamily.set(s.familyId, [...(byFamily.get(s.familyId) ?? []), s.id]);});
  return list.map((s) => {
    const ids = s.familyId ? (byFamily.get(s.familyId) ?? []).filter((id) => id !== s.id) : [];
    return ids.join() === s.siblingIds.join() ? s : { ...s, siblingIds: ids };
  });
}

export function familyFromStudent(s: Pick<Student, 'guardianName' | 'guardianRelation' | 'guardianPhone' | 'guardianVerified' | 'smsOptIn'>, id: string, action: string, at: string, actor: string): Family {
  return {
    id, guardianName: s.guardianName, relation: s.guardianRelation, phone: s.guardianPhone, verified: s.guardianVerified, smsOptIn: s.smsOptIn,
    portalEnabled: false, history: [{ at, actor, action, tone: 'info' }]
  };
}

/** Groups existing students into households by guardian phone (one-time migration of per-student guardian fields). */
export function buildFamilies(students: Student[]): {families: Family[];students: Student[];} {
  const families: Family[] = [];
  const byPhone = new Map<string, string>();
  const linked = students.map((s) => {
    const key = normalizePhone(s.guardianPhone);
    let id = byPhone.get(key);
    if (!id) {
      id = familyIdFor(families.length + 1);
      byPhone.set(key, id);
      const extra = familyDetails.find((d) => normalizePhone(d.phone) === key);
      families.push({
        ...familyFromStudent(s, id, 'Family created from guardian records', '01 Nov 2026 · 00:00', 'System'),
        portalEnabled: s.guardianVerified,
        ...extra,
        phone: s.guardianPhone
      });
    }
    return { ...s, familyId: id };
  });
  return { families, students: syncSiblings(linked) };
}

export const childrenOf = (familyId: string, students: Student[]) => students.filter((s) => s.familyId === familyId);

/** Invoices from academic years before the current one that are still unpaid. */
export const isPreviousYear = (inv: Invoice, currentYear: string) => (inv.academicYear ?? '2026') < currentYear;

export function previousYearDue(studentIds: string[], invoices: Invoice[], currentYear: string): number {
  return invoices.filter((i) => studentIds.includes(i.studentId) && isPreviousYear(i, currentYear)).reduce((t, i) => t + invoiceBalance(i), 0);
}

/** Combined running ledger for every child of a family: invoices (debit), receipts and discounts (credit). */
export function familyLedger(children: Student[], invoices: Invoice[], payments: Payment[], currentYear: string): LedgerRow[] {
  const ids = children.map((c) => c.id);
  const name = (id: string) => children.find((c) => c.id === id)?.name.split(' ')[0] ?? id;
  const cls = (id: string) => {const c = children.find((x) => x.id === id);return c ? sectionLabel(c.sectionId) : '';};
  const raw: Omit<LedgerRow, 'balance'>[] = [];
  invoices.filter((i) => ids.includes(i.studentId)).forEach((i) => {
    const prev = isPreviousYear(i, currentYear);
    raw.push({ id: `inv-${i.id}`, date: i.issuedOn, ref: i.id, description: `${name(i.studentId)} · ${i.period}`, tag: prev ? 'Previous year' : 'Invoice', sub: cls(i.studentId), debit: invoiceTotal(i) + i.discount, credit: 0 });
    if (i.discount > 0) raw.push({ id: `dis-${i.id}`, date: i.issuedOn, ref: i.id, description: `${name(i.studentId)} · concession`, tag: 'Concession', sub: i.discountNote, debit: 0, credit: i.discount });
  });
  const receipts = new Map<string, Omit<LedgerRow, 'balance'>>();
  payments.filter((p) => ids.includes(p.studentId) && p.status === 'posted').forEach((p) => {
    const cur = receipts.get(p.receiptNo);
    if (cur) {cur.credit += p.amount;return;}
    receipts.set(p.receiptNo, { id: `rc-${p.receiptNo}`, date: p.date, ref: p.receiptNo, description: `${name(p.studentId)} · payment`, tag: 'Receipt', sub: p.method, debit: 0, credit: p.amount });
  });
  raw.push(...receipts.values());
  raw.sort((a, b) => a.date.localeCompare(b.date) || (a.debit ? -1 : 1));
  let bal = 0;
  return raw.map((r) => {bal += r.debit - r.credit;return { ...r, balance: bal };});
}
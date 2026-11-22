import { useCallback, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import { DEFAULT_APPROVAL_LIMIT, SYSTEM_CATEGORY, bills as seedBills, categories as seedCategories, finAccounts as seedAccounts, parties as seedParties, transactions as seedTxns } from '../../data/accounts';
import type { Bill, Category, FinAccount, LedgerLine, Party, Txn, TxnKind } from '../../types/accounts';
import type { LedgerRow } from '../../types/payroll';
import type { TimelineEntry } from '../../types/academic';
import type { Payment } from '../../types/finance';
import { TODAY, formatBDT, nowStamp } from '../../utils/format';

export const CURRENT_MONTH = TODAY.slice(0, 7);

/** Masked account number — the UI never shows the full number. */
export const maskNumber = (n?: string) => n ? `••••${n.replace(/\D/g, '').slice(-4)}` : '';

export type TxnDraft = Pick<Txn, 'kind' | 'date' | 'accountId' | 'amount'> & Partial<Pick<Txn, 'toAccountId' | 'direction' | 'categoryId' | 'partyId' | 'method' | 'reference' | 'note' | 'attachment' | 'reconcileDate' | 'settles' | 'billId'>>;

const PREFIX: Record<TxnKind, string> = { income: 'RV', expense: 'PV', transfer: 'TV', adjustment: 'JV' };

/** Signed effect of a posted transaction on each account it touches. */
export function txnEffects(t: Txn): Array<{accountId: string;delta: number;}> {
  if (t.kind === 'income') return [{ accountId: t.accountId, delta: t.amount }];
  if (t.kind === 'expense') return [{ accountId: t.accountId, delta: -t.amount }];
  if (t.kind === 'adjustment') return [{ accountId: t.accountId, delta: t.direction === 'out' ? -t.amount : t.amount }];
  return [{ accountId: t.accountId, delta: -t.amount }, { accountId: t.toAccountId ?? '', delta: t.amount }];
}

/**
 * Accounts & Finance store — frontend contract for future /accounts APIs:
 * accounts, transactions (income/expense/transfer/adjustment), parties, categories, approvals.
 * Fee receipts come from AdminContext and are read-only here.
 */
export function useAccountsStore() {
  const { payments, students, addAudit } = useAdmin();
  const { role, roleInfo } = useApp();
  const actor = roleInfo.user;
  const [accounts, setAccounts] = useState<FinAccount[]>(seedAccounts);
  const [txns, setTxns] = useState<Txn[]>(seedTxns);
  const [parties, setParties] = useState<Party[]>(seedParties);
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [approvalLimit, setLimit] = useState(DEFAULT_APPROVAL_LIMIT);
  const [bills, setBills] = useState<Bill[]>(seedBills);
  const seq = useRef(0);

  const canRecord = role === 'accountant' || role === 'owner';
  const canApprove = role === 'owner' || role === 'principal';

  const entry = useCallback((action: string, tone?: TimelineEntry['tone'], note?: string): TimelineEntry => ({ at: nowStamp(), actor, action, tone, note }), [actor]);

  /** Fee receipts land in the chosen account, else the campus cash / merchant wallet / main bank. */
  const feeAccountFor = useCallback((p: Payment) => {
    if (p.accountId) return p.accountId;
    if (p.method === 'bKash') return 'bkash';
    if (p.method === 'Nagad') return 'nagad';
    if (p.method === 'Bank') return 'dbbl';
    const campus = students.find((s) => s.id === p.studentId)?.campusId ?? 'mirpur';
    return `cash-${campus}`;
  }, [students]);

  const lines = useMemo<LedgerLine[]>(() => {
    const receipts = new Map<string, LedgerLine>();
    payments.forEach((p) => {
      const cur = receipts.get(p.receiptNo);
      if (cur) {
        cur.amount += p.amount;
        return;
      }
      const s = students.find((x) => x.id === p.studentId);
      receipts.set(p.receiptNo, {
        id: `fee-${p.receiptNo}`, source: 'fee', date: p.date, kind: 'fee', accountId: feeAccountFor(p), label: `Fee collection · ${s?.name ?? p.studentId}`,
        categoryId: SYSTEM_CATEGORY.fees, ref: p.receiptNo, amount: p.amount, status: p.status === 'reversed' ? 'reversed' : 'posted', note: p.reversalReason
      });
    });
    const fees = txns.reduce<Record<string, number>>((m, t) => t.pairId ? { ...m, [t.pairId]: t.amount } : m, {});
    const fromTxns = txns.map<LedgerLine>((t) => ({
      id: t.id, txnId: t.id, source: 'txn', date: t.date, kind: t.kind, accountId: t.accountId, toAccountId: t.toAccountId,
      label: t.kind === 'transfer' ? 'Transfer' : t.kind === 'adjustment' ? `Reconciliation adjustment (${t.direction === 'out' ? 'short' : 'excess'})` : categories.find((c) => c.id === t.categoryId)?.name ?? 'Uncategorised',
      categoryId: t.kind === 'adjustment' ? SYSTEM_CATEGORY.adjustment : t.categoryId, partyId: t.partyId, ref: t.voucher, amount: t.amount, fee: fees[t.id], status: t.status, note: t.note
    }));
    return [...receipts.values(), ...fromTxns].sort((a, b) => b.date.localeCompare(a.date) || b.ref.localeCompare(a.ref));
  }, [payments, students, txns, categories, feeAccountFor]);

  const balanceOf = useCallback((accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    let inflow = 0;
    let outflow = 0;
    payments.forEach((p) => {
      if (p.status === 'posted' && feeAccountFor(p) === accountId) inflow += p.amount;
    });
    txns.forEach((t) => {
      if (t.status !== 'posted') return;
      txnEffects(t).forEach((e) => {
        if (e.accountId !== accountId) return;
        if (e.delta > 0) inflow += e.delta;else
        outflow -= e.delta;
      });
    });
    const opening = acc?.opening ?? 0;
    return { opening, inflow, outflow, balance: opening + inflow - outflow };
  }, [accounts, payments, txns, feeAccountFor]);

  const accountName = useCallback((id?: string) => accounts.find((a) => a.id === id)?.name ?? '—', [accounts]);
  const categoryName = useCallback((id?: string) => categories.find((c) => c.id === id)?.name ?? '—', [categories]);
  const partyName = useCallback((id?: string) => parties.find((p) => p.id === id)?.name ?? '', [parties]);

  const needsApproval = useCallback((kind: TxnKind, amount: number) => kind === 'adjustment' || amount >= approvalLimit, [approvalLimit]);

  /** Spend in the current month per expense category (posted + pending, so warnings anticipate approval). */
  const spendThisMonth = useCallback((categoryId: string, includePending = false) =>
  txns.filter((t) => t.kind === 'expense' && t.categoryId === categoryId && t.date.startsWith(CURRENT_MONTH) && (t.status === 'posted' || includePending && t.status === 'pending-approval')).reduce((s, t) => s + t.amount, 0),
  [txns]);

  const nextId = (kind: TxnKind) => {
    seq.current += 1;
    const base = kind === 'income' ? 2041 : kind === 'expense' ? 3108 : kind === 'transfer' ? 5012 : 7000;
    const n = base + txns.filter((t) => t.kind === kind && !t.pairId).length + seq.current;
    return { id: `TX-${n}`, voucher: `${PREFIX[kind]}-${n}` };
  };

  // ---------- Transactions ----------
  /** `preApproved` is used when the amount was already approved upstream (e.g. an approved salary sheet). */
  const record = (d: TxnDraft & {fee?: number;}, opts: {preApproved?: boolean;} = {}) => {
    const { id, voucher } = nextId(d.kind);
    const pending = !opts.preApproved && needsApproval(d.kind, d.amount);
    const label = pending ? 'Submitted for approval' : 'Posted';
    const main: Txn = { ...d, id, voucher, status: pending ? 'pending-approval' : 'posted', createdBy: actor, history: [entry(label, pending ? 'info' : 'success')] };
    const list: Txn[] = [main];
    if (d.kind === 'transfer' && d.fee && d.fee > 0) {
      list.push({ id: `${id}F`, voucher: `PV-${id.slice(3)}F`, date: d.date, kind: 'expense', accountId: d.accountId, amount: d.fee, categoryId: SYSTEM_CATEGORY.bankCharges, method: d.method, note: `Transfer fee · ${voucher}`, pairId: id, status: main.status, createdBy: actor, history: [entry('Fee recorded with transfer')] });
    }
    setTxns((l) => [...list, ...l]);
    if (d.kind === 'adjustment' && d.reconcileDate && !pending) setAccounts((l) => l.map((a) => a.id === d.accountId ? { ...a, reconciledTo: d.reconcileDate } : a));
    addAudit('Accounts', `${d.kind[0].toUpperCase()}${d.kind.slice(1)} ${pending ? 'submitted for approval' : 'posted'}`, `${voucher} · ${formatBDT(d.amount)}`);
    return { id, voucher, pending };
  };

  /** Applies a status change to a transaction and its paired fee entry together. */
  const setGroup = (id: string, patch: (t: Txn) => Partial<Txn>) =>
  setTxns((l) => l.map((t) => t.id === id || t.pairId === id ? { ...t, ...patch(t) } : t));

  const approve = (ids: string[], note = '') => {
    ids.forEach((id) => {
      const t = txns.find((x) => x.id === id);
      setGroup(id, (x) => ({ status: 'posted', history: [...x.history, entry('Approved & posted', 'success', note || undefined)] }));
      if (t?.kind === 'adjustment' && t.reconcileDate) setAccounts((l) => l.map((a) => a.id === t.accountId ? { ...a, reconciledTo: t.reconcileDate } : a));
    });
    addAudit('Accounts', ids.length > 1 ? 'Entries approved' : 'Entry approved', ids.length > 1 ? `${ids.length} entries` : txns.find((t) => t.id === ids[0])?.voucher ?? ids[0]);
  };

  const returnTxn = (id: string, note: string) => {
    setGroup(id, (x) => ({ status: 'returned', history: [...x.history, entry('Returned', 'warning', note)] }));
    addAudit('Accounts', 'Entry returned', `${txns.find((t) => t.id === id)?.voucher} · ${note}`, 'warning');
  };

  const reverse = (id: string, reason: string) => {
    setGroup(id, (x) => ({ status: 'reversed', history: [...x.history, entry('Reversed', 'danger', reason)] }));
    addAudit('Accounts', 'Entry reversed', `${txns.find((t) => t.id === id)?.voucher} · ${reason}`, 'warning');
  };

  /** Edit a returned entry and send it back through the normal rules. */
  const resubmit = (id: string, d: TxnDraft & {fee?: number;}) => {
    const pending = needsApproval(d.kind, d.amount);
    setTxns((l) => l.
    filter((t) => !(t.pairId === id && !(d.fee && d.fee > 0))).
    map((t) => {
      if (t.id === id) return { ...t, ...d, status: pending ? 'pending-approval' : 'posted', history: [...t.history, entry(pending ? 'Edited & resubmitted' : 'Edited & posted', pending ? 'info' : 'success')] };
      if (t.pairId === id) return { ...t, amount: d.fee ?? t.amount, accountId: d.accountId, date: d.date, status: pending ? 'pending-approval' : 'posted' };
      return t;
    }));
    addAudit('Accounts', 'Returned entry resubmitted', txns.find((t) => t.id === id)?.voucher ?? id);
    return pending;
  };

  const discard = (id: string) => {
    setTxns((l) => l.filter((t) => t.id !== id && t.pairId !== id));
    addAudit('Accounts', 'Returned entry discarded', txns.find((t) => t.id === id)?.voucher ?? id, 'warning');
  };

  // ---------- Accounts ----------
  const addAccount = (a: Omit<FinAccount, 'id' | 'archived'>) => {
    const id = `${a.type}-${Date.now().toString(36).slice(-5)}`;
    setAccounts((l) => [...l, { ...a, id, archived: false }]);
    addAudit('Accounts', 'Account created', `${a.name} · opening ${formatBDT(a.opening)}`);
    return id;
  };
  const updateAccount = (id: string, patch: Partial<FinAccount>, action = 'Account updated') => {
    setAccounts((l) => l.map((a) => a.id === id ? { ...a, ...patch } : a));
    addAudit('Accounts', action, accounts.find((a) => a.id === id)?.name ?? id, action.includes('rchiv') ? 'warning' : 'info');
  };

  // ---------- Parties ----------
  const addParty = (p: Omit<Party, 'id' | 'archived'>) => {
    const id = `P${String(parties.length + 1 + seq.current).padStart(2, '0')}`;
    seq.current += 1;
    setParties((l) => [...l, { ...p, id, archived: false }]);
    addAudit('Accounts', 'Party added', p.name);
    return id;
  };
  const updateParty = (id: string, patch: Partial<Party>, action = 'Party updated') => {
    setParties((l) => l.map((p) => p.id === id ? { ...p, ...patch } : p));
    addAudit('Accounts', action, parties.find((p) => p.id === id)?.name ?? id);
  };

  // ---------- Categories ----------
  const addCategory = (c: Omit<Category, 'id' | 'archived'>) => {
    const id = `${c.kind === 'income' ? 'in' : 'ex'}-${Date.now().toString(36).slice(-5)}`;
    setCategories((l) => [...l, { ...c, id, archived: false }]);
    addAudit('Accounts', 'Category added', `${c.name} (${c.kind})`);
    return id;
  };
  const updateCategory = (id: string, patch: Partial<Category>, action = 'Category updated') => {
    setCategories((l) => l.map((c) => c.id === id ? { ...c, ...patch } : c));
    addAudit('Accounts', action, categories.find((c) => c.id === id)?.name ?? id);
  };
  const categoryInUse = (id: string) => txns.some((t) => t.categoryId === id);

  const setApprovalLimit = (n: number) => {
    setLimit(n);
    addAudit('Settings', 'Accounts approval limit changed', formatBDT(n), 'warning');
  };

  const pending = useMemo(() => txns.filter((t) => t.status === 'pending-approval' && !t.pairId), [txns]);
  const returned = useMemo(() => txns.filter((t) => t.status === 'returned' && !t.pairId), [txns]);

  // ---------- Bills & party ledgers ----------
  const addBill = (b: Omit<Bill, 'id' | 'ref' | 'status' | 'createdBy'>) => {
    seq.current += 1;
    const n = 413 + bills.length + seq.current;
    const id = `BL-0${n}`;
    setBills((l) => [{ ...b, id, ref: id, status: 'open', createdBy: actor }, ...l]);
    addAudit('Accounts', b.direction === 'payable' ? 'Bill recorded' : 'Receivable recorded', `${id} · ${parties.find((p) => p.id === b.partyId)?.name} · ${formatBDT(b.amount)}`);
    return id;
  };
  const cancelBill = (id: string, reason: string) => {
    setBills((l) => l.map((b) => b.id === id ? { ...b, status: 'cancelled', note: [b.note, `Cancelled: ${reason}`].filter(Boolean).join(' · ') } : b));
    addAudit('Accounts', 'Bill cancelled', `${id} · ${reason}`, 'warning');
  };
  const billPaid = useCallback((billId: string) => txns.filter((t) => t.billId === billId && t.status === 'posted').reduce((s, t) => s + t.amount, 0), [txns]);

  /**
   * Party ledger from the school's side. Debit = they owe us more / we paid them; Credit = we owe them more / they paid us.
   * Balance > 0 → receivable ("They owe you"); < 0 → payable ("You owe them"). Direct cash purchases/sales net to zero.
   */
  const partyLedger = useCallback((partyId: string): LedgerRow[] => {
    const p = parties.find((x) => x.id === partyId);
    const raw: Array<Omit<LedgerRow, 'balance'>> = [];
    if (p?.opening) raw.push({ id: `op-${p.id}`, date: p.openingDate ?? '2026-11-01', ref: 'Opening', description: 'Opening balance', tag: 'Opening', debit: p.openingDirection === 'receivable' ? p.opening : 0, credit: p.openingDirection === 'payable' ? p.opening : 0 });
    bills.filter((b) => b.partyId === partyId && b.status === 'open').forEach((b) => raw.push({
      id: b.id, date: b.date, ref: b.ref, description: b.note || (b.direction === 'payable' ? 'Bill' : 'Receivable'), tag: b.direction === 'payable' ? 'Bill' : 'Receivable', sub: `Due ${b.dueDate}`,
      debit: b.direction === 'receivable' ? b.amount : 0, credit: b.direction === 'payable' ? b.amount : 0
    }));
    txns.filter((t) => t.partyId === partyId && t.status === 'posted' && (t.kind === 'income' || t.kind === 'expense')).forEach((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)?.name ?? '';
      if (t.settles) {
        raw.push({ id: t.id, date: t.date, ref: t.voucher, description: t.note || (t.kind === 'expense' ? 'Payment of dues' : 'Dues received'), tag: t.kind === 'expense' ? 'Payment' : 'Receipt', sub: t.billId ? `Against ${t.billId}` : 'On account', debit: t.kind === 'expense' ? t.amount : 0, credit: t.kind === 'income' ? t.amount : 0 });
      } else {
        raw.push({ id: t.id, date: t.date, ref: t.voucher, description: t.note || cat, tag: t.kind === 'expense' ? 'Paid on spot' : 'Received on spot', sub: cat, debit: t.amount, credit: t.amount });
      }
    });
    raw.sort((a, b) => a.date.localeCompare(b.date) || (a.tag === 'Opening' ? -1 : 0));
    let bal = 0;
    return raw.map((r) => {bal += r.debit - r.credit;return { ...r, balance: bal };});
  }, [parties, bills, txns, categories]);

  const partyBalance = useCallback((partyId: string) => {
    const rows = partyLedger(partyId);
    return rows.length ? rows[rows.length - 1].balance : 0;
  }, [partyLedger]);

  return {
    actor, canRecord, canApprove, approvalLimit, setApprovalLimit,
    accounts, txns, parties, categories, lines, pending, returned, bills,
    balanceOf, accountName, categoryName, partyName, needsApproval, spendThisMonth, feeAccountFor,
    record, approve, returnTxn, reverse, resubmit, discard,
    addAccount, updateAccount, addParty, updateParty, addCategory, updateCategory, categoryInUse,
    addBill, cancelBill, billPaid, partyLedger, partyBalance
  };
}

export type AccountsStore = ReturnType<typeof useAccountsStore>;
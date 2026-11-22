import type { TimelineEntry } from './academic';

export type SheetStatus = 'draft' | 'submitted' | 'returned' | 'approved' | 'partly-paid' | 'paid';

export interface SheetRow {
  staffId: string;
  basic: number;
  allowances: number;
  gross: number;
  /** Unpaid leave days in the month. */
  leaveDays: number;
  leaveDeduction: number;
  /** Structure deductions (provident fund, tax). */
  otherDeductions: number;
  advanceRecovery: number;
  bonus: number;
  net: number;
  paid: number;
  note?: string;
}

export interface SalarySheet {
  id: string;
  /** YYYY-MM */
  month: string;
  campusId: string;
  workingDays: number;
  status: SheetStatus;
  rows: SheetRow[];
  createdBy: string;
  history: TimelineEntry[];
}

export interface SalaryPayment {
  id: string;
  sheetId: string;
  staffId: string;
  date: string;
  amount: number;
  accountId: string;
  method: string;
  reference?: string;
  /** Accounts transaction (absent for payments made before the ledger opened). */
  txnId?: string;
  voucher: string;
}

export interface AdvanceRecovery {
  month: string;
  amount: number;
  ref: string;
}

export interface Advance {
  id: string;
  staffId: string;
  date: string;
  amount: number;
  installments: number;
  perMonth: number;
  accountId: string;
  txnId?: string;
  note?: string;
  recoveries: AdvanceRecovery[];
}

/** One row in a staff or party ledger. */
export interface LedgerRow {
  id: string;
  date: string;
  ref: string;
  description: string;
  tag: string;
  debit: number;
  credit: number;
  balance: number;
  sub?: string;
}
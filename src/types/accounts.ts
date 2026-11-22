import type { TimelineEntry } from './academic';

export type AccountType = 'cash' | 'bank' | 'wallet';

export interface FinAccount {
  id: string;
  name: string;
  type: AccountType;
  campusId: string;
  bank?: string;
  branch?: string;
  /** Full number kept for the backend; UI only ever shows it masked. */
  number?: string;
  provider?: 'bKash' | 'Nagad';
  opening: number;
  openingDate: string;
  archived: boolean;
  reconciledTo?: string;
}

export type TxnKind = 'income' | 'expense' | 'transfer' | 'adjustment';
export type TxnStatus = 'posted' | 'pending-approval' | 'returned' | 'reversed';
export type TxnMethod = 'Cash' | 'Cheque' | 'Bank transfer' | 'bKash' | 'Nagad';

export interface Txn {
  id: string;
  voucher: string;
  date: string;
  kind: TxnKind;
  /** Source account for expense/transfer, receiving account for income. */
  accountId: string;
  /** Transfer destination. */
  toAccountId?: string;
  amount: number;
  /** Adjustment direction (reconciliation). */
  direction?: 'in' | 'out';
  categoryId?: string;
  partyId?: string;
  method?: TxnMethod;
  reference?: string;
  note?: string;
  attachment?: string;
  /** Links a transfer-fee expense to its transfer so both move together. */
  pairId?: string;
  /** Reconciliation date stamped on the account when an adjustment posts. */
  reconcileDate?: string;
  /** Payment/receipt against a party's dues (bill or opening balance) rather than a direct cash purchase/sale. */
  settles?: boolean;
  billId?: string;
  status: TxnStatus;
  createdBy: string;
  history: TimelineEntry[];
}

export interface Party {
  id: string;
  name: string;
  type: 'vendor' | 'payer' | 'donor' | 'staff';
  phone?: string;
  note?: string;
  archived: boolean;
  /** Opening balance carried in from before Sabab. */
  opening?: number;
  openingDirection?: 'receivable' | 'payable';
  openingDate?: string;
}

/** An unpaid amount owed to (payable) or by (receivable) a party. No cash moves until it is paid. */
export interface Bill {
  id: string;
  ref: string;
  partyId: string;
  direction: 'payable' | 'receivable';
  date: string;
  dueDate: string;
  amount: number;
  categoryId?: string;
  note?: string;
  status: 'open' | 'cancelled';
  createdBy: string;
}

export interface Category {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  /** Monthly budget (expense categories only). */
  budget?: number;
  archived: boolean;
  /** System categories (fee collection, bank charges, adjustments) cannot be archived. */
  system?: boolean;
}

/** One row in a ledger/statement — fee receipts and transactions normalised. */
export interface LedgerLine {
  id: string;
  txnId?: string;
  source: 'fee' | 'txn';
  date: string;
  kind: TxnKind | 'fee';
  accountId: string;
  toAccountId?: string;
  label: string;
  categoryId?: string;
  partyId?: string;
  ref: string;
  amount: number;
  /** Transfer fee for display on the transfer row. */
  fee?: number;
  status: TxnStatus;
  note?: string;
}
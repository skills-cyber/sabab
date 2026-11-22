export type PaymentMethod = 'Cash' | 'Bank' | 'bKash' | 'Nagad';

export interface FeeHead {
  id: string;
  name: string;
  bn: string;
  frequency: 'Monthly' | 'Annual' | 'Per exam' | 'Per occurrence';
  optional: boolean;
  amounts: Record<string, number>;
}

export interface InvoiceLine {
  headId: string;
  label: string;
  amount: number;
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'waived';

export interface Invoice {
  id: string;
  studentId: string;
  period: string;
  issuedOn: string;
  dueDate: string;
  lines: InvoiceLine[];
  discount: number;
  discountNote?: string;
  paid: number;
  /** Academic year the invoice belongs to (defaults to 2026 for seeded invoices). */
  academicYear?: string;
}

export interface Payment {
  id: string;
  receiptNo: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  date: string;
  time: string;
  collectedBy: string;
  status: 'posted' | 'reversed';
  reversalReason?: string;
  /** Finance account the money landed in (Accounts & Finance). */
  accountId?: string;
}

export interface Message {
  id: string;
  channel: 'SMS' | 'App' | 'WhatsApp';
  audience: string;
  recipients: number;
  template: string;
  body: string;
  sentAt: string;
  sentBy: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  delivered: number;
  failed: number;
  credits: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  module: string;
  action: string;
  target: string;
  severity: 'info' | 'warning' | 'critical';
}
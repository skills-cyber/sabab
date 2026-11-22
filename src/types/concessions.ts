import type { TimelineEntry } from './academic';

export type ConcessionType = 'sibling' | 'merit' | 'staff-child' | 'hardship';
export type ConcessionStatus = 'pending' | 'approved' | 'rejected' | 'ended';

/** A standing fee concession on a student's monthly tuition. */
export interface Concession {
  id: string;
  studentId: string;
  type: ConcessionType;
  basis: 'percent' | 'fixed';
  /** Percent of tuition (1–100) or a fixed ৳ amount per month. */
  value: number;
  /** First month it applies to, YYYY-MM. */
  from: string;
  /** Last month it applies to (inclusive), YYYY-MM. Open-ended when empty. */
  to?: string;
  reason: string;
  status: ConcessionStatus;
  requestedBy: string;
  /** Also discount the student's currently unpaid invoice when approved. */
  applyCurrent?: boolean;
  history: TimelineEntry[];
}

export const CONCESSION_LABEL: Record<ConcessionType, string> = {
  sibling: 'Sibling',
  merit: 'Merit scholarship',
  'staff-child': 'Staff child',
  hardship: 'Hardship'
};

/** Monthly concessions above this amount need owner/principal approval. */
export const CONCESSION_APPROVAL_LIMIT = 2000;
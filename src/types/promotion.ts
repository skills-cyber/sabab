export type PromotionOutcome = 'promote' | 'hold' | 'graduate';
export type PromotionStep = 'prepare' | 'review' | 'preview' | 'confirm';
export type RollOrder = 'merit' | 'alpha';

/** The principal's decision for one student (only stored when it differs from the suggestion or a target was picked). */
export interface PromotionDecision {
  outcome: PromotionOutcome;
  targetSectionId?: string;
  reason?: string;
}

export interface SubjectResult {
  subjectId: string;
  pct: number;
}

export interface AnnualResult {
  /** Average across subjects, or null when nothing is published yet. */
  pct: number | null;
  grade: string;
  subjects: SubjectResult[];
  failed: string[];
  assessments: number;
}

export interface Suggestion {
  outcome: PromotionOutcome;
  reasons: string[];
}

/** One archived academic year on a student's record. */
export interface YearRecord {
  year: string;
  sectionId: string;
  roll: number;
  outcome: 'promoted' | 'held-back' | 'graduated';
  resultPct?: number;
  grade?: string;
  attendancePct: number;
  reason?: string;
}
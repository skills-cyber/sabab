import type { Assessment } from '../types/academic';
import type { AnnualResult, Suggestion } from '../types/promotion';
import type { Student } from '../types/school';
import { gradeFor } from './grades';

export const PASS_PCT = 33;
export const MIN_ATTENDANCE = 75;
/** Final classes: SSC (10) and HSC (12). */
export const FINAL_GRADES = [10, 12];

type Marks = Record<string, Record<string, number | null>>;

/** Weighted average of a student's published assessments, per subject and overall. */
export function annualResult(student: Student, assessments: Assessment[], marks: Marks): AnnualResult {
  const pub = assessments.filter((a) => a.stage === 'published' && a.sectionIds.includes(student.sectionId) && typeof marks[a.id]?.[student.id] === 'number');
  const bySubject = new Map<string, {sum: number;weight: number;}>();
  pub.forEach((a) => {
    const pct = (marks[a.id][student.id] as number) / a.totalMarks * 100;
    const w = a.weight || 1;
    const cur = bySubject.get(a.subjectId) ?? { sum: 0, weight: 0 };
    bySubject.set(a.subjectId, { sum: cur.sum + pct * w, weight: cur.weight + w });
  });
  const subjects = [...bySubject.entries()].map(([subjectId, v]) => ({ subjectId, pct: Math.round(v.sum / v.weight) }));
  const pct = subjects.length ? Math.round(subjects.reduce((t, s) => t + s.pct, 0) / subjects.length) : null;
  return {
    pct,
    grade: pct === null ? '—' : gradeFor(pct, 100).grade,
    subjects,
    failed: subjects.filter((s) => s.pct < PASS_PCT).map((s) => s.subjectId),
    assessments: pub.length
  };
}

/** Rule: hold back when 2+ subjects are below the pass mark or attendance is under the minimum; final classes graduate. */
export function suggestOutcome(student: Student, result: AnnualResult, grade: number): Suggestion {
  const reasons: string[] = [];
  if (result.failed.length >= 2) reasons.push(`${result.failed.length} subjects below ${PASS_PCT}%`);
  if (student.attendancePct > 0 && student.attendancePct < MIN_ATTENDANCE) reasons.push(`Attendance ${student.attendancePct}% (min ${MIN_ATTENDANCE}%)`);
  if (reasons.length) return { outcome: 'hold', reasons };
  if (FINAL_GRADES.includes(grade)) return { outcome: 'graduate', reasons: [grade === 10 ? 'Completes Class 10 · sits SSC' : 'Completes Class 12 · sits HSC'] };
  const notes = result.pct === null ? ['No published results — attendance only'] : result.failed.length === 1 ? [`Below ${PASS_PCT}% in 1 subject`] : [];
  return { outcome: 'promote', reasons: notes };
}
import { useCallback, useMemo, useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useAcademic } from '../../contexts/AcademicContext';
import { useStaff } from '../../contexts/StaffContext';
import { usePayroll } from '../../contexts/PayrollContext';
import { useApp } from '../../contexts/AppContext';
import { applications } from '../../data/admissions';
import type { AnnualResult, PromotionDecision, PromotionStep, RollOrder, Suggestion } from '../../types/promotion';
import type { Student } from '../../types/school';
import { annualResult, FINAL_GRADES, suggestOutcome } from '../../utils/annualResult';
import { invoiceBalance } from '../../utils/fees';

export interface ResolvedDecision extends PromotionDecision {
  overridden: boolean;
}

export interface PreviewRow {
  sectionId: string;
  grade: number;
  campusId: string;
  capacity: number;
  promoted: number;
  held: number;
  intake: number;
  total: number;
}

export const STEPS: Array<{id: PromotionStep;label: string;}> = [
{ id: 'prepare', label: 'Prepare' },
{ id: 'review', label: 'Review classes' },
{ id: 'preview', label: 'Preview & capacity' },
{ id: 'confirm', label: 'Confirm rollover' }];


/** Year-end promotion workspace: suggestions from results + attendance, principal overrides, capacity preview. */
export function usePromotion() {
  const admin = useAdmin();
  const { role } = useApp();
  const { assessments, marks } = useAcademic();
  const staff = useStaff();
  const payroll = usePayroll();
  const canDecide = role === 'owner' || role === 'principal';
  const nextYear = String(Number(admin.currentYear) + 1);

  const live = useMemo(() => staff.sections.filter((s) => !s.archived), [staff.sections]);
  const gradeOf = useCallback((sectionId: string) => staff.sections.find((s) => s.id === sectionId)?.grade ?? (parseInt(sectionId, 10) || 0), [staff.sections]);
  const active = useMemo(() => admin.students.filter((s) => s.status === 'active'), [admin.students]);

  const results = useMemo<Record<string, AnnualResult>>(() => Object.fromEntries(active.map((s) => [s.id, annualResult(s, assessments, marks)])), [active, assessments, marks]);
  const suggestions = useMemo<Record<string, Suggestion>>(() => Object.fromEntries(active.map((s) => [s.id, suggestOutcome(s, results[s.id], gradeOf(s.sectionId))])), [active, results, gradeOf]);

  const [overrides, setOverrides] = useState<Record<string, PromotionDecision>>({});
  const [reviewed, setReviewed] = useState<number[]>([]);
  const [step, setStep] = useState<PromotionStep>('prepare');
  const [rollOrder, setRollOrder] = useState<RollOrder>('merit');
  const [attendanceFinal, setAttendanceFinal] = useState(false);

  /** Next-year sections a student can move into (same campus first). */
  const targetsFor = useCallback((s: Student) => {
    const g = gradeOf(s.sectionId) + 1;
    const all = live.filter((x) => x.grade === g);
    return [...all.filter((x) => x.campusId === s.campusId), ...all.filter((x) => x.campusId !== s.campusId)];
  }, [gradeOf, live]);

  const defaultTarget = useCallback((s: Student) => {
    const opts = targetsFor(s);
    const letter = s.sectionId.replace(/^\d+/, '');
    return (opts.find((x) => x.id === `${gradeOf(s.sectionId) + 1}${letter}`) ?? opts[0])?.id;
  }, [targetsFor, gradeOf]);

  const decisionFor = useCallback((s: Student): ResolvedDecision => {
    const o = overrides[s.id];
    const suggested = suggestions[s.id]?.outcome ?? 'promote';
    const outcome = o?.outcome ?? suggested;
    return {
      outcome,
      targetSectionId: outcome === 'promote' ? o?.targetSectionId ?? defaultTarget(s) : outcome === 'hold' ? s.sectionId : undefined,
      reason: o?.reason,
      overridden: outcome !== suggested
    };
  }, [overrides, suggestions, defaultTarget]);

  const setDecision = useCallback((id: string, patch: PromotionDecision) => setOverrides((m) => ({ ...m, [id]: { ...m[id], ...patch } })), []);
  const toggleReviewed = useCallback((g: number) => setReviewed((l) => l.includes(g) ? l.filter((x) => x !== g) : [...l, g]), []);

  const grades = useMemo(() => [...new Set(active.map((s) => gradeOf(s.sectionId)))].sort((a, b) => a - b), [active, gradeOf]);
  const studentsInGrade = useCallback((g: number) => admin.students.filter((s) => gradeOf(s.sectionId) === g), [admin.students, gradeOf]);
  const due = useCallback((id: string) => admin.invoices.filter((i) => i.studentId === id).reduce((t, i) => t + invoiceBalance(i), 0), [admin.invoices]);

  const decisions = useMemo(() => Object.fromEntries(active.map((s) => [s.id, decisionFor(s)])), [active, decisionFor]);

  const preview = useMemo<PreviewRow[]>(() => {
    const rows = new Map<string, PreviewRow>(live.map((x) => [x.id, { sectionId: x.id, grade: x.grade, campusId: x.campusId, capacity: x.capacity, promoted: 0, held: 0, intake: 0, total: 0 }]));
    active.forEach((s) => {
      const d = decisions[s.id];
      if (!d?.targetSectionId) return;
      const r = rows.get(d.targetSectionId);
      if (!r) return;
      if (d.outcome === 'promote') r.promoted += 1;else r.held += 1;
    });
    applications.filter((a) => (a.stage === 'offered' || a.stage === 'admitted') && !a.studentId).forEach((a) => {
      const r = [...rows.values()].find((x) => x.grade === a.grade && x.campusId === a.campusId) ?? [...rows.values()].find((x) => x.grade === a.grade);
      if (r) r.intake += 1;
    });
    return [...rows.values()].map((r) => ({ ...r, total: r.promoted + r.held + r.intake })).filter((r) => r.total > 0 || grades.includes(r.grade - 1)).sort((a, b) => a.grade - b.grade || a.sectionId.localeCompare(b.sectionId));
  }, [live, active, decisions, grades]);

  const missingTargets = active.filter((s) => decisions[s.id]?.outcome === 'promote' && !decisions[s.id]?.targetSectionId);
  const overCapacity = preview.filter((r) => r.total > r.capacity);
  const counts = active.reduce((c, s) => {c[decisions[s.id].outcome] += 1;return c;}, { promote: 0, hold: 0, graduate: 0 });

  const checks = useMemo(() => {
    const annual = assessments.filter((a) => a.type === 'Annual');
    const annualPublished = annual.filter((a) => a.stage === 'published').length;
    const missingNext = grades.filter((g) => !FINAL_GRADES.includes(g) && !live.some((x) => x.grade === g + 1));
    const intakeMissing = [6, 11].filter((g) => !live.some((x) => x.grade === g));
    const openSheets = payroll.sheets.filter((s) => s.status !== 'paid').length;
    return [
    { id: 'marks', ok: annual.length > 0 && annualPublished === annual.length, label: 'Annual exam marks published', detail: `${annualPublished} of ${annual.length} annual assessments published · unpublished marks are left out of results`, href: '/exams/assessments' },
    { id: 'attendance', ok: attendanceFinal, label: 'Attendance finalised', detail: attendanceFinal ? 'Confirmed by the principal' : 'Confirm the year’s attendance is complete', href: '/attendance', toggle: true },
    { id: 'sections', ok: missingNext.length === 0, label: `AY ${nextYear} classes & sections exist`, detail: missingNext.length ? `No section for Class ${missingNext.map((g) => g + 1).join(', ')} yet` : 'Every promoted class has a section to move into', href: '/settings/classes' },
    { id: 'intake', ok: intakeMissing.length === 0, label: 'Intake sections (Class 6 and 11)', detail: intakeMissing.length ? `Admissions intake for Class ${intakeMissing.join(' & ')} has no section yet` : 'Intake classes ready for new admissions', href: '/admissions/seats' },
    { id: 'payroll', ok: openSheets === 0, label: 'Salary sheets closed', detail: openSheets ? `${openSheets} salary sheet${openSheets > 1 ? 's' : ''} not fully paid` : 'All salary sheets paid', href: '/payroll/sheets' },
    { id: 'dayclose', ok: !!admin.dayClose, label: 'Today’s cash day close done', detail: admin.dayClose ? `Closed ${admin.dayClose.at}` : 'Close the cash day before rollover', href: '/fees/close' }];

  }, [assessments, grades, live, payroll.sheets, attendanceFinal, admin.dayClose, nextYear]);

  const confirm = useCallback(() => admin.rollover({
    decisions,
    results,
    rollOrder,
    campusOf: (id) => staff.sections.find((x) => x.id === id)?.campusId
  }), [admin, decisions, results, rollOrder, staff.sections]);

  return {
    canDecide, currentYear: admin.currentYear, nextYear, step, setStep, rollOrder, setRollOrder, attendanceFinal, setAttendanceFinal,
    results, suggestions, decisionFor, setDecision, targetsFor, grades, studentsInGrade, reviewed, toggleReviewed, due, gradeOf,
    preview, missingTargets, overCapacity, counts, checks, confirm
  };
}

export type PromotionStore = ReturnType<typeof usePromotion>;
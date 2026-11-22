import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { AnnualResult, PromotionDecision, RollOrder, YearRecord } from '../types/promotion';
import type { Student } from '../types/school';

interface Deps {
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  addAudit: (module: string, action: string, target: string, severity?: 'info' | 'warning' | 'critical') => void;
  setAppYear: (y: string) => void;
  stamp: () => string;
  actor: string;
}

export interface RolloverSummary {
  fromYear: string;
  toYear: string;
  at: string;
  by: string;
  promoted: number;
  held: number;
  graduated: number;
  movedIds: string[];
}

export interface RolloverInput {
  decisions: Record<string, Required<Pick<PromotionDecision, 'outcome'>> & PromotionDecision>;
  results: Record<string, AnnualResult>;
  rollOrder: RollOrder;
  campusOf: (sectionId: string) => string | undefined;
}

const OUTCOME: Record<PromotionDecision['outcome'], YearRecord['outcome']> = { promote: 'promoted', hold: 'held-back', graduate: 'graduated' };

/** Academic-year rollover: archives the year on each student, moves classes, re-rolls, and can be undone until new-year billing. */
export function useYearRollover({ students, setStudents, addAudit, setAppYear, stamp, actor }: Deps) {
  const [currentYear, setCurrentYear] = useState('2026');
  const [snapshot, setSnapshot] = useState<{students: Student[];year: string;} | null>(null);
  const [lastRollover, setLastRollover] = useState<RolloverSummary | null>(null);

  const rollover = useCallback(({ decisions, results, rollOrder, campusOf }: RolloverInput): RolloverSummary => {
    const fromYear = currentYear;
    const toYear = String(Number(currentYear) + 1);
    const counts = { promoted: 0, held: 0, graduated: 0 };
    const moved: string[] = [];
    const next = students.map((s): Student => {
      const d = decisions[s.id];
      if (!d || s.status !== 'active') return s;
      const r = results[s.id];
      const record: YearRecord = { year: fromYear, sectionId: s.sectionId, roll: s.roll, outcome: OUTCOME[d.outcome], resultPct: r?.pct ?? undefined, grade: r && r.pct !== null ? r.grade : undefined, attendancePct: s.attendancePct, reason: d.reason };
      const base: Student = { ...s, yearHistory: [...(s.yearHistory ?? []), record] };
      moved.push(s.id);
      if (d.outcome === 'graduate') {counts.graduated += 1;return { ...base, status: 'graduated', remarks: `Graduated · AY ${fromYear}` };}
      if (d.outcome === 'hold') {counts.held += 1;return base;}
      counts.promoted += 1;
      const target = d.targetSectionId ?? s.sectionId;
      return { ...base, sectionId: target, campusId: campusOf(target) ?? s.campusId };
    });
    // Re-roll every section that received or kept decided students.
    const bySection = new Map<string, Student[]>();
    next.filter((s) => s.status === 'active' && moved.includes(s.id)).forEach((s) => bySection.set(s.sectionId, [...(bySection.get(s.sectionId) ?? []), s]));
    const rolls = new Map<string, number>();
    bySection.forEach((list) => {
      const sorted = [...list].sort((a, b) => {
        if (rollOrder === 'merit') {
          const pa = results[a.id]?.pct ?? -1;
          const pb = results[b.id]?.pct ?? -1;
          if (pb !== pa) return pb - pa;
          if (b.attendancePct !== a.attendancePct) return b.attendancePct - a.attendancePct;
        }
        return a.name.localeCompare(b.name);
      });
      sorted.forEach((s, i) => rolls.set(s.id, i + 1));
    });
    setSnapshot({ students, year: fromYear });
    setStudents(next.map((s) => rolls.has(s.id) ? { ...s, roll: rolls.get(s.id)! } : s));
    setCurrentYear(toYear);
    setAppYear(toYear);
    const summary: RolloverSummary = { fromYear, toYear, at: stamp(), by: actor, ...counts, movedIds: moved };
    setLastRollover(summary);
    addAudit('Promotion', `Year rollover AY ${fromYear} → ${toYear}`, `${counts.promoted} promoted · ${counts.held} held back · ${counts.graduated} graduated · rolls by ${rollOrder}`, 'critical');
    return summary;
  }, [currentYear, students, setStudents, setAppYear, stamp, actor, addAudit]);

  const undoRollover = useCallback(() => {
    if (!snapshot) return;
    setStudents(snapshot.students);
    setCurrentYear(snapshot.year);
    setAppYear(snapshot.year);
    addAudit('Promotion', `Rollover undone · back to AY ${snapshot.year}`, lastRollover ? `${lastRollover.movedIds.length} students restored` : '', 'critical');
    setSnapshot(null);
    setLastRollover(null);
  }, [snapshot, lastRollover, setStudents, setAppYear, addAudit]);

  return { currentYear, lastRollover, hasSnapshot: !!snapshot, rollover, undoRollover };
}
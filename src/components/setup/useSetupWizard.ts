import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { SetupDraft, SetupStepId } from '../../types/setup';
import { initialSetupDraft } from '../../data/setupTemplates';
import { nowStamp } from '../../utils/format';

export const SETUP_STEPS: Array<{id: SetupStepId;label: string;bn: string;}> = [
{ id: 'institution', label: 'Institution', bn: 'প্রতিষ্ঠান' },
{ id: 'campuses', label: 'Campuses & year', bn: 'ক্যাম্পাস ও বর্ষ' },
{ id: 'classes', label: 'Classes & teachers', bn: 'শ্রেণি ও শিক্ষক' },
{ id: 'subjects', label: 'Subjects & fees', bn: 'বিষয় ও ফি' },
{ id: 'import', label: 'Import students', bn: 'শিক্ষার্থী আমদানি' },
{ id: 'review', label: 'Review & activate', bn: 'যাচাই ও চালু' }];


const KEY = 'sabab.setup.draft.v1';

function load(): SetupDraft {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initialSetupDraft, ...(JSON.parse(raw) as SetupDraft) } : initialSetupDraft;
  } catch {
    return initialSetupDraft;
  }
}

/** Per-step validation — returns field → message. Empty object = step complete. */
export function validateStep(d: SetupDraft, step: SetupStepId): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 'institution') {
    if (d.institution.name.trim().length < 3) e.name = 'Institution name is required.';
    if (!/^\d{6}$/.test(d.institution.eiin.trim())) e.eiin = 'EIIN must be 6 digits.';
    if (!/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(d.institution.email.trim())) e.email = 'Enter a valid email.';
  }
  if (step === 'campuses') {
    if (!d.campuses.length) e.campuses = 'Add at least one campus.';
    d.campuses.forEach((c, i) => c.name.trim().length < 2 && (e[`campus-${i}`] = 'Campus name required.'));
    if (d.year.start >= d.year.end) e.year = 'Year must end after it starts.';
    d.year.terms.forEach((t, i) => {
      if (t.start > t.end) e[`term-${i}`] = 'Term ends before it starts.';
      if (t.start < d.year.start || t.end > d.year.end) e[`term-${i}`] = 'Term falls outside the academic year.';
    });
  }
  if (step === 'classes') {
    if (!d.grades.some((g) => g.enabled)) e.grades = 'Enable at least one class.';
    d.grades.filter((g) => g.enabled && !g.sections.length).forEach((g) => e[`grade-${g.grade}`] = `${g.label} needs a section.`);
  }
  if (step === 'subjects') {
    if (!d.subjects.some((s) => s.enabled)) e.subjects = 'Enable at least one subject.';
    if (d.fees.some((f) => f.enabled && (!Number.isFinite(f.amount) || f.amount <= 0))) e.fees = 'Enabled fees need an amount above ৳0.';
  }
  if (step === 'import') {
    if (d.importState !== 'imported') e.import = 'Import a roster or choose “Skip for now”.';
  }
  return e;
}

export function useSetupWizard() {
  const [draft, setDraft] = useState<SetupDraft>(load);
  const [dir, setDir] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const first = useRef(true);

  // Autosave (resumable draft).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      const next = { ...draft, savedAt: nowStamp() };
      localStorage.setItem(KEY, JSON.stringify(next));
      setDraft((d) => d.savedAt === next.savedAt ? d : { ...d, savedAt: next.savedAt });
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ ...draft, savedAt: null })]);

  const update = useCallback(<K extends keyof SetupDraft,>(key: K, value: SetupDraft[K]) => setDraft((d) => ({ ...d, [key]: value })), []);

  const index = SETUP_STEPS.findIndex((s) => s.id === draft.step);
  const errors = useMemo(() => validateStep(draft, draft.step), [draft]);
  const completed = useMemo(() => SETUP_STEPS.filter((s) => s.id !== 'review' && Object.keys(validateStep(draft, s.id)).length === 0).map((s) => s.id), [draft]);

  const goTo = (id: SetupStepId) => {
    const target = SETUP_STEPS.findIndex((s) => s.id === id);
    // Moving forward past an incomplete step is blocked; going back is always allowed.
    for (let i = index; i < target; i++) {
      if (Object.keys(validateStep(draft, SETUP_STEPS[i].id)).length) {
        setShowErrors(true);
        if (i !== index) setDraft((d) => ({ ...d, step: SETUP_STEPS[i].id }));
        toast.error(`Complete “${SETUP_STEPS[i].label}” first`);
        return;
      }
    }
    setDir(target >= index ? 1 : -1);
    setShowErrors(false);
    setDraft((d) => ({ ...d, step: id }));
  };

  const next = () => index < SETUP_STEPS.length - 1 && goTo(SETUP_STEPS[index + 1].id);
  const back = () => index > 0 && goTo(SETUP_STEPS[index - 1].id);

  const reset = () => {
    localStorage.removeItem(KEY);
    setDir(-1);
    setShowErrors(false);
    setDraft(initialSetupDraft);
    toast.success('Setup draft discarded');
  };

  return { draft, setDraft, update, index, dir, errors: showErrors ? errors : {}, rawErrors: errors, completed, goTo, next, back, reset };
}
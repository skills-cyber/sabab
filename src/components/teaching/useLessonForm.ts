import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { AttendanceMark, LessonOutcome, TodayPeriod } from '../../types/academic';
import { useAcademic } from '../../contexts/AcademicContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import { computeCoverage } from '../../utils/coverage';
import { courses } from '../../data/academic';

const DRAFT_KEY = (id: string) => `sabab.lessonDraft.${id}`;

interface Draft {
  attendance: Record<string, AttendanceMark>;
  outcome: LessonOutcome;
  topicId: string;
  note: string;
  reason: string;
  hwTitle: string;
  hwDue: string;
  notify: boolean;
}

export function useLessonForm(period: TodayPeriod) {
  const { submitLesson, topics, progress } = useAcademic();
  const { students } = useAdmin();
  const { online } = useApp();

  const roster = useMemo(() => students.filter((s) => s.sectionId === period.sectionId && s.status === 'active').sort((a, b) => a.roll - b.roll), [students, period.sectionId]);
  const blank: Draft = { attendance: {}, outcome: 'completed', topicId: period.plannedTopicId, note: '', reason: '', hwTitle: '', hwDue: '2026-11-04', notify: true };
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY(period.id));
    setDraft(saved ? { ...blank, ...(JSON.parse(saved) as Draft) } : blank);
    setErrors({});
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.id]);

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const course = courses.find((c) => c.id === period.courseId);
  const coverage = course ? computeCoverage(course, topics, progress) : null;
  const syllabusTopics = topics.filter((t) => course?.syllabusId && t.syllabusId === course.syllabusId);
  const noClass = draft.outcome === 'missed' || draft.outcome === 'cancelled';
  const absentees = roster.filter((s) => draft.attendance[s.id] === 'A');
  const notifiable = absentees.filter((s) => s.smsOptIn).length;

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY(period.id), JSON.stringify(draft));
    setDirty(false);
    toast.success('Draft saved on this device', { description: online ? 'Not yet submitted.' : 'Offline — submit when ready; it will sync later.' });
  };

  const submit = (): boolean => {
    const e: Record<string, string> = {};
    if (!noClass && roster.some((s) => !draft.attendance[s.id])) e.attendance = `${roster.filter((s) => !draft.attendance[s.id]).length} students are unmarked. Use “Mark rest present” then tap exceptions.`;
    if (!noClass && !draft.topicId) e.topic = 'Choose the topic you actually taught.';
    if (noClass && draft.reason.trim().length < 4) e.reason = 'A reason is required for missed or cancelled classes.';
    if (draft.hwTitle && draft.hwTitle.trim().length < 4) e.hw = 'Homework description is too short.';
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error('Please fix the highlighted fields');
      return false;
    }
    submitLesson(period.id, {
      attendance: noClass ? {} : draft.attendance,
      outcome: draft.outcome,
      actualTopicId: draft.topicId,
      note: draft.note,
      reason: noClass ? draft.reason : undefined,
      homework: draft.hwTitle ? { title: draft.hwTitle, due: draft.hwDue } : undefined,
      notifyAbsentees: !noClass && draft.notify ? notifiable : 0
    });
    localStorage.removeItem(DRAFT_KEY(period.id));
    setDirty(false);
    if (noClass) toast.warning('Class recorded as not delivered', { description: 'A syllabus gap was created — propose a makeup from Cancelled & Makeup.' });else
    toast.success('Lesson submitted', { description: online ? 'Syncing… syllabus progress updated.' : 'Saved offline · will sync when connection returns.' });
    return true;
  };

  return { roster, draft, update, errors, dirty, coverage, syllabusTopics, noClass, absentees, notifiable, saveDraft, submit };
}
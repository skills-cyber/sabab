import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import type {
  Assessment, AssessmentStage, AttendanceMark, CalendarEvent, Homework, LessonOutcome, MakeupProposal, MakeupRequest, PlanVersion,
  Question, SyllabusTopic, TimelineEntry, TimetableCell, TodayPeriod } from
'../types/academic';
import { calendarEvents, homework as seedHomework, initialProgress, makeupRequests, planVersions, syllabusTopics, todayPeriods } from '../data/academic';
import { assessments as seedAssessments, initialMarks, questions as seedQuestions } from '../data/exams';
import { buildTimetable, sectionLabel } from '../utils/timetable';
import { TODAY, formatDate } from '../utils/format';
import { useApp } from './AppContext';
import { useAdmin } from './AdminContext';

export interface LessonSubmission {
  attendance: Record<string, AttendanceMark>;
  outcome: LessonOutcome;
  actualTopicId: string;
  note: string;
  reason?: string;
  homework?: {title: string;due: string;};
  notifyAbsentees: number;
}

export interface MarkCorrection {
  id: string;
  assessmentId: string;
  studentId: string;
  from: number | null;
  to: number;
  reason: string;
  by: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AcademicContextValue {
  topics: SyllabusTopic[];
  updateTopic: (id: string, patch: Partial<SyllabusTopic>) => void;
  progress: Record<string, Record<string, number>>;
  periods: TodayPeriod[];
  submitLesson: (periodId: string, s: LessonSubmission) => void;
  timetable: TimetableCell[];
  updateCell: (id: string, patch: Partial<TimetableCell>) => void;
  substitutions: Record<string, string>;
  assignSubstitute: (cellId: string, teacherId: string) => void;
  makeups: MakeupRequest[];
  createMakeup: (m: Omit<MakeupRequest, 'id' | 'history' | 'status'>, note: string) => string;
  proposeMakeup: (id: string, p: MakeupProposal) => void;
  decideMakeup: (id: string, approve: boolean, note: string) => void;
  completeMakeup: (id: string) => void;
  plans: PlanVersion[];
  createPlanDraft: (title: string, reason: string, changes: string[]) => void;
  submitPlan: (id: string) => void;
  decidePlan: (id: string, approve: boolean, note: string) => void;
  events: CalendarEvent[];
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  assessments: Assessment[];
  createAssessment: (a: Omit<Assessment, 'id' | 'history' | 'stage' | 'questionIds'>) => string;
  updateAssessment: (id: string, patch: Partial<Assessment>) => void;
  moveStage: (id: string, stage: AssessmentStage, action: string, note?: string, tone?: TimelineEntry['tone']) => void;
  marks: Record<string, Record<string, number | null>>;
  setMark: (assessmentId: string, studentId: string, value: number | null) => void;
  corrections: MarkCorrection[];
  requestCorrection: (c: Omit<MarkCorrection, 'id' | 'status' | 'by'>) => void;
  decideCorrection: (id: string, approve: boolean) => void;
  questions: Question[];
  addQuestion: (q: Omit<Question, 'id' | 'usedIn' | 'version' | 'author'>) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  homework: Homework[];
}

const AcademicContext = createContext<AcademicContextValue | null>(null);
const stamp = () => `${formatDate(TODAY)} · ${format(new Date(), 'HH:mm')}`;

export function AcademicProvider({ children }: {children: React.ReactNode;}) {
  const { roleInfo, online } = useApp();
  const { addAudit, queueMessage, students } = useAdmin();
  const actor = roleInfo.user;

  const [topics, setTopics] = useState(syllabusTopics);
  const [progress, setProgress] = useState(initialProgress);
  const [periods, setPeriods] = useState(todayPeriods);
  const [timetable, setTimetable] = useState<TimetableCell[]>(() => buildTimetable());
  const [substitutions, setSubstitutions] = useState<Record<string, string>>({});
  const [makeups, setMakeups] = useState(makeupRequests);
  const [plans, setPlans] = useState(planVersions);
  const [events, setEvents] = useState(calendarEvents);
  const [assessments, setAssessments] = useState(seedAssessments);
  const [marks, setMarks] = useState(initialMarks);
  const [corrections, setCorrections] = useState<MarkCorrection[]>([]);
  const [questions, setQuestions] = useState(seedQuestions);
  const [homework, setHomework] = useState(seedHomework);

  // Offline-draft replay: pending lessons sync when connectivity returns.
  useEffect(() => {
    if (!online) return;
    const pending = periods.some((p) => p.sync === 'pending-sync');
    if (!pending) return;
    const t = window.setTimeout(() => setPeriods((list) => list.map((p) => p.sync === 'pending-sync' ? { ...p, sync: 'synced' } : p)), 1600);
    return () => window.clearTimeout(t);
  }, [online, periods]);

  const updateTopic = useCallback((id: string, patch: Partial<SyllabusTopic>) => {
    setTopics((list) => list.map((t) => t.id === id ? { ...t, ...patch } : t));
    addAudit('Syllabus', 'Topic updated', `${id} ${Object.keys(patch).join(', ')}`);
  }, [addAudit]);

  const bumpProgress = useCallback((courseId: string, topicId: string, mode: 'complete' | 'partial' | 'one') => {
    const topic = syllabusTopics.find((t) => t.id === topicId);
    if (!topic) return;
    setProgress((p) => {
      const cur = p[courseId]?.[topicId] ?? 0;
      let next = cur + 1;
      if (mode === 'complete') next = Math.max(cur + 1, topic.plannedPeriods);
      if (mode === 'partial') next = Math.min(cur + 1, Math.max(cur, topic.plannedPeriods - 1));
      return { ...p, [courseId]: { ...(p[courseId] ?? {}), [topicId]: next } };
    });
  }, []);

  const createMakeup = useCallback((m: Omit<MakeupRequest, 'id' | 'history' | 'status'>, note: string) => {
    const id = `MK-${105 + Math.floor(Math.random() * 800)}`;
    setMakeups((list) => [{ ...m, id, status: 'gap-open', history: [{ at: stamp(), actor, action: note, tone: 'danger' }] }, ...list]);
    addAudit('Makeup', 'Syllabus gap recorded', `${id} · ${sectionLabel(m.sectionId)} ${m.subjectId}`, 'warning');
    return id;
  }, [actor, addAudit]);

  const submitLesson = useCallback((periodId: string, s: LessonSubmission) => {
    const period = periods.find((p) => p.id === periodId);
    if (!period) return;
    setPeriods((list) => list.map((p) => p.id === periodId ? {
      ...p, status: 'submitted', outcome: s.outcome, actualTopicId: s.actualTopicId, note: s.note, reason: s.reason, attendance: s.attendance,
      sync: 'pending-sync', submittedAt: format(new Date(), 'HH:mm')
    } : p));
    if (s.outcome === 'completed') bumpProgress(period.courseId, s.actualTopicId, 'complete');
    if (s.outcome === 'partial') bumpProgress(period.courseId, s.actualTopicId, 'partial');
    if (s.outcome === 'missed' || s.outcome === 'cancelled') {
      createMakeup({ courseId: period.courseId, sectionId: period.sectionId, subjectId: period.subjectId, teacherId: 'T01', originalDate: TODAY, originalPeriod: period.period, reason: s.reason ?? 'Not specified', topicId: period.plannedTopicId }, `Class marked ${s.outcome} — 1 period syllabus gap`);
    }
    if (s.homework?.title) {
      setHomework((h) => [{ id: `hw-${Date.now()}`, sectionId: period.sectionId, subjectId: period.subjectId, title: s.homework!.title, assignedOn: TODAY, due: s.homework!.due, teacherId: 'T01', submissions: 0 }, ...h]);
    }
    if (s.notifyAbsentees > 0) {
      queueMessage({ channel: 'SMS', audience: `${sectionLabel(period.sectionId)} guardians · absentees`, recipients: s.notifyAbsentees, template: 'Absence alert', body: `Absence alert for ${formatDate(TODAY)} (${sectionLabel(period.sectionId)}).`, credits: s.notifyAbsentees * 2 });
    }
    addAudit('Teaching', 'Lesson submitted', `${sectionLabel(period.sectionId)} ${period.subjectId} P${period.period} · ${s.outcome}`);
  }, [periods, bumpProgress, createMakeup, queueMessage, addAudit]);

  const updateCell = useCallback((id: string, patch: Partial<TimetableCell>) => {
    setTimetable((list) => list.map((c) => c.id === id ? { ...c, ...patch } : c));
    addAudit('Timetable', 'Routine slot changed', id);
  }, [addAudit]);

  const assignSubstitute = useCallback((cellId: string, teacherId: string) => {
    setSubstitutions((s) => ({ ...s, [cellId]: teacherId }));
    addAudit('Timetable', 'Substitute assigned', `${cellId} → ${teacherId} (${formatDate(TODAY)})`);
  }, [addAudit]);

  const proposeMakeup = useCallback((id: string, p: MakeupProposal) => {
    setMakeups((list) => list.map((m) => m.id === id ? { ...m, status: 'proposed', proposal: p, history: [...m.history, { at: stamp(), actor, action: `Proposed makeup · ${p.day} ${formatDate(p.date, 'd MMM')}, P${p.period}, ${p.roomId}`, tone: 'info' }] } : m));
  }, [actor]);

  const decideMakeup = useCallback((id: string, approve: boolean, note: string) => {
    const mk = makeups.find((m) => m.id === id);
    setMakeups((list) => list.map((m) => m.id === id ? { ...m, status: approve ? 'approved' : 'rejected', history: [...m.history, { at: stamp(), actor, action: approve ? 'Approved · guardians notified' : 'Rejected — revise proposal', note, tone: approve ? 'success' : 'danger' }] } : m));
    if (approve && mk) {
      const recipients = students.filter((s) => s.sectionId === mk.sectionId && s.smsOptIn && s.status === 'active').length;
      queueMessage({ channel: 'SMS', audience: `${sectionLabel(mk.sectionId)} guardians`, recipients, template: 'Makeup class notice', body: `Makeup class for ${sectionLabel(mk.sectionId)} ${mk.subjectId} on ${mk.proposal ? formatDate(mk.proposal.date) : ''}.`, credits: recipients });
    }
    addAudit('Makeup', approve ? 'Makeup approved' : 'Makeup rejected', id, approve ? 'info' : 'warning');
  }, [makeups, actor, students, queueMessage, addAudit]);

  const completeMakeup = useCallback((id: string) => {
    const mk = makeups.find((m) => m.id === id);
    if (mk?.topicId) bumpProgress(mk.courseId, mk.topicId, 'one');
    setMakeups((list) => list.map((m) => m.id === id ? { ...m, status: 'completed', history: [...m.history, { at: stamp(), actor, action: 'Makeup delivered · syllabus gap resolved', tone: 'success' }] } : m));
    addAudit('Makeup', 'Makeup completed', id);
  }, [makeups, actor, bumpProgress, addAudit]);

  const createPlanDraft = useCallback((title: string, reason: string, changes: string[]) => {
    setPlans((list) => {
      const minor = list.length;
      return [{ id: `pv-${Date.now()}`, version: `v1.${minor}`, title, status: 'draft', author: actor, createdOn: TODAY, changeReason: reason, changes, history: [{ at: stamp(), actor, action: `Created draft from ${list.find((p) => p.status === 'published')?.version ?? 'latest'}` }] }, ...list];
    });
    addAudit('Planner', 'Plan draft created', title);
  }, [actor, addAudit]);

  const submitPlan = useCallback((id: string) => {
    setPlans((list) => list.map((p) => p.id === id ? { ...p, status: 'submitted', history: [...p.history, { at: stamp(), actor, action: 'Submitted for principal approval', tone: 'info' }] } : p));
    addAudit('Planner', 'Plan revision submitted', id);
  }, [actor, addAudit]);

  const decidePlan = useCallback((id: string, approve: boolean, note: string) => {
    setPlans((list) => list.map((p) => {
      if (p.id === id) {
        return approve ?
        { ...p, status: 'published', history: [...p.history, { at: stamp(), actor, action: 'Approved', note, tone: 'success' }, { at: stamp(), actor: 'System', action: 'Published & locked; previous version superseded', tone: 'success' }] } :
        { ...p, status: 'returned', history: [...p.history, { at: stamp(), actor, action: 'Returned for changes', note, tone: 'warning' }] };
      }
      if (approve && p.status === 'published') return { ...p, status: 'superseded' };
      return p;
    }));
    addAudit('Planner', approve ? 'Plan approved & published' : 'Plan returned', id, approve ? 'info' : 'warning');
  }, [actor, addAudit]);

  const addEvent = useCallback((e: Omit<CalendarEvent, 'id'>) => {
    setEvents((list) => [...list, { ...e, id: `e-${Date.now()}` }].sort((a, b) => a.start.localeCompare(b.start)));
    addAudit('Calendar', 'Event added', e.title);
  }, [addAudit]);

  const createAssessment = useCallback((a: Omit<Assessment, 'id' | 'history' | 'stage' | 'questionIds'>) => {
    const id = `AS-${600 + Math.floor(Math.random() * 300)}`;
    setAssessments((list) => [{ ...a, id, stage: 'draft', questionIds: [], history: [{ at: stamp(), actor, action: 'Created draft' }] }, ...list]);
    addAudit('Exams', 'Assessment created', `${id} ${a.title}`);
    return id;
  }, [actor, addAudit]);

  const updateAssessment = useCallback((id: string, patch: Partial<Assessment>) => {
    setAssessments((list) => list.map((a) => a.id === id ? { ...a, ...patch } : a));
  }, []);

  const moveStage = useCallback((id: string, stage: AssessmentStage, action: string, note?: string, tone: TimelineEntry['tone'] = 'info') => {
    setAssessments((list) => list.map((a) => a.id === id ? { ...a, stage, history: [...a.history, { at: stamp(), actor, action, note, tone }] } : a));
    addAudit('Exams', action, id, stage === 'published' ? 'warning' : 'info');
  }, [actor, addAudit]);

  const setMark = useCallback((assessmentId: string, studentId: string, value: number | null) => {
    setMarks((m) => ({ ...m, [assessmentId]: { ...(m[assessmentId] ?? {}), [studentId]: value } }));
  }, []);

  const requestCorrection = useCallback((c: Omit<MarkCorrection, 'id' | 'status' | 'by'>) => {
    setCorrections((list) => [{ ...c, id: `CR-${list.length + 1}`, status: 'pending', by: actor }, ...list]);
    addAudit('Exams', 'Mark correction requested', `${c.assessmentId} · ${c.studentId} ${c.from ?? '—'} → ${c.to}`, 'warning');
  }, [actor, addAudit]);

  const decideCorrection = useCallback((id: string, approve: boolean) => {
    const c = corrections.find((x) => x.id === id);
    if (!c) return;
    if (approve) setMarks((m) => ({ ...m, [c.assessmentId]: { ...(m[c.assessmentId] ?? {}), [c.studentId]: c.to } }));
    setCorrections((list) => list.map((x) => x.id === id ? { ...x, status: approve ? 'approved' : 'rejected' } : x));
    addAudit('Exams', approve ? 'Mark correction approved' : 'Mark correction rejected', `${c.assessmentId} · ${c.studentId}`, 'warning');
  }, [corrections, addAudit]);

  const addQuestion = useCallback((q: Omit<Question, 'id' | 'usedIn' | 'version' | 'author'>) => {
    setQuestions((list) => [{ ...q, id: `q${list.length + 1}`.padEnd(3, '0'), usedIn: 0, version: 1, author: actor }, ...list]);
    addAudit('Question bank', 'Question added', q.text.slice(0, 40));
  }, [actor, addAudit]);

  const updateQuestion = useCallback((id: string, patch: Partial<Question>) => {
    setQuestions((list) => list.map((q) => q.id === id ? { ...q, ...patch } : q));
  }, []);

  const value = useMemo<AcademicContextValue>(() => ({
    topics, updateTopic, progress, periods, submitLesson, timetable, updateCell, substitutions, assignSubstitute,
    makeups, createMakeup, proposeMakeup, decideMakeup, completeMakeup, plans, createPlanDraft, submitPlan, decidePlan,
    events, addEvent, assessments, createAssessment, updateAssessment, moveStage, marks, setMark, corrections, requestCorrection, decideCorrection,
    questions, addQuestion, updateQuestion, homework
  }), [topics, updateTopic, progress, periods, submitLesson, timetable, updateCell, substitutions, assignSubstitute, makeups, createMakeup, proposeMakeup, decideMakeup, completeMakeup, plans, createPlanDraft, submitPlan, decidePlan, events, addEvent, assessments, createAssessment, updateAssessment, moveStage, marks, setMark, corrections, requestCorrection, decideCorrection, questions, addQuestion, updateQuestion, homework]);

  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
}

export function useAcademic(): AcademicContextValue {
  const ctx = useContext(AcademicContext);
  if (!ctx) throw new Error('useAcademic must be used inside AcademicProvider');
  return ctx;
}
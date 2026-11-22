export type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu';

export type CalendarEventType = 'holiday' | 'exam' | 'ct' | 'event' | 'ramadan' | 'closure' | 'term';

export interface CalendarEvent {
  id: string;
  title: string;
  bn?: string;
  type: CalendarEventType;
  start: string;
  end: string;
  campus: 'all' | string;
  note?: string;
}

export interface Term {
  id: string;
  name: string;
  start: string;
  end: string;
  workingDays: number;
}

export interface SyllabusTopic {
  id: string;
  syllabusId: string;
  chapter: number;
  chapterTitle: string;
  title: string;
  outcome: string;
  plannedPeriods: number;
  targetDate: string;
}

export interface Course {
  id: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  syllabusId?: string;
  plannedYear: number;
  plannedToDate: number;
  deliveredToDate: number;
}

export type PlanStatus = 'draft' | 'submitted' | 'approved' | 'published' | 'superseded' | 'returned';

export interface TimelineEntry {
  at: string;
  actor: string;
  action: string;
  note?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface PlanVersion {
  id: string;
  version: string;
  title: string;
  status: PlanStatus;
  author: string;
  createdOn: string;
  changeReason: string;
  changes: string[];
  history: TimelineEntry[];
}

export interface PeriodSlot {
  n: number;
  start: string;
  end: string;
}

export interface TimetableCell {
  id: string;
  sectionId: string;
  day: Day;
  period: number;
  subjectId: string;
  teacherId: string;
  roomId: string;
}

export type AttendanceMark = 'P' | 'A' | 'L' | 'LV';
export type LessonOutcome = 'completed' | 'partial' | 'missed' | 'cancelled';
export type SyncState = 'synced' | 'pending-sync' | 'needs-review';

export interface TodayPeriod {
  id: string;
  period: number;
  sectionId: string;
  subjectId: string;
  courseId: string;
  roomId: string;
  plannedTopicId: string;
  status: 'upcoming' | 'submitted';
  outcome?: LessonOutcome;
  actualTopicId?: string;
  objective: string;
  note?: string;
  reason?: string;
  attendance?: Record<string, AttendanceMark>;
  sync?: SyncState;
  submittedAt?: string;
}

export type MakeupStatus = 'gap-open' | 'proposed' | 'approved' | 'rejected' | 'completed';

export interface MakeupProposal {
  date: string;
  day: Day;
  period: number;
  roomId: string;
  teacherId: string;
}

export interface MakeupRequest {
  id: string;
  courseId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  originalDate: string;
  originalPeriod: number;
  reason: string;
  topicId: string;
  status: MakeupStatus;
  proposal?: MakeupProposal;
  history: TimelineEntry[];
}

export type AssessmentStage = 'draft' | 'moderation' | 'scheduled' | 'marking' | 'verification' | 'published';
export type AssessmentType = 'CT' | 'Half-Yearly' | 'Annual' | 'Quiz';

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  subjectId: string;
  sectionIds: string[];
  teacherId: string;
  moderatorId: string;
  date: string;
  startTime: string;
  durationMin: number;
  totalMarks: number;
  weight: number;
  roomId: string;
  topicIds: string[];
  questionIds: string[];
  stage: AssessmentStage;
  history: TimelineEntry[];
}

export type QuestionType = 'MCQ' | 'CQ' | 'Short';

export interface Question {
  id: string;
  subjectId: string;
  syllabusId: string;
  topicId: string;
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'approved' | 'needs-review' | 'draft';
  usedIn: number;
  version: number;
  author: string;
}

export interface Homework {
  id: string;
  sectionId: string;
  subjectId: string;
  title: string;
  assignedOn: string;
  due: string;
  teacherId: string;
  submissions: number;
}
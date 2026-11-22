import type { Course, SyllabusTopic } from '../types/academic';
import { TODAY, pct } from './format';

export interface CourseCoverage {
  courseId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  plannedYear: number;
  plannedToDate: number;
  delivered: number;
  pct: number;
  gap: number;
  status: 'on-track' | 'slightly-behind' | 'behind';
  topicLevel: boolean;
}

export type TopicStatus = 'completed' | 'in-progress' | 'behind' | 'not-started';

export function topicStatus(topic: SyllabusTopic, delivered: number): TopicStatus {
  if (delivered >= topic.plannedPeriods) return 'completed';
  const overdue = topic.targetDate < TODAY;
  if (overdue) return 'behind';
  return delivered > 0 ? 'in-progress' : 'not-started';
}

export function coverageStatus(p: number): CourseCoverage['status'] {
  if (p >= 95) return 'on-track';
  if (p >= 88) return 'slightly-behind';
  return 'behind';
}

export function computeCoverage(course: Course, topics: SyllabusTopic[], progress: Record<string, Record<string, number>>): CourseCoverage {
  if (course.syllabusId) {
    const list = topics.filter((t) => t.syllabusId === course.syllabusId);
    const prog = progress[course.id] ?? {};
    const plannedYear = list.reduce((s, t) => s + t.plannedPeriods, 0);
    const plannedToDate = list.filter((t) => t.targetDate <= TODAY).reduce((s, t) => s + t.plannedPeriods, 0);
    const delivered = list.reduce((s, t) => s + Math.min(prog[t.id] ?? 0, t.plannedPeriods), 0);
    const p = Math.min(100, pct(delivered, plannedToDate));
    return { courseId: course.id, sectionId: course.sectionId, subjectId: course.subjectId, teacherId: course.teacherId, plannedYear, plannedToDate, delivered, pct: p, gap: Math.max(0, plannedToDate - delivered), status: coverageStatus(p), topicLevel: true };
  }
  const p = Math.min(100, pct(course.deliveredToDate, course.plannedToDate));
  return { courseId: course.id, sectionId: course.sectionId, subjectId: course.subjectId, teacherId: course.teacherId, plannedYear: course.plannedYear, plannedToDate: course.plannedToDate, delivered: course.deliveredToDate, pct: p, gap: Math.max(0, course.plannedToDate - course.deliveredToDate), status: coverageStatus(p), topicLevel: false };
}
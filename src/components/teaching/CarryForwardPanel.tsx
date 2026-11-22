import React from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../common/Panel';
import { StatusBadge } from '../common/StatusBadge';
import { CoverageBar } from '../common/CoverageBar';
import { SubjectChip } from '../common/SubjectChip';
import { useAcademic } from '../../contexts/AcademicContext';
import { courses } from '../../data/academic';
import { computeCoverage, topicStatus } from '../../utils/coverage';
import { sectionLabel } from '../../utils/timetable';
import { formatDate } from '../../utils/format';

/** Teacher's own courses: coverage, carry-forward topics and open gaps. */
export function CarryForwardPanel({ teacherId }: {teacherId: string;}) {
  const { topics, progress, makeups } = useAcademic();
  const mine = courses.filter((c) => c.teacherId === teacherId);
  const gaps = makeups.filter((m) => m.teacherId === teacherId && (m.status === 'gap-open' || m.status === 'proposed' || m.status === 'approved'));

  const carry = mine.flatMap((c) => {
    const list = topics.filter((t) => t.syllabusId === c.syllabusId);
    return list.
    map((t) => ({ course: c, topic: t, delivered: progress[c.id]?.[t.id] ?? 0 })).
    filter((x) => topicStatus(x.topic, x.delivered) === 'behind' || topicStatus(x.topic, x.delivered) === 'in-progress');
  });

  return (
    <Panel title="My syllabus & carry-forward" description="Updated live from submitted lessons" flush>
      <ul className="divide-y divide-border">
        {mine.map((c) => {
          const cov = computeCoverage(c, topics, progress);
          return (
            <li key={c.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 px-4 py-2">
              <span className="text-[13px] font-semibold">{sectionLabel(c.sectionId)} <SubjectChip id={c.subjectId} className="text-[11px] font-normal" /></span>
              <CoverageBar delivered={cov.delivered} plannedToDate={cov.plannedToDate} plannedYear={cov.plannedYear} />
              <StatusBadge status={cov.status} label={`${cov.pct}%`} />
            </li>);

        })}
      </ul>
      <div className="border-t border-border px-4 py-2.5">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">Carry forward</p>
        {carry.length === 0 ?
        <p className="text-xs text-muted-foreground">Nothing behind — great work.</p> :

        <ul className="space-y-1.5">
            {carry.map(({ course, topic, delivered }) =>
          <li key={course.id + topic.id} className="flex items-center gap-2 text-[12.5px]">
                <StatusBadge status={topicStatus(topic, delivered)} />
                <span className="min-w-0 flex-1 truncate"><b className="font-medium">{sectionLabel(course.sectionId)}</b> · {topic.title}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground tabular">{delivered}/{topic.plannedPeriods} · due {formatDate(topic.targetDate, 'd MMM')}</span>
              </li>
          )}
          </ul>
        }
      </div>
      {gaps.length > 0 &&
      <div className="border-t border-border px-4 py-2.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">Makeup classes</p>
          <ul className="space-y-1.5">
            {gaps.map((g) =>
          <li key={g.id} className="flex items-center gap-2 text-[12.5px]">
                <StatusBadge status={g.status} />
                <span className="min-w-0 flex-1 truncate">{g.id} · {sectionLabel(g.sectionId)} {g.subjectId}</span>
                <Link to="/makeup" className="shrink-0 text-xs font-medium text-primary hover:underline">Open</Link>
              </li>
          )}
          </ul>
        </div>
      }
    </Panel>);

}
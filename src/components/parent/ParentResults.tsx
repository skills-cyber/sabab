import React from 'react';
import { Lock } from 'lucide-react';
import { Panel } from '../common/Panel';
import { SubjectChip } from '../common/SubjectChip';
import { EmptyState } from '../common/EmptyState';
import { Notice } from '../common/Notice';
import { useAcademic } from '../../contexts/AcademicContext';
import type { Student } from '../../types/school';
import { gradeFor, markStats } from '../../utils/grades';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

/** Only PUBLISHED results for THIS linked child are ever shown. */
export function ParentResults({ child, compact }: {child: Student;compact?: boolean;}) {
  const { assessments, marks } = useAcademic();
  const mine = assessments.filter((a) => a.sectionIds.includes(child.sectionId));
  const published = mine.filter((a) => a.stage === 'published' && typeof marks[a.id]?.[child.id] === 'number');
  const pending = mine.filter((a) => a.stage !== 'published');

  return (
    <Panel title="Results" description="Published by the school" flush>
      {published.length === 0 ? <EmptyState title="No published results yet" /> :
      <ul className="divide-y divide-border">
          {published.slice(0, compact ? 3 : undefined).map((a) => {
          const m = marks[a.id][child.id] as number;
          const g = gradeFor(m, a.totalMarks);
          const avg = markStats(Object.values(marks[a.id]), a.totalMarks).avg;
          return (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                <div className="min-w-0">
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground"><SubjectChip id={a.subjectId} /> {formatDate(a.date, 'd MMM')} · class avg {avg}</p>
                </div>
                <div className="text-right">
                  <p className="tabular"><b className="text-base">{m}</b><span className="text-muted-foreground">/{a.totalMarks}</span></p>
                  <p className={cn('text-[11.5px] font-semibold', g.grade === 'F' ? 'text-danger' : g.grade.startsWith('A') ? 'text-success' : 'text-foreground')}>{g.grade} · GP {g.gp.toFixed(1)}</p>
                </div>
              </li>);

        })}
        </ul>
      }
      {!compact && pending.length > 0 &&
      <div className="border-t border-border p-3">
          <Notice kind="locked"><span className="inline-flex items-center gap-1"><Lock className="size-3" /> {pending.length} assessment(s) not yet published</span> — marks stay hidden until the school verifies and releases them.</Notice>
        </div>
      }
    </Panel>);

}
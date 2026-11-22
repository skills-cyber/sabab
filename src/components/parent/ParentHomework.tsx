import React from 'react';
import { Panel } from '../common/Panel';
import { SubjectChip } from '../common/SubjectChip';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { useAcademic } from '../../contexts/AcademicContext';
import { teachers } from '../../data/school';
import type { Student } from '../../types/school';
import { formatDate, relativeDay, TODAY } from '../../utils/format';

export function ParentHomework({ child, limit }: {child: Student;limit?: number;}) {
  const { homework } = useAcademic();
  const list = homework.filter((h) => h.sectionId === child.sectionId).sort((a, b) => a.due.localeCompare(b.due)).slice(0, limit);
  return (
    <Panel title="Homework" description="Assigned by teachers · due soonest first" flush>
      {list.length === 0 ? <EmptyState title="No homework" hint="Nothing assigned right now." /> :
      <ul className="divide-y divide-border">
          {list.map((h) =>
        <li key={h.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-[13px]">
              <div className="min-w-0">
                <p className="font-medium">{h.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground"><SubjectChip id={h.subjectId} /> {teachers.find((t) => t.id === h.teacherId)?.name} · assigned {formatDate(h.assignedOn, 'd MMM')}</p>
              </div>
              <span className="shrink-0 text-right">
                <StatusBadge status={h.due < TODAY ? 'overdue' : h.due === TODAY || relativeDay(h.due) === 'Tomorrow' ? 'pending' : 'upcoming'} label={`Due ${relativeDay(h.due).toLowerCase()}`} />
                <span className="mt-0.5 block text-[11px] text-muted-foreground tabular">{formatDate(h.due, 'EEE d MMM')}</span>
              </span>
            </li>
        )}
        </ul>
      }
    </Panel>);

}
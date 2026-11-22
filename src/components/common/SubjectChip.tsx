import React from 'react';
import { subjects } from '../../data/school';
import { useSubjectList } from '../../contexts/StaffContext';
import { subjectToneDot } from '../../utils/tones';
import { cn } from '../../utils/cn';

export function subjectName(id: string): string {
  return subjects.find((s) => s.id === id)?.name ?? id;
}

export function SubjectChip({ id, full, className }: {id: string;full?: boolean;className?: string;}) {
  const list = useSubjectList();
  const s = list.find((x) => x.id === id);
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]', className)}>
      <span className={cn('size-2 shrink-0 rounded-sm', s ? subjectToneDot[s.tone] : 'bg-subtle')} aria-hidden />
      {full ? s?.name ?? id : s?.short ?? id}
    </span>);

}
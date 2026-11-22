import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Panel } from '../common/Panel';
import { StatusBadge, ToneChip } from '../common/StatusBadge';
import { Notice } from '../common/Notice';
import { Checkbox } from '../ui/Checkbox';
import { useAcademic } from '../../contexts/AcademicContext';
import type { Assessment } from '../../types/academic';
import { topicStatus } from '../../utils/coverage';
import { cn } from '../../utils/cn';

const SYLLABUS: Record<string, string> = { MATH: 'G8-MATH', HMATH: 'G9-HMATH' };

/** Scope (approved syllabus topics) + paper (questions from the bank) for a draft assessment. */
export function PaperBuilder({ assessment }: {assessment: Assessment;}) {
  const { topics, questions, progress, updateAssessment } = useAcademic();
  const editable = assessment.stage === 'draft';
  const syllabusId = SYLLABUS[assessment.subjectId];
  const scopeTopics = topics.filter((t) => t.syllabusId === syllabusId);
  const courseId = `${assessment.sectionIds[0]}-${assessment.subjectId}`;
  const inPaper = questions.filter((q) => assessment.questionIds.includes(q.id));
  const paperMarks = inPaper.reduce((s, q) => s + q.marks, 0);
  const bank = questions.filter((q) => assessment.topicIds.includes(q.topicId) && !assessment.questionIds.includes(q.id));

  const toggleTopic = (id: string, on: boolean) => updateAssessment(assessment.id, { topicIds: on ? [...assessment.topicIds, id] : assessment.topicIds.filter((x) => x !== id) });
  const setQuestions = (ids: string[]) => updateAssessment(assessment.id, { questionIds: ids });

  if (!syllabusId) {
    return <Panel title="Scope & paper"><Notice kind="preview">Topic-linked papers are enabled for Mathematics in this sample. For {assessment.subjectId}, the teacher uploads the paper as an attachment (designed).</Notice></Panel>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="1 · Syllabus scope" description={`${assessment.topicIds.length} topics selected · from approved plan`} flush>
        <ul className="max-h-[420px] divide-y divide-border overflow-y-auto scrollbar-thin">
          {scopeTopics.map((t) => {
            const st = topicStatus(t, progress[courseId]?.[t.id] ?? 0);
            const on = assessment.topicIds.includes(t.id);
            return (
              <li key={t.id}>
                <label className={cn('flex items-center gap-2.5 px-4 py-1.5 text-[12.5px]', editable && 'cursor-pointer hover:bg-muted/50')}>
                  <Checkbox checked={on} disabled={!editable} onCheckedChange={(v) => toggleTopic(t.id, v === true)} />
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  <StatusBadge status={st} />
                </label>
              </li>);

          })}
        </ul>
        {assessment.topicIds.some((id) => {const t = topics.find((x) => x.id === id);return t && topicStatus(t, progress[courseId]?.[t.id] ?? 0) !== 'completed' && t.targetDate > assessment.date;}) &&
        <Notice kind="warning" className="m-3">Some selected topics are planned after the test date — students may not have been taught them yet.</Notice>
        }
      </Panel>

      <Panel title="2 · Paper" description={`${inPaper.length} questions · ${paperMarks}/${assessment.totalMarks} marks`} actions={<StatusBadge status={paperMarks === assessment.totalMarks ? 'on-track' : 'slightly-behind'} label={paperMarks === assessment.totalMarks ? 'Marks balanced' : `${assessment.totalMarks - paperMarks} marks to go`} />} flush>
        <ul className="divide-y divide-border">
          {inPaper.length === 0 && <li className="px-4 py-4 text-xs text-muted-foreground">No questions yet. Add from the bank below.</li>}
          {inPaper.map((q, i) =>
          <li key={q.id} className="flex items-start gap-2 px-4 py-2 text-[12.5px]">
              <span className="w-5 shrink-0 font-semibold tabular">{i + 1}.</span>
              <span className="min-w-0 flex-1"><span className="line-clamp-2">{q.text}</span><span className="mt-0.5 flex gap-1.5"><ToneChip tone="neutral">{q.type}</ToneChip><ToneChip tone="neutral">{q.marks} marks</ToneChip></span></span>
              {editable && <button type="button" aria-label="Remove question" onClick={() => setQuestions(assessment.questionIds.filter((x) => x !== q.id))} className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-subtle hover:bg-danger-bg hover:text-danger"><Minus className="size-3.5" /></button>}
            </li>
          )}
        </ul>
        {editable &&
        <div className="border-t border-border">
            <p className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Bank · matching scope</p>
            <ul className="max-h-56 divide-y divide-border overflow-y-auto scrollbar-thin">
              {bank.length === 0 && <li className="px-4 py-3 text-xs text-muted-foreground">Select topics to see matching questions.</li>}
              {bank.map((q) =>
            <li key={q.id} className="flex items-center gap-2 px-4 py-1.5 text-[12.5px]">
                  <span className="min-w-0 flex-1 truncate">{q.text}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{q.type} · {q.marks}m</span>
                  {q.status !== 'approved' ? <StatusBadge status={q.status} /> :
              <button type="button" aria-label="Add question" onClick={() => setQuestions([...assessment.questionIds, q.id])} className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-primary hover:bg-accent"><Plus className="size-3.5" /></button>
              }
                </li>
            )}
            </ul>
          </div>
        }
      </Panel>
    </div>);

}
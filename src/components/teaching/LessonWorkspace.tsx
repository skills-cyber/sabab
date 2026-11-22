import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, CloudUpload, Lock, Save, Send, Target } from 'lucide-react';
import { toast } from 'sonner';
import type { LessonOutcome, TodayPeriod } from '../../types/academic';
import { useLessonForm } from './useLessonForm';
import { AttendanceGrid } from './AttendanceGrid';
import { Panel } from '../common/Panel';
import { Field } from '../common/Field';
import { Segmented } from '../common/Segmented';
import { SelectField } from '../common/SelectField';
import { StatusBadge } from '../common/StatusBadge';
import { SubjectChip, subjectName } from '../common/SubjectChip';
import { CoverageBar } from '../common/CoverageBar';
import { Notice } from '../common/Notice';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { periodSlots, rooms } from '../../data/school';
import { useAcademic } from '../../contexts/AcademicContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import { sectionLabel } from '../../utils/timetable';
import { cn } from '../../utils/cn';

const OUTCOMES: Array<{value: LessonOutcome;label: string;}> = [
{ value: 'completed', label: 'Completed' },
{ value: 'partial', label: 'Partial' },
{ value: 'missed', label: 'Missed' },
{ value: 'cancelled', label: 'Cancelled' }];


const REASONS = ['Teacher on leave / duty', 'School event or assembly', 'Exam duty', 'Power / facility issue', 'Weather / closure', 'Other'];

export function LessonWorkspace({ period }: {period: TodayPeriod;}) {
  const slot = periodSlots.find((s) => s.n === period.period)!;
  const header =
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm font-semibold">P{period.period} · {sectionLabel(period.sectionId)} · {subjectName(period.subjectId)}</span>
      <span className="text-xs text-muted-foreground tabular">{slot.start}–{slot.end} · {rooms.find((r) => r.id === period.roomId)?.label}</span>
    </div>;

  if (period.status === 'submitted') return <SubmittedLesson period={period} header={header} />;
  return <LessonForm period={period} header={header} />;
}

function LessonForm({ period, header }: {period: TodayPeriod;header: React.ReactNode;}) {
  const f = useLessonForm(period);
  const { online } = useApp();
  const planned = f.syllabusTopics.find((t) => t.id === period.plannedTopicId);
  const topicOptions = f.syllabusTopics.map((t) => ({ value: t.id, label: `${t.title}${t.id === period.plannedTopicId ? '  · planned' : ''}` }));

  return (
    <Panel title={header} actions={f.dirty ? <StatusBadge status="draft" label="Unsaved changes" /> : <StatusBadge status="upcoming" label="Not logged" />} flush>
      <div className="space-y-5 p-4">
        <div className="grid gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-[1fr_200px]">
          <div className="min-w-0 space-y-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle"><Target className="size-3" /> Planned for today</p>
            <p className="text-[13px] font-semibold">{planned ? `Ch ${planned.chapter} · ${planned.title}` : 'No topic planned'}</p>
            <p className="text-xs text-muted-foreground">{period.objective}</p>
          </div>
          {f.coverage &&
          <div className="space-y-1">
              <p className="flex justify-between text-[11px] text-muted-foreground"><span>Course coverage</span><StatusBadge status={f.coverage.status} label={`${f.coverage.pct}%`} /></p>
              <CoverageBar delivered={f.coverage.delivered} plannedToDate={f.coverage.plannedToDate} plannedYear={f.coverage.plannedYear} showLabel />
            </div>
          }
        </div>

        <section aria-labelledby="sec-outcome" className="space-y-2">
          <h3 id="sec-outcome" className="text-[13px] font-semibold">1 · Did the class happen?</h3>
          <Segmented ariaLabel="Lesson outcome" options={OUTCOMES} value={f.draft.outcome} onChange={(v) => f.update({ outcome: v })} />
          {f.noClass &&
          <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Reason" required error={f.errors.reason} htmlFor="reason">
                <SelectField id="reason" value={REASONS.includes(f.draft.reason) ? f.draft.reason : f.draft.reason ? 'Other' : ''} onValueChange={(v) => f.update({ reason: v })} options={REASONS.map((r) => ({ value: r, label: r }))} placeholder="Select a reason" />
              </Field>
              <Notice kind="warning" className="self-end">This will <b>not</b> count as delivered. A 1-period syllabus gap is recorded for makeup planning.</Notice>
            </div>
          }
        </section>

        {!f.noClass &&
        <>
            <section aria-labelledby="sec-att" className="space-y-2">
              <h3 id="sec-att" className="text-[13px] font-semibold">2 · Attendance <span className="font-normal text-muted-foreground">({f.roster.length} students)</span></h3>
              <AttendanceGrid students={f.roster} value={f.draft.attendance} onChange={(attendance) => f.update({ attendance })} />
              {f.errors.attendance && <p className="text-[11.5px] text-danger" role="alert">{f.errors.attendance}</p>}
            </section>

            <section aria-labelledby="sec-lesson" className="grid gap-3 sm:grid-cols-2">
              <h3 id="sec-lesson" className="text-[13px] font-semibold sm:col-span-2">3 · What was taught</h3>
              <Field label="Topic taught" bn="পাঠ্য বিষয়" required error={f.errors.topic} htmlFor="topic">
                <SelectField id="topic" value={f.draft.topicId} onValueChange={(v) => f.update({ topicId: v })} options={topicOptions} />
              </Field>
              <Field label="Class diary note" bn="ক্লাস ডায়েরি" htmlFor="note" hint={f.draft.outcome === 'partial' ? 'Remaining part will carry forward to the next period.' : 'Visible to coordinator and principal.'}>
                <Textarea id="note" rows={2} value={f.draft.note} onChange={(e) => f.update({ note: e.target.value })} placeholder="e.g. Covered converse proof; 4 students need revision" />
              </Field>
            </section>

            <section aria-labelledby="sec-hw" className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <h3 id="sec-hw" className="text-[13px] font-semibold sm:col-span-2">4 · Homework <span className="font-normal text-muted-foreground">(optional · visible to guardians)</span></h3>
              <Field label="Assignment" htmlFor="hw" error={f.errors.hw}>
                <Input id="hw" value={f.draft.hwTitle} onChange={(e) => f.update({ hwTitle: e.target.value })} placeholder="e.g. Exercise 9.2 — Q1 to Q6" />
              </Field>
              <Field label="Due" htmlFor="hwdue">
                <SelectField id="hwdue" value={f.draft.hwDue} onValueChange={(v) => f.update({ hwDue: v })} options={[{ value: '2026-11-03', label: 'Tomorrow (Tue)' }, { value: '2026-11-04', label: 'Wed 4 Nov' }, { value: '2026-11-05', label: 'Thu 5 Nov' }]} />
              </Field>
            </section>

            {f.absentees.length > 0 &&
          <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-[13px]">
                <Checkbox checked={f.draft.notify} onCheckedChange={(v) => f.update({ notify: v === true })} className="mt-0.5" />
                <span>
                  Send absence SMS to <b>{f.notifiable}</b> opted-in guardian{f.notifiable === 1 ? '' : 's'}
                  <span className="block text-xs text-muted-foreground">
                    {f.absentees.map((s) => s.name).join(', ')}{f.absentees.length > f.notifiable ? ` · ${f.absentees.length - f.notifiable} not opted in` : ''} · {f.notifiable * 2} credits
                  </span>
                </span>
              </label>
          }
          </>
        }
      </div>
      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-border bg-card/95 px-4 py-2.5 backdrop-blur">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {online ? <><span className="size-2 rounded-full bg-success" /> Online</> : <><CloudUpload className="size-3.5 text-warning" /> Offline — will save as pending sync</>}
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={f.saveDraft}><Save className="size-4" /> Save draft</Button>
          <Button onClick={f.submit}><Send className="size-4" /> Submit lesson</Button>
        </div>
      </div>
    </Panel>);

}

function SubmittedLesson({ period, header }: {period: TodayPeriod;header: React.ReactNode;}) {
  const { topics } = useAcademic();
  const { students, addAudit } = useAdmin();
  const [corr, setCorr] = useState(false);
  const topic = topics.find((t) => t.id === period.actualTopicId);
  const att = period.attendance ?? {};
  const count = (m: string) => Object.values(att).filter((v) => v === m).length;
  const absent = Object.entries(att).filter(([, v]) => v === 'A' || v === 'L').map(([id, v]) => `${students.find((s) => s.id === id)?.name} (${v})`);

  return (
    <Panel title={header} actions={<div className="flex gap-1.5"><StatusBadge status={period.outcome ?? 'completed'} /><StatusBadge status={period.sync ?? 'synced'} /></div>}>
      <div className="space-y-4">
        <dl className="grid gap-3 text-[13px] sm:grid-cols-4">
          <div><dt className="text-xs text-muted-foreground">Submitted</dt><dd className="font-medium tabular">{period.submittedAt}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Present</dt><dd className="font-medium tabular">{count('P')}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Absent / Late</dt><dd className="font-medium tabular">{count('A')} / {count('L')}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Leave</dt><dd className="font-medium tabular">{count('LV')}</dd></div>
        </dl>
        <div className="rounded-lg border border-border p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><BookMarked className="size-3.5" /> Topic taught</p>
          <p className="text-[13px] font-semibold">{period.outcome === 'missed' || period.outcome === 'cancelled' ? `Not delivered — ${period.reason}` : topic ? `Ch ${topic.chapter} · ${topic.title}` : '—'}</p>
          {period.note && <p className="mt-1 text-xs text-muted-foreground">{period.note}</p>}
        </div>
        {absent.length > 0 && <p className="text-xs text-muted-foreground"><b className="text-foreground">Exceptions:</b> {absent.join(', ')}</p>}
        <Notice kind="locked" action={<Button size="sm" variant="outline" onClick={() => setCorr(true)}><Lock className="size-3.5" /> Request correction</Button>}>
          Confirmed attendance and lesson records are locked. Corrections need a reason and coordinator review.
        </Notice>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link to="/planner/syllabus" className="font-medium text-primary hover:underline">View syllabus coverage →</Link>
          <Link to="/makeup" className={cn('font-medium text-primary hover:underline', period.outcome !== 'missed' && period.outcome !== 'cancelled' && 'hidden')}>Propose makeup →</Link>
        </div>
      </div>
      <ConfirmDialog
        open={corr}
        onOpenChange={setCorr}
        title="Request correction"
        description={`${sectionLabel(period.sectionId)} ${subjectName(period.subjectId)} · P${period.period}. The original record stays in history.`}
        reasonLabel="What needs correcting and why?"
        confirmLabel="Send request"
        onConfirm={(r) => {
          addAudit('Teaching', 'Correction requested', `${period.id} · ${r}`, 'warning');
          toast.success('Correction request sent to Mahbub Alam (coordinator)');
        }} />
      
      <span className="sr-only"><SubjectChip id={period.subjectId} /></span>
    </Panel>);

}
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Notice } from '../common/Notice';
import { useAcademic } from '../../contexts/AcademicContext';
import { useApp } from '../../contexts/AppContext';
import { courses } from '../../data/academic';
import { sectionLabel } from '../../utils/timetable';
import { subjectName } from '../common/SubjectChip';
import { formatDate } from '../../utils/format';
import { topicStatus } from '../../utils/coverage';

const DATES = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];

/** Record a cancelled/missed class up front (e.g. planned absence) — computes the syllabus impact. */
export function ReportMissedDialog({ open, onOpenChange }: {open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { createMakeup, topics, progress } = useAcademic();
  const { role } = useApp();
  const options = role === 'teacher' ? courses.filter((c) => c.teacherId === 'T01') : courses;
  const [courseId, setCourseId] = useState(options[0].id);
  const [date, setDate] = useState(DATES[1]);
  const [period, setPeriod] = useState('3');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const course = options.find((c) => c.id === courseId) ?? options[0];
  const nextTopic = topics.filter((t) => t.syllabusId === course.syllabusId).find((t) => topicStatus(t, progress[course.id]?.[t.id] ?? 0) !== 'completed');

  const submit = () => {
    if (reason.trim().length < 5) {
      setError('Describe the reason (min 5 characters).');
      return;
    }
    const id = createMakeup({ courseId: course.id, sectionId: course.sectionId, subjectId: course.subjectId, teacherId: course.teacherId, originalDate: date, originalPeriod: Number(period), reason: reason.trim(), topicId: nextTopic?.id ?? '' }, 'Class reported cancelled — syllabus gap recorded');
    toast.success(`${id} recorded`, { description: 'Next: propose a makeup slot.' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report cancelled / missed class</DialogTitle>
          <DialogDescription>It will never be counted as delivered. A gap is tracked until a makeup is completed.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Class & subject" htmlFor="rm-course" className="sm:col-span-3">
            <SelectField id="rm-course" value={course.id} onValueChange={setCourseId} options={options.map((c) => ({ value: c.id, label: `${sectionLabel(c.sectionId)} · ${subjectName(c.subjectId)}` }))} />
          </Field>
          <Field label="Date" htmlFor="rm-date" className="sm:col-span-2">
            <SelectField id="rm-date" value={date} onValueChange={setDate} options={DATES.map((d) => ({ value: d, label: formatDate(d, 'EEE d MMM') }))} />
          </Field>
          <Field label="Period" htmlFor="rm-period">
            <SelectField id="rm-period" value={period} onValueChange={setPeriod} options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: `P${n}` }))} />
          </Field>
          <Field label="Reason" required error={error} htmlFor="rm-reason" className="sm:col-span-3">
            <Textarea id="rm-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Board exam invigilation duty" />
          </Field>
        </div>
        <Notice kind="warning">Syllabus impact: <b>1 period</b>{nextTopic ? <> on <b>{nextTopic.title}</b></> : ''}. {sectionLabel(course.sectionId)} guardians are notified only after a makeup is approved.</Notice>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Record gap</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
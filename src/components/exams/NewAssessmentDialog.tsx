import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { useAcademic } from '../../contexts/AcademicContext';
import type { AssessmentType } from '../../types/academic';
import { sectionLabel } from '../../utils/timetable';
import { subjects } from '../../data/school';

const SECTION_IDS = ['7A', '8A', '8B', '9A'];

export function NewAssessmentDialog({ open, onOpenChange }: {open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { createAssessment } = useAcademic();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AssessmentType>('CT');
  const [subjectId, setSubjectId] = useState('MATH');
  const [sectionIds, setSectionIds] = useState<string[]>(['8A']);
  const [date, setDate] = useState('2026-11-11');
  const [total, setTotal] = useState('20');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setTitle('');
      setErrors({});
    }
  }, [open]);

  const save = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = 'Enter a title, e.g. “CT-4 Mathematics”.';
    if (!sectionIds.length) e.sections = 'Choose at least one section.';
    const t = Number(total);
    if (!Number.isInteger(t) || t < 5 || t > 100) e.total = '5–100 marks.';
    if (date < '2026-11-03') e.date = 'Date must be in the future.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const id = createAssessment({ title: title.trim(), type, subjectId, sectionIds, teacherId: 'T01', moderatorId: 'T09', date, startTime: '08:00', durationMin: t > 50 ? 180 : 40, totalMarks: t, weight: type === 'CT' ? 10 : 40, roomId: 'R201', topicIds: [] });
    toast.success('Draft assessment created', { description: 'Next: choose the syllabus scope and build the paper.' });
    onOpenChange(false);
    navigate(`/exams/a/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New assessment</DialogTitle>
          <DialogDescription>Starts as a draft. Scope, paper and moderation follow.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" required error={errors.title} htmlFor="na-title" className="sm:col-span-2">
            <Input id="na-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="CT-4 Science" autoFocus />
          </Field>
          <Field label="Type" htmlFor="na-type">
            <SelectField id="na-type" value={type} onValueChange={(v) => setType(v as AssessmentType)} options={[{ value: 'CT', label: 'Class test' }, { value: 'Quiz', label: 'Quiz' }, { value: 'Half-Yearly', label: 'Half-yearly exam' }, { value: 'Annual', label: 'Annual exam' }]} />
          </Field>
          <Field label="Subject" htmlFor="na-subj">
            <SelectField id="na-subj" value={subjectId} onValueChange={setSubjectId} options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
          </Field>
          <Field label="Date" required error={errors.date} htmlFor="na-date">
            <Input id="na-date" type="date" value={date} min="2026-11-03" max="2026-12-31" onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Total marks" required error={errors.total} htmlFor="na-total">
            <Input id="na-total" type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
          </Field>
          <Field label="Sections" required error={errors.sections} className="sm:col-span-2">
            <div className="flex flex-wrap gap-3">
              {SECTION_IDS.map((s) =>
              <label key={s} className="flex items-center gap-1.5 text-[13px]">
                  <Checkbox checked={sectionIds.includes(s)} onCheckedChange={(v) => setSectionIds((x) => v ? [...x, s] : x.filter((y) => y !== s))} />
                  {sectionLabel(s)}
                </label>
              )}
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Create draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, GitBranch, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge, ToneChip } from '../common/StatusBadge';
import { Segmented } from '../common/Segmented';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useAcademic } from '../../contexts/AcademicContext';
import { useApp } from '../../contexts/AppContext';
import type { Question, QuestionType } from '../../types/academic';

type TypeFilter = 'all' | QuestionType;
const diffTone = { Easy: 'success', Medium: 'warning', Hard: 'danger' } as const;

export function QuestionBankTab() {
  const { questions, topics, addQuestion, updateQuestion } = useAcademic();
  const { canApprove } = useApp();
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState<TypeFilter>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ topicId: 'm8-21', type: 'MCQ' as QuestionType, text: '', marks: '1', difficulty: 'Easy' as Question['difficulty'] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = params.get('topic');
    if (t) {
      setForm((f) => ({ ...f, topicId: t }));
      setOpen(true);
      params.delete('topic');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const rows = useMemo(() => questions.filter((q) => type === 'all' || q.type === type), [questions, type]);
  const topicTitle = (id: string) => topics.find((t) => t.id === id)?.title ?? id;

  const columns: Column<Question>[] = [
  { id: 'text', header: 'Question', cell: (q) => <div className="min-w-[260px] max-w-[460px]"><p className="line-clamp-2">{q.text}</p><p className="text-[11px] text-muted-foreground">{q.id} · v{q.version} · {q.author}</p></div> },
  { id: 'topic', header: 'Topic', mobileHidden: true, cell: (q) => <span className="text-[12px]">{topicTitle(q.topicId)}</span>, sortValue: (q) => q.topicId },
  { id: 'type', header: 'Type', cell: (q) => <ToneChip tone="neutral">{q.type}</ToneChip>, sortValue: (q) => q.type },
  {
    id: 'marks', header: 'Marks', align: 'right', sortValue: (q) => q.marks, cell: (q) => <span className="tabular">{q.marks}</span>,
    edit: {
      value: (q) => String(q.marks), type: 'number',
      lockedReason: (q) => q.usedIn > 0 ? `Used in ${q.usedIn} paper(s) — create a new version to change marks.` : null,
      onSave: (q, v) => {const n = Number(v);if (!Number.isInteger(n) || n < 1 || n > 20) return '1–20';updateQuestion(q.id, { marks: n });}
    }
  },
  { id: 'diff', header: 'Difficulty', mobileHidden: true, cell: (q) => <ToneChip tone={diffTone[q.difficulty]}>{q.difficulty}</ToneChip> },
  { id: 'used', header: 'Used', align: 'right', hideable: true, cell: (q) => <span className="tabular text-muted-foreground">{q.usedIn}</span>, sortValue: (q) => q.usedIn },
  { id: 'status', header: 'Status', cell: (q) => <StatusBadge status={q.status} />, sortValue: (q) => q.status }];


  const save = () => {
    const e: Record<string, string> = {};
    if (form.text.trim().length < 10) e.text = 'Write the full question (min 10 characters).';
    const m = Number(form.marks);
    if (!Number.isInteger(m) || m < 1 || m > 20) e.marks = '1–20';
    setErrors(e);
    if (Object.keys(e).length) return;
    const t = topics.find((x) => x.id === form.topicId)!;
    addQuestion({ subjectId: t.syllabusId.includes('HMATH') ? 'HMATH' : 'MATH', syllabusId: t.syllabusId, topicId: t.id, type: form.type, text: form.text.trim(), marks: m, difficulty: form.difficulty, status: 'draft' });
    toast.success('Question saved as draft', { description: 'A moderator must approve it before it can be used in a paper.' });
    setOpen(false);
    setForm((f) => ({ ...f, text: '' }));
  };

  return (
    <>
      <DataTable
        ariaLabel="Question bank"
        rows={rows}
        columns={columns}
        getRowId={(q) => q.id}
        searchText={(q) => `${q.text} ${q.id} ${topicTitle(q.topicId)}`}
        searchPlaceholder="Search questions or topics…"
        toolbar={<Segmented ariaLabel="Question type" value={type} onChange={setType} options={[{ value: 'all', label: 'All' }, { value: 'MCQ', label: 'MCQ' }, { value: 'CQ', label: 'Creative' }, { value: 'Short', label: 'Short' }]} />}
        toolbarRight={<Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> Add question</Button>}
        rowActions={(q) => [
        { label: 'Approve', icon: CheckCircle2, disabled: q.status === 'approved' || !canApprove, onSelect: () => {updateQuestion(q.id, { status: 'approved' });toast.success(`${q.id} approved`);} },
        { label: 'Create new version', icon: GitBranch, onSelect: () => {updateQuestion(q.id, { version: q.version + 1, status: 'draft' });toast.success(`${q.id} is now v${q.version + 1} (draft)`, { description: 'Earlier papers keep the previous version.' });} }]
        }
        pageSize={10} />
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add question</DialogTitle>
            <DialogDescription>Linked to a syllabus topic so coverage can be checked when building papers.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Topic" htmlFor="q-topic" className="sm:col-span-3">
              <SelectField id="q-topic" value={form.topicId} onValueChange={(v) => setForm({ ...form, topicId: v })} options={topics.filter((t) => t.syllabusId !== 'G7-MATH').map((t) => ({ value: t.id, label: `${t.syllabusId.replace('G', 'Class ').replace('-', ' ')} · ${t.title}` }))} />
            </Field>
            <Field label="Type" htmlFor="q-type">
              <SelectField id="q-type" value={form.type} onValueChange={(v) => setForm({ ...form, type: v as QuestionType })} options={[{ value: 'MCQ', label: 'MCQ' }, { value: 'CQ', label: 'Creative (CQ)' }, { value: 'Short', label: 'Short answer' }]} />
            </Field>
            <Field label="Marks" required error={errors.marks} htmlFor="q-marks">
              <Input id="q-marks" type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
            </Field>
            <Field label="Difficulty" htmlFor="q-diff">
              <SelectField id="q-diff" value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as Question['difficulty'] })} options={['Easy', 'Medium', 'Hard'].map((d) => ({ value: d, label: d }))} />
            </Field>
            <Field label="Question text" required error={errors.text} htmlFor="q-text" className="sm:col-span-3">
              <Textarea id="q-text" rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Bangla or English supported" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

}
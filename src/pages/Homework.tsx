import React, { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, ClipboardList, Eye, FileText, Link2, Plus, Send, Trash2, Upload, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { KpiStrip } from '../components/common/KpiStrip';
import { DataTable, type Column } from '../components/common/DataTable/DataTable';
import { StatusBadge, ToneChip } from '../components/common/StatusBadge';
import { SubjectChip } from '../components/common/SubjectChip';
import { Segmented } from '../components/common/Segmented';
import { SelectField } from '../components/common/SelectField';
import { Field } from '../components/common/Field';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PersonCell } from '../components/common/PersonCell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../components/ui/Sheet';
import { useAcademic } from '../contexts/AcademicContext';
import { useAdmin } from '../contexts/AdminContext';
import { useApp } from '../contexts/AppContext';
import { materials as seedMaterials, type LearningMaterial } from '../data/lms';
import { sections, subjects, teachers } from '../data/school';
import type { Homework as HomeworkItem } from '../types/academic';
import { sectionLabel } from '../utils/timetable';
import { TODAY, formatDate, relativeDay } from '../utils/format';
import { cn } from '../utils/cn';

type SubState = 'submitted' | 'late' | 'missing';
type Filter = 'all' | 'open' | 'closed';
const TABS = ['assignments', 'materials'];
const MY_SECTIONS = ['8A', '8B', '7A', '9A'];

export function Homework() {
  const { tab } = useParams();
  const { homework: seeded } = useAcademic();
  const { students, queueMessage } = useAdmin();
  const { role, roleInfo } = useApp();
  const isTeacher = role === 'teacher';
  const [extra, setExtra] = useState<HomeworkItem[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [subs, setSubs] = useState<Record<string, Record<string, SubState>>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [del, setDel] = useState<HomeworkItem | null>(null);
  const [form, setForm] = useState({ sectionId: '8A', subjectId: 'MATH', title: '', due: '2026-11-05' });
  const [formErr, setFormErr] = useState<string | null>(null);
  const [mats, setMats] = useState<LearningMaterial[]>(seedMaterials);
  const [matOpen, setMatOpen] = useState(false);
  const [matForm, setMatForm] = useState({ sectionId: '8A', subjectId: 'MATH', title: '', kind: 'PDF' as LearningMaterial['kind'], topic: '' });

  const [titles, setTitles] = useState<Record<string, string>>({});
  const all = useMemo(() => [...extra, ...seeded].filter((h) => !removed.includes(h.id) && (!isTeacher || h.teacherId === 'T01')).map((h) => titles[h.id] ? { ...h, title: titles[h.id] } : h), [extra, seeded, removed, isTeacher, titles]);
  const roster = (sid: string) => students.filter((s) => s.sectionId === sid && s.status === 'active').sort((a, b) => a.roll - b.roll);

  /** Deterministic seed: older assignments mostly submitted. */
  const subOf = (h: HomeworkItem, sid: string, idx: number): SubState => {
    const set = subs[h.id]?.[sid];
    if (set) return set;
    if (h.due > TODAY) return idx < h.submissions ? 'submitted' : 'missing';
    return idx < h.submissions ? idx % 7 === 3 ? 'late' : 'submitted' : 'missing';
  };
  const counts = (h: HomeworkItem) => {
    const r = roster(h.sectionId);
    const st = r.map((s, i) => subOf(h, s.id, i));
    return { total: r.length, done: st.filter((x) => x !== 'missing').length, late: st.filter((x) => x === 'late').length };
  };

  if (!TABS.includes(tab ?? '')) return <Navigate to="/lms/assignments" replace />;

  const rows = all.filter((h) => filter === 'all' || (filter === 'open' ? h.due >= TODAY : h.due < TODAY));
  const viewing = all.find((h) => h.id === viewId);
  const sectionOpts = (isTeacher ? sections.filter((s) => MY_SECTIONS.includes(s.id)) : sections.filter((s) => s.campusId === 'mirpur')).map((s) => ({ value: s.id, label: s.label }));
  const subjectOpts = (isTeacher ? subjects.filter((s) => ['MATH', 'HMATH'].includes(s.id)) : subjects).map((s) => ({ value: s.id, label: s.name }));

  const create = () => {
    if (form.title.trim().length < 4) return setFormErr('Give the assignment a clear title.');
    if (form.due < TODAY) return setFormErr('Due date cannot be in the past.');
    const h: HomeworkItem = { id: `HW-${Date.now().toString().slice(-4)}`, sectionId: form.sectionId, subjectId: form.subjectId, title: form.title.trim(), assignedOn: TODAY, due: form.due, teacherId: isTeacher ? 'T01' : 'T09', submissions: 0 };
    setExtra((x) => [h, ...x]);
    setNewOpen(false);
    toast.success('Assignment published', { description: `${sectionLabel(h.sectionId)} · visible to students and guardians` });
  };

  const setSub = (h: HomeworkItem, sid: string, v: SubState) => setSubs((s) => ({ ...s, [h.id]: { ...s[h.id], [sid]: v } }));

  const remindMissing = (h: HomeworkItem) => {
    const r = roster(h.sectionId);
    const missing = r.filter((s, i) => subOf(h, s.id, i) === 'missing' && s.smsOptIn);
    if (!missing.length) return toast.info('No opted-in guardians with missing work.');
    queueMessage({ channel: 'SMS', audience: `${sectionLabel(h.sectionId)} · missing “${h.title}”`, recipients: missing.length, template: 'Custom', body: `Homework “${h.title}” is pending. Due ${formatDate(h.due, 'd MMM')}.`, credits: missing.length });
    toast.success(`Reminder queued to ${missing.length} guardians`);
  };

  const columns: Column<HomeworkItem>[] = [
  { id: 'title', header: 'Assignment', sortValue: (h) => h.title, cell: (h) => <div className="min-w-[220px]"><p className="font-medium">{h.title}</p><p className="text-[11px] text-muted-foreground">{h.id} · {teachers.find((t) => t.id === h.teacherId)?.name}</p></div>, edit: { value: (h) => h.title, lockedReason: (h) => h.due < TODAY ? 'Closed assignments cannot be renamed.' : null, onSave: (h, v) => {if (v.trim().length < 4) return 'Min 4 characters';setTitles((t) => ({ ...t, [h.id]: v.trim() }));} } },
  { id: 'class', header: 'Class', sortValue: (h) => h.sectionId, cell: (h) => <span className="inline-flex items-center gap-1.5"><b className="font-semibold">{sectionLabel(h.sectionId)}</b><SubjectChip id={h.subjectId} /></span> },
  { id: 'assigned', header: 'Assigned', mobileHidden: true, sortValue: (h) => h.assignedOn, cell: (h) => <span className="whitespace-nowrap tabular text-muted-foreground">{formatDate(h.assignedOn, 'd MMM')}</span> },
  { id: 'due', header: 'Due', sortValue: (h) => h.due, cell: (h) => <span className="whitespace-nowrap tabular">{formatDate(h.due, 'EEE d MMM')}<span className="block text-[11px] text-muted-foreground">{relativeDay(h.due)}</span></span> },
  {
    id: 'subs', header: 'Submitted', align: 'right', sortValue: (h) => counts(h).done / Math.max(1, counts(h).total),
    cell: (h) => {const c = counts(h);const p = c.total ? Math.round(c.done / c.total * 100) : 0;return <span className="inline-flex items-center gap-2"><span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block"><span className={cn('block h-full rounded-full', p >= 80 ? 'bg-success' : p >= 50 ? 'bg-warning' : 'bg-danger')} style={{ width: `${p}%` }} /></span><span className="tabular">{c.done}/{c.total}</span></span>;}
  },
  { id: 'status', header: 'Status', cell: (h) => <StatusBadge status={h.due < TODAY ? 'closed' : h.due === TODAY ? 'pending' : 'open'} label={h.due < TODAY ? 'Closed' : h.due === TODAY ? 'Due today' : 'Open'} /> }];


  const matColumns: Column<LearningMaterial>[] = [
  { id: 'title', header: 'Material', sortValue: (m) => m.title, cell: (m) => <div className="flex min-w-[220px] items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">{m.kind === 'Link' || m.kind === 'Video' ? <Link2 className="size-4" /> : <FileText className="size-4" />}</span><span><span className="block font-medium">{m.title}</span><span className="text-[11px] text-muted-foreground">{m.topic}</span></span></div>, edit: { value: (m) => m.title, onSave: (m, v) => {if (v.trim().length < 3) return 'Too short';setMats((l) => l.map((x) => x.id === m.id ? { ...x, title: v.trim() } : x));} } },
  { id: 'class', header: 'Class', cell: (m) => <span className="inline-flex items-center gap-1.5"><b className="font-semibold">{sectionLabel(m.sectionId)}</b><SubjectChip id={m.subjectId} /></span> },
  { id: 'kind', header: 'Type', cell: (m) => <ToneChip tone={m.kind === 'Video' ? 'info' : m.kind === 'Worksheet' ? 'warning' : 'neutral'}>{m.kind}</ToneChip> },
  { id: 'by', header: 'Uploaded', mobileHidden: true, sortValue: (m) => m.uploadedOn, cell: (m) => <span className="text-[12.5px]">{m.uploadedBy}<span className="block text-[11px] text-muted-foreground">{formatDate(m.uploadedOn, 'd MMM')}</span></span> },
  { id: 'views', header: 'Views', align: 'right', sortValue: (m) => m.views, cell: (m) => <span className="tabular">{m.views}</span> }];


  const openCount = all.filter((h) => h.due >= TODAY).length;
  const totals = all.reduce((acc, h) => {const c = counts(h);return { done: acc.done + c.done, total: acc.total + c.total, late: acc.late + c.late };}, { done: 0, total: 0, late: 0 });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Homework & LMS"
        bn="বাড়ির কাজ ও শিখন"
        description={isTeacher ? `${roleInfo.user} · your classes` : 'Mirpur campus · all classes'}
        actions={tab === 'assignments' ? <Button size="sm" onClick={() => {setForm({ sectionId: sectionOpts[0]?.value ?? '8A', subjectId: subjectOpts[0]?.value ?? 'MATH', title: '', due: '2026-11-05' });setFormErr(null);setNewOpen(true);}}><Plus className="size-4" /> New assignment</Button> : <Button size="sm" onClick={() => setMatOpen(true)}><Upload className="size-4" /> Add material</Button>} />
      
      <UnderlineTabs layoutId="lms-tabs" tabs={[{ id: 'assignments', label: 'Assignments', to: '/lms/assignments', count: openCount || undefined }, { id: 'materials', label: 'Learning materials', to: '/lms/materials' }]} />

      {tab === 'assignments' &&
      <>
          <KpiStrip
          items={[
          { label: 'Open assignments', value: openCount, sub: 'Accepting submissions', icon: ClipboardList, tone: 'primary', onClick: () => setFilter('open') },
          { label: 'Submission rate', value: `${totals.total ? Math.round(totals.done / totals.total * 100) : 0}%`, sub: `${totals.done} of ${totals.total}`, icon: CheckCircle2, tone: 'success' },
          { label: 'Late submissions', value: totals.late, sub: 'Flagged automatically', icon: Users, tone: 'warning' },
          { label: 'Materials shared', value: mats.length, sub: 'Linked to topics', icon: BookOpen, tone: 'info' }]
          } />
        
          <DataTable
          ariaLabel="Assignments"
          rows={rows}
          columns={columns}
          getRowId={(h) => h.id}
          onRowClick={(h) => setViewId(h.id)}
          searchText={(h) => `${h.title} ${h.id} ${sectionLabel(h.sectionId)} ${h.subjectId}`}
          searchPlaceholder="Assignment, class or subject…"
          toolbar={<Segmented ariaLabel="Status" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]} />}
          rowActions={(h) => [
          { label: 'Review submissions', icon: Eye, onSelect: () => setViewId(h.id) },
          { label: 'Remind missing', icon: Send, disabled: h.due < TODAY, onSelect: () => remindMissing(h) },
          { label: 'Delete assignment', icon: Trash2, destructive: true, separatorBefore: true, disabled: counts(h).done > 0, onSelect: () => setDel(h) }]
          }
          emptyTitle="No assignments"
          emptyHint="Assign homework here or while submitting a lesson in My Teaching Day."
          footerNote="Assignments with submissions cannot be deleted" />
        
        </>
      }

      {tab === 'materials' &&
      <DataTable
        ariaLabel="Learning materials"
        rows={mats.filter((m) => !isTeacher || MY_SECTIONS.includes(m.sectionId))}
        columns={matColumns}
        getRowId={(m) => m.id}
        searchText={(m) => `${m.title} ${m.topic} ${m.subjectId}`}
        searchPlaceholder="Title or topic…"
        rowActions={(m) => [
        { label: 'Preview', icon: Eye, onSelect: () => toast.info('File preview', { description: 'Storage and viewer require backend (designed).' }) },
        { label: 'Remove', icon: Trash2, destructive: true, separatorBefore: true, onSelect: () => {setMats((l) => l.filter((x) => x.id !== m.id));toast.success('Material removed', { action: { label: 'Undo', onClick: () => setMats((l) => [m, ...l]) } });} }]
        }
        footerNote="File uploads are simulated" />

      }

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New assignment</DialogTitle>
            <DialogDescription>Students and guardians see it immediately in their portal.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Class" htmlFor="hw-sec"><SelectField id="hw-sec" value={form.sectionId} onValueChange={(v) => setForm({ ...form, sectionId: v })} options={sectionOpts} /></Field>
            <Field label="Subject" htmlFor="hw-sub"><SelectField id="hw-sub" value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })} options={subjectOpts} /></Field>
            <Field label="Title" required error={formErr} htmlFor="hw-title" className="sm:col-span-2"><Input id="hw-title" value={form.title} onChange={(e) => {setForm({ ...form, title: e.target.value });setFormErr(null);}} placeholder="Exercise 10.2 — Q1 to Q8" autoFocus /></Field>
            <Field label="Due date" required htmlFor="hw-due"><Input id="hw-due" type="date" min={TODAY} value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={create}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={matOpen} onOpenChange={setMatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add learning material</DialogTitle>
            <DialogDescription>Link a file or URL to a syllabus topic.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Class" htmlFor="mt-sec"><SelectField id="mt-sec" value={matForm.sectionId} onValueChange={(v) => setMatForm({ ...matForm, sectionId: v })} options={sectionOpts} /></Field>
            <Field label="Type" htmlFor="mt-kind"><SelectField id="mt-kind" value={matForm.kind} onValueChange={(v) => setMatForm({ ...matForm, kind: v as LearningMaterial['kind'] })} options={['PDF', 'Video', 'Link', 'Slides', 'Worksheet'].map((k) => ({ value: k, label: k }))} /></Field>
            <Field label="Title" required htmlFor="mt-title" className="sm:col-span-2"><Input id="mt-title" value={matForm.title} onChange={(e) => setMatForm({ ...matForm, title: e.target.value })} /></Field>
            <Field label="Topic" htmlFor="mt-topic" className="sm:col-span-2"><Input id="mt-topic" value={matForm.topic} onChange={(e) => setMatForm({ ...matForm, topic: e.target.value })} placeholder="10.3 Tangents" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatOpen(false)}>Cancel</Button>
            <Button disabled={matForm.title.trim().length < 3} onClick={() => {setMats((l) => [{ id: `MT-${Date.now().toString().slice(-3)}`, ...matForm, title: matForm.title.trim(), topic: matForm.topic || 'General', uploadedBy: roleInfo.user, uploadedOn: TODAY, views: 0 }, ...l]);setMatOpen(false);setMatForm({ ...matForm, title: '', topic: '' });toast.success('Material shared');}}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewId(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {viewing &&
          <>
              <SheetHeader className="border-b border-border">
                <SheetTitle>{viewing.title}</SheetTitle>
                <SheetDescription>{sectionLabel(viewing.sectionId)} · due {formatDate(viewing.due, 'EEE d MMM')} · {counts(viewing).done}/{counts(viewing).total} submitted</SheetDescription>
                <div className="flex gap-2 pt-1">
                  <Button size="xs" variant="outline" onClick={() => {setSubs((x) => ({ ...x, [viewing.id]: Object.fromEntries(roster(viewing.sectionId).map((s) => [s.id, 'submitted' as SubState])) }));toast.success('All marked submitted');}}>Mark all submitted</Button>
                  <Button size="xs" variant="outline" disabled={viewing.due < TODAY} onClick={() => remindMissing(viewing)}><Send className="size-3.5" /> Remind missing</Button>
                </div>
              </SheetHeader>
              <ul className="divide-y divide-border">
                {roster(viewing.sectionId).map((s, i) => {
                const st = subOf(viewing, s.id, i);
                const key = `${viewing.id}:${s.id}`;
                return (
                  <li key={s.id} className="space-y-1.5 px-4 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <PersonCell name={s.name} sub={`Roll ${s.roll}`} />
                        <div className="inline-flex rounded-md border border-border p-0.5" role="radiogroup" aria-label={`Submission for ${s.name}`}>
                          {(['submitted', 'late', 'missing'] as SubState[]).map((v) =>
                        <button key={v} type="button" role="radio" aria-checked={st === v} onClick={() => setSub(viewing, s.id, v)} className={cn('h-7 rounded px-2 text-[11.5px] font-medium capitalize', st === v ? v === 'submitted' ? 'bg-success-bg text-success' : v === 'late' ? 'bg-warning-bg text-warning' : 'bg-danger-bg text-danger' : 'text-muted-foreground hover:text-foreground')}>{v}</button>
                        )}
                        </div>
                      </div>
                      {st !== 'missing' &&
                    <Input aria-label={`Feedback for ${s.name}`} className="h-8 text-[12.5px]" placeholder="Feedback (optional)" value={feedback[key] ?? ''} onChange={(e) => setFeedback((f) => ({ ...f, [key]: e.target.value }))} />
                    }
                    </li>);

              })}
              </ul>
            </>
          }
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title="Delete assignment?"
        description={`“${del?.title}” will be removed from student and guardian portals.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {if (del) {setRemoved((r) => [...r, del.id]);setExtra((x) => x.filter((y) => y.id !== del.id));toast.success('Assignment deleted');}}} />
      
    </div>);

}
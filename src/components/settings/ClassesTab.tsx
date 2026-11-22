import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Archive, ArchiveRestore, CalendarDays, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { Segmented } from '../common/Segmented';
import { SelectField } from '../common/SelectField';
import { SubjectChip } from '../common/SubjectChip';
import { Panel } from '../common/Panel';
import { Notice } from '../common/Notice';
import { Meter } from '../common/Meter';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { AddSectionDialog } from './AddSectionDialog';
import { useStaff, type ManagedSection } from '../../contexts/StaffContext';
import { useAdmin } from '../../contexts/AdminContext';
import { campuses, periodSlots } from '../../data/school';
import { cn } from '../../utils/cn';

type View = 'sections' | 'subjects' | 'teachers';
const WEEKLY_SLOTS = periodSlots.length * 5;

/** Sections, the class–subject map with weekly periods, and teacher assignment with workload checks. */
export function ClassesTab() {
  const store = useStaff();
  const { students } = useAdmin();
  const navigate = useNavigate();
  const canEdit = store.canEditStructure;
  const [view, setView] = useState<View>('sections');
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const grades = useMemo(() => Array.from(new Set(store.sections.filter((s) => !s.archived).map((s) => s.grade))).sort((a, b) => a - b), [store.sections]);
  const [grade, setGrade] = useState(String(grades.includes(8) ? 8 : grades[0] ?? 1));
  const gradeSections = store.sections.filter((s) => s.grade === Number(grade) && !s.archived);
  const [sectionId, setSectionId] = useState(gradeSections[0]?.id ?? '');
  const section = store.sections.find((s) => s.id === sectionId) ?? gradeSections[0];

  const enrolled = (id: string) => students.filter((s) => s.sectionId === id && s.status === 'active').length;
  const teacherName = (id: string) => store.staff.find((t) => t.id === id)?.name ?? '—';
  const lock = canEdit ? null : 'Only the principal or owner can change classes.';

  const secCols: Column<ManagedSection>[] = [
  { id: 'label', header: 'Section', sortValue: (s) => s.grade * 100 + s.label.charCodeAt(s.label.length - 1), cell: (s) => <div><b className="font-semibold">{s.label}</b>{s.stream && <p className="text-[11px] text-muted-foreground">{s.stream}</p>}</div> },
  { id: 'campus', header: 'Campus', cell: (s) => campuses.find((c) => c.id === s.campusId)?.short },
  {
    id: 'ct', header: 'Class teacher', sortValue: (s) => teacherName(s.classTeacherId),
    cell: (s) => canEdit && !s.archived ?
    <SelectField size="sm" className="w-44" ariaLabel={`Class teacher of ${s.label}`} value={s.classTeacherId} onValueChange={(v) => {store.updateSection(s.id, { classTeacherId: v }, 'Class teacher changed');toast.success(`${teacherName(v)} is now class teacher of ${s.label}`);}} options={store.teachers.filter((t) => t.status !== 'resigned').map((t) => ({ value: t.id, label: t.name }))} /> :
    teacherName(s.classTeacherId)
  },
  { id: 'room', header: 'Home room', cell: (s) => s.room, edit: { value: (s) => s.room, lockedReason: () => lock, onSave: (s, v) => {if (!/^R?\d{3}$/i.test(v.trim())) return 'Format R101';store.updateSection(s.id, { room: v.trim().toUpperCase() }, 'Home room changed');} } },
  {
    id: 'fill', header: 'Students', align: 'right', sortValue: (s) => enrolled(s.id) / s.capacity,
    cell: (s) => {const n = enrolled(s.id);return <div className="ml-auto w-24"><p className={cn('text-[12.5px] tabular', n > s.capacity && 'text-danger')}>{n} / {s.capacity}</p><Meter value={Math.round(n / s.capacity * 100)} className="mt-1" /></div>;},
    edit: { value: (s) => String(s.capacity), type: 'number', lockedReason: () => lock, onSave: (s, v) => {const n = Number(v);if (!Number.isInteger(n) || n < 10 || n > 80) return '10–80';if (n < enrolled(s.id)) return `≥ ${enrolled(s.id)} enrolled`;store.updateSection(s.id, { capacity: n }, 'Capacity changed');} }
  },
  { id: 'subjects', header: 'Subjects', align: 'right', mobileHidden: true, cell: (s) => {const list = store.classSubjects[s.grade] ?? [];const open = list.filter((c) => !store.assignments.some((a) => a.sectionId === s.id && a.subjectId === c.subjectId)).length;return <span className="tabular">{list.length}{open > 0 && <span className="block text-[11px] text-warning">{open} without teacher</span>}</span>;} }];


  const classList = store.classSubjects[Number(grade)] ?? [];
  const periodsTotal = classList.reduce((t, c) => t + c.periods, 0);
  const sectionList = section ? store.classSubjects[section.grade] ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented ariaLabel="Classes view" value={view} onChange={setView} options={[{ value: 'sections', label: 'Sections' }, { value: 'subjects', label: 'Subjects per class' }, { value: 'teachers', label: 'Teacher assignment' }]} />
        {canEdit && <Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" /> Add section</Button>}
      </div>

      {view === 'sections' &&
      <DataTable
        ariaLabel="Sections"
        rows={store.sections.filter((s) => s.archived === showArchived)}
        columns={secCols}
        getRowId={(s) => s.id}
        searchText={(s) => `${s.label} ${s.room} ${teacherName(s.classTeacherId)}`}
        searchPlaceholder="Section, room or teacher…"
        initialSort={{ id: 'label', dir: 'asc' }}
        toolbar={<Segmented ariaLabel="Section status" size="sm" value={showArchived ? 'archived' : 'active'} onChange={(v) => setShowArchived(v === 'archived')} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />}
        rowActions={(s) => [
        { label: 'Assign teachers', icon: Users, onSelect: () => {setGrade(String(s.grade));setSectionId(s.id);setView('teachers');} },
        { label: 'View timetable', icon: CalendarDays, onSelect: () => navigate('/timetable') },
        s.archived ?
        { label: 'Restore', icon: ArchiveRestore, separatorBefore: true, disabled: !canEdit, onSelect: () => {store.updateSection(s.id, { archived: false }, 'Section restored');toast.success(`${s.label} restored`);} } :
        { label: enrolled(s.id) ? 'Archive (move students first)' : 'Archive', icon: Archive, destructive: true, separatorBefore: true, disabled: !canEdit || enrolled(s.id) > 0, onSelect: () => {store.updateSection(s.id, { archived: true }, 'Section archived');toast.success(`${s.label} archived`, { action: { label: 'Undo', onClick: () => store.updateSection(s.id, { archived: false }, 'Section restored') } });} }]
        }
        emptyTitle={showArchived ? 'No archived sections' : 'No sections yet'}
        emptyAction={canEdit && !showArchived ? <Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" /> Add section</Button> : undefined}
        footerNote="Hover room or students to edit · sections with students can’t be archived" />

      }

      {view === 'subjects' &&
      <Panel
        title={`Class ${grade} subjects`}
        description={`Applies to every section of Class ${grade} (${gradeSections.map((s) => s.label).join(', ') || 'no sections'})`}
        actions={<SelectField size="sm" className="w-32" ariaLabel="Class" value={grade} onValueChange={setGrade} options={grades.map((g) => ({ value: String(g), label: `Class ${g}` }))} />}
        flush>
        
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5 text-[13px]">
            <span><b className="tabular">{periodsTotal}</b> of {WEEKLY_SLOTS} weekly periods planned</span>
            <Meter value={Math.round(periodsTotal / WEEKLY_SLOTS * 100)} className="max-w-[200px]" />
            {periodsTotal > WEEKLY_SLOTS && <span className="flex items-center gap-1 text-danger"><AlertTriangle className="size-3.5" /> More periods than the routine has slots</span>}
          </div>
          <ul className="divide-y divide-border">
            {store.subjects.filter((s) => !s.archived).map((s) => {
            const cs = classList.find((c) => c.subjectId === s.id);
            const assigned = gradeSections.filter((sec) => store.assignments.some((a) => a.sectionId === sec.id && a.subjectId === s.id)).length;
            return (
              <li key={s.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-2 text-[13px]', !cs && 'text-muted-foreground')}>
                  <label className="flex min-w-[200px] flex-1 items-center gap-2.5">
                    <Checkbox checked={!!cs} disabled={!canEdit} aria-label={`Teach ${s.name} in Class ${grade}`}
                  onCheckedChange={(v) => {
                    if (v) {store.setClassSubject(Number(grade), s.id, s.type === 'Practical' ? 2 : 4);toast.success(`${s.name} added to Class ${grade}`, { description: 'Assign a teacher for each section next.' });} else
                    {store.setClassSubject(Number(grade), s.id, null);toast.success(`${s.name} removed from Class ${grade}`);}
                  }} />
                    <SubjectChip id={s.id} full />
                    <span className="text-[11px] text-subtle">{s.type}</span>
                  </label>
                  {cs &&
                <>
                      <span className={cn('text-[12px]', assigned < gradeSections.length ? 'text-warning' : 'text-muted-foreground')}>{assigned}/{gradeSections.length} sections have a teacher</span>
                      <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <Input type="number" min={1} max={10} disabled={!canEdit} defaultValue={cs.periods} key={`${grade}-${s.id}-${cs.periods}`} aria-label={`${s.name} periods per week`} className="h-8 w-16 text-right tabular"
                    onBlur={(e) => {const n = Number(e.target.value);if (n === cs.periods) return;if (!Number.isInteger(n) || n < 1 || n > 10) {toast.error('Periods must be 1–10 per week');e.target.value = String(cs.periods);return;}store.setClassSubject(Number(grade), s.id, n);toast.success(`${s.name}: ${n} periods/week in Class ${grade}`);}}
                    onKeyDown={(e) => {if (e.key === 'Enter') (e.target as HTMLInputElement).blur();}} />
                        / week
                      </label>
                    </>
                }
                </li>);

          })}
          </ul>
          <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Add new subjects in Settings › Subjects. Changing periods updates teacher workloads immediately; rebuild the routine in Routine & Timetable.</p>
        </Panel>
      }

      {view === 'teachers' &&
      <Panel
        title={section ? `Teachers for ${section.label}` : 'Teacher assignment'}
        description={section ? `Class teacher ${teacherName(section.classTeacherId)} · ${sectionList.length} subjects` : undefined}
        actions={
        <div className="flex gap-2">
              <SelectField size="sm" className="w-28" ariaLabel="Class" value={grade} onValueChange={(g) => {setGrade(g);setSectionId(store.sections.find((s) => s.grade === Number(g) && !s.archived)?.id ?? '');}} options={grades.map((g) => ({ value: String(g), label: `Class ${g}` }))} />
              <SelectField size="sm" className="w-24" ariaLabel="Section" value={section?.id ?? ''} onValueChange={setSectionId} options={gradeSections.map((s) => ({ value: s.id, label: s.label }))} />
            </div>
        }
        flush>
        
          {!section ? <div className="p-4"><Notice kind="info">No sections in this class.</Notice></div> : sectionList.length === 0 ? <div className="p-4"><Notice kind="info">Class {section.grade} has no subjects yet. Add them in “Subjects per class”.</Notice></div> :
        <ul className="divide-y divide-border">
              {sectionList.map((cs) => {
            const current = store.assignments.find((a) => a.sectionId === section.id && a.subjectId === cs.subjectId)?.teacherId ?? '';
            const t = store.staff.find((x) => x.id === current);
            const load = t ? store.assignedLoad(t.id) : 0;
            const over = t ? load > t.maxPeriods : false;
            const offSubject = t && !t.subjects.includes(cs.subjectId);
            const options = store.teachers.filter((x) => x.status !== 'resigned').sort((a, b) => Number(b.subjects.includes(cs.subjectId)) - Number(a.subjects.includes(cs.subjectId))).
            map((x) => ({ value: x.id, label: `${x.name}${x.subjects.includes(cs.subjectId) ? '' : ' · other subject'} · ${store.assignedLoad(x.id)}/${x.maxPeriods}` }));
            return (
              <li key={cs.subjectId} className="flex flex-wrap items-center gap-3 px-4 py-2 text-[13px]">
                    <div className="flex min-w-[160px] flex-1 items-center gap-2"><SubjectChip id={cs.subjectId} full /><span className="text-[11.5px] text-muted-foreground">{cs.periods}/wk</span></div>
                    <SelectField size="sm" className="w-64" ariaLabel={`Teacher for ${cs.subjectId}`} disabled={!canEdit} value={current || 'none'}
                onValueChange={(v) => {
                  const id = v === 'none' ? '' : v;
                  store.assign(section.id, cs.subjectId, id);
                  const nt = store.staff.find((x) => x.id === id);
                  const after = nt ? store.assignedLoad(nt.id) + (current === id ? 0 : cs.periods) : 0;
                  if (nt && after > nt.maxPeriods) toast.warning(`${nt.name} is now over their limit`, { description: `${after}/${nt.maxPeriods} periods a week.` });else
                  toast.success(id ? `${nt?.name} teaches ${cs.subjectId} in ${section.label}` : `${cs.subjectId} unassigned in ${section.label}`);
                }}
                options={[{ value: 'none', label: 'Unassigned' }, ...options]} />
                    <span className="min-w-[140px] text-[11.5px]">
                      {!t ? <span className="text-warning">No teacher</span> :
                  over ? <span className="flex items-center gap-1 text-danger"><AlertTriangle className="size-3.5" /> {load}/{t.maxPeriods} — over limit</span> :
                  offSubject ? <span className="text-warning">Not their listed subject</span> :
                  <span className="text-muted-foreground tabular">{load}/{t.maxPeriods} periods</span>}
                    </span>
                  </li>);

          })}
            </ul>
        }
        </Panel>
      }

      <AddSectionDialog open={adding} onOpenChange={setAdding} onCreated={(g) => setGrade(String(g))} />
    </div>);

}
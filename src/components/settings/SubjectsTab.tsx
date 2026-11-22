import React, { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge, ToneChip } from '../common/StatusBadge';
import { SubjectChip } from '../common/SubjectChip';
import { Segmented } from '../common/Segmented';
import { Button } from '../ui/Button';
import { SubjectDialog } from './SubjectDialog';
import { useStaff, type ManagedSubject } from '../../contexts/StaffContext';

const TYPE_TONE = { Core: 'primary', Elective: 'info', Practical: 'warning' } as const;

/** Subject catalogue — add, edit and archive subjects. */
export function SubjectsTab() {
  const store = useStaff();
  const canEdit = store.canEditStructure;
  const [showArchived, setShowArchived] = useState<'active' | 'archived'>('active');
  const [dialog, setDialog] = useState<{open: boolean;editing?: ManagedSubject | null;}>({ open: false });

  const classesOf = (id: string) => Object.entries(store.classSubjects).filter(([, l]) => l.some((c) => c.subjectId === id)).map(([g]) => Number(g)).sort((a, b) => a - b);
  const teachersOf = (id: string) => store.teachers.filter((t) => t.status !== 'resigned' && t.subjects.includes(id)).length;
  const rows = store.subjects.filter((s) => showArchived === 'archived' ? s.archived : !s.archived);

  const columns: Column<ManagedSubject>[] = [
  { id: 'name', header: 'Subject', sortValue: (s) => s.name, cell: (s) => <div><SubjectChip id={s.id} full className="font-medium" /><p lang="bn" className="font-bn text-[11.5px] text-muted-foreground">{s.bn || '—'}</p></div> },
  { id: 'code', header: 'Code', sortValue: (s) => s.short, cell: (s) => <span className="tabular text-muted-foreground">{s.short}</span> },
  { id: 'type', header: 'Type', sortValue: (s) => s.type, cell: (s) => <ToneChip tone={TYPE_TONE[s.type]}>{s.type}</ToneChip> },
  { id: 'classes', header: 'Taught in', mobileHidden: true, cell: (s) => {const g = classesOf(s.id);return g.length ? <span className="tabular">Class {g.length > 4 ? `${g[0]}–${g[g.length - 1]}` : g.join(', ')}</span> : <span className="text-warning">Not in any class</span>;} },
  { id: 'teachers', header: 'Teachers', align: 'right', mobileHidden: true, sortValue: (s) => teachersOf(s.id), cell: (s) => {const n = teachersOf(s.id);return <span className={n ? 'tabular' : 'tabular text-danger'}>{n}</span>;} },
  { id: 'status', header: 'Status', cell: (s) => <StatusBadge status={s.archived ? 'cancelled' : 'active'} label={s.archived ? 'Archived' : undefined} /> }];


  return (
    <>
      <DataTable
        ariaLabel="Subjects"
        rows={rows}
        columns={columns}
        getRowId={(s) => s.id}
        onRowClick={canEdit ? (s) => setDialog({ open: true, editing: s }) : undefined}
        searchText={(s) => `${s.name} ${s.bn} ${s.short}`}
        searchPlaceholder="Subject or code…"
        toolbar={<Segmented ariaLabel="Subject status" value={showArchived} onChange={setShowArchived} options={[{ value: 'active', label: 'Active', count: store.subjects.filter((s) => !s.archived).length }, { value: 'archived', label: 'Archived' }]} />}
        toolbarRight={canEdit ? <Button size="sm" onClick={() => setDialog({ open: true })}><Plus className="size-4" /> Add subject</Button> : undefined}
        rowActions={(s) => [
        { label: 'Edit subject', icon: Pencil, disabled: !canEdit, onSelect: () => setDialog({ open: true, editing: s }) },
        s.archived ?
        { label: 'Restore', icon: ArchiveRestore, separatorBefore: true, disabled: !canEdit, onSelect: () => {store.updateSubject(s.id, { archived: false }, 'Subject restored');toast.success(`${s.name} restored`);} } :
        { label: classesOf(s.id).length ? 'Archive (remove from classes first)' : 'Archive', icon: Archive, destructive: true, separatorBefore: true, disabled: !canEdit || classesOf(s.id).length > 0, onSelect: () => {store.updateSubject(s.id, { archived: true }, 'Subject archived');toast.success(`${s.name} archived`, { action: { label: 'Undo', onClick: () => store.updateSubject(s.id, { archived: false }, 'Subject restored') } });} }]
        }
        emptyTitle={showArchived === 'archived' ? 'No archived subjects' : 'No subjects yet'}
        emptyAction={canEdit && showArchived === 'active' ? <Button size="sm" onClick={() => setDialog({ open: true })}><Plus className="size-4" /> Add subject</Button> : undefined}
        footerNote="Subjects in use by a class can’t be archived · history and results keep the subject" />
      
      <SubjectDialog open={dialog.open} editing={dialog.editing} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} />
    </>);

}
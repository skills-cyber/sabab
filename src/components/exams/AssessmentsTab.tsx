import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, ExternalLink, Plus, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { SubjectChip } from '../common/SubjectChip';
import { Segmented } from '../common/Segmented';
import { Button } from '../ui/Button';
import { NewAssessmentDialog } from './NewAssessmentDialog';
import { useAcademic } from '../../contexts/AcademicContext';
import { useApp } from '../../contexts/AppContext';
import { useAdmin } from '../../contexts/AdminContext';
import type { Assessment } from '../../types/academic';
import { sectionLabel } from '../../utils/timetable';
import { formatDate, relativeDay, TODAY } from '../../utils/format';

type Filter = 'all' | 'active' | 'published';

export function AssessmentsTab() {
  const { assessments, marks, createAssessment } = useAcademic();
  const { students } = useAdmin();
  const { role } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('active');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.get('new') === '1') {
      setOpen(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const scoped = role === 'teacher' ? assessments.filter((a) => a.teacherId === 'T01' || a.moderatorId === 'T01') : assessments;
  const rows = useMemo(() => scoped.filter((a) => filter === 'all' || (filter === 'published' ? a.stage === 'published' : a.stage !== 'published')).sort((a, b) => a.date.localeCompare(b.date)), [scoped, filter]);
  const roster = (a: Assessment) => students.filter((s) => a.sectionIds.includes(s.sectionId) && s.status === 'active').length;
  const entered = (a: Assessment) => Object.values(marks[a.id] ?? {}).filter((v) => typeof v === 'number').length;

  const columns: Column<Assessment>[] = [
  { id: 'title', header: 'Assessment', sortValue: (a) => a.title, cell: (a) => <div className="min-w-[180px]"><p className="font-medium">{a.title}</p><p className="text-[11px] text-muted-foreground">{a.id} · {a.type === 'CT' ? 'Class test' : a.type}</p></div> },
  { id: 'subject', header: 'Subject', cell: (a) => <SubjectChip id={a.subjectId} /> },
  { id: 'sections', header: 'Sections', cell: (a) => a.sectionIds.map(sectionLabel).join(', ') },
  { id: 'date', header: 'Date', sortValue: (a) => a.date, cell: (a) => <span className="whitespace-nowrap tabular">{formatDate(a.date, 'd MMM')}<span className="block text-[11px] text-muted-foreground">{a.date >= TODAY ? relativeDay(a.date) : 'Held'}</span></span> },
  { id: 'marks', header: 'Marks', align: 'right', mobileHidden: true, cell: (a) => <span className="tabular">{a.totalMarks}<span className="block text-[11px] text-muted-foreground">{a.weight}% wt</span></span> },
  { id: 'progress', header: 'Entered', align: 'right', mobileHidden: true, hideable: true, cell: (a) => a.stage === 'marking' || a.stage === 'verification' || a.stage === 'published' ? <span className="tabular">{entered(a)}/{roster(a)}</span> : <span className="text-subtle">—</span> },
  { id: 'stage', header: 'Stage', sortValue: (a) => a.stage, cell: (a) => <StatusBadge status={a.stage} /> }];


  return (
    <>
      <DataTable
        ariaLabel="Assessments"
        rows={rows}
        columns={columns}
        getRowId={(a) => a.id}
        onRowClick={(a) => navigate(`/exams/a/${a.id}`)}
        searchText={(a) => `${a.title} ${a.id} ${a.sectionIds.join(' ')} ${a.subjectId}`}
        searchPlaceholder="Search assessments…"
        toolbar={<Segmented ariaLabel="Stage filter" value={filter} onChange={setFilter} options={[{ value: 'active', label: 'In progress', count: scoped.filter((a) => a.stage !== 'published').length }, { value: 'published', label: 'Published' }, { value: 'all', label: 'All' }]} />}
        toolbarRight={role !== 'owner' ? <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> New assessment</Button> : undefined}
        rowActions={(a) => [
        { label: 'Open', icon: ExternalLink, onSelect: () => navigate(`/exams/a/${a.id}`) },
        { label: 'Duplicate as draft', icon: Copy, onSelect: () => {const id = createAssessment({ ...a, title: `${a.title} (copy)`, date: '2026-11-12' });toast.success(`${id} created as draft`);} },
        { label: 'Print paper', icon: Printer, onSelect: () => window.print(), disabled: !a.questionIds.length, separatorBefore: true }]
        }
        emptyTitle="No assessments in this view" />
      
      <NewAssessmentDialog open={open} onOpenChange={setOpen} />
    </>);

}
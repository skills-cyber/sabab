import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, FileDown } from 'lucide-react';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { SubjectChip } from '../common/SubjectChip';
import { Panel } from '../common/Panel';
import { Notice } from '../common/Notice';
import { useAcademic } from '../../contexts/AcademicContext';
import { useAdmin } from '../../contexts/AdminContext';
import type { Assessment } from '../../types/academic';
import { gradeFor, gradeScale, markStats } from '../../utils/grades';
import { sectionLabel } from '../../utils/timetable';
import { downloadCsv, formatDate } from '../../utils/format';

export function ResultsTab() {
  const { assessments, marks } = useAcademic();
  const { students } = useAdmin();
  const navigate = useNavigate();
  const published = assessments.filter((a) => a.stage === 'published');
  const [selected, setSelected] = useState(published[0]?.id ?? '');
  const sel = published.find((a) => a.id === selected);

  const distribution = useMemo(() => {
    if (!sel) return [];
    const vals = Object.values(marks[sel.id] ?? {}).filter((v): v is number => typeof v === 'number');
    return gradeScale.map((g) => ({ grade: g.grade, n: vals.filter((v) => gradeFor(v, sel.totalMarks).grade === g.grade).length, total: vals.length }));
  }, [sel, marks]);

  const columns: Column<Assessment>[] = [
  { id: 'title', header: 'Assessment', cell: (a) => <span className="font-medium">{a.title}<span className="block text-[11px] font-normal text-muted-foreground">{a.sectionIds.map(sectionLabel).join(', ')} · {formatDate(a.date, 'd MMM')}</span></span> },
  { id: 'subject', header: 'Subject', cell: (a) => <SubjectChip id={a.subjectId} /> },
  { id: 'avg', header: 'Average', align: 'right', cell: (a) => {const s = markStats(Object.values(marks[a.id] ?? {}), a.totalMarks);return <span className="tabular">{s.avg}/{a.totalMarks}</span>;} },
  { id: 'high', header: 'High / low', align: 'right', mobileHidden: true, cell: (a) => {const s = markStats(Object.values(marks[a.id] ?? {}), a.totalMarks);return <span className="tabular">{s.high} / {s.low}</span>;} },
  { id: 'pass', header: 'Pass rate', align: 'right', cell: (a) => <span className="tabular">{markStats(Object.values(marks[a.id] ?? {}), a.totalMarks).passRate}%</span> }];


  const exportSel = () => {
    if (!sel) return;
    downloadCsv(`${sel.id}-results.csv`, students.filter((s) => sel.sectionIds.includes(s.sectionId) && s.status === 'active').map((s) => {
      const m = marks[sel.id]?.[s.id];
      return { 'Student ID': s.studentNo, Name: s.name, Section: sectionLabel(s.sectionId), Roll: s.roll, Marks: m ?? 'Absent', Grade: typeof m === 'number' ? gradeFor(m, sel.totalMarks).grade : '—' };
    }));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <DataTable
        ariaLabel="Published results"
        rows={published}
        columns={columns}
        getRowId={(a) => a.id}
        onRowClick={(a) => setSelected(a.id)}
        rowClassName={(a) => a.id === selected ? 'bg-accent/50' : ''}
        rowActions={(a) => [{ label: 'Open marks sheet', icon: ExternalLink, onSelect: () => navigate(`/exams/a/${a.id}`) }]}
        emptyTitle="No published results yet" />
      
      <div className="space-y-4">
        <Panel title="Grade distribution" description={sel ? sel.title : 'Select a result'} actions={sel && <button type="button" onClick={exportSel} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><FileDown className="size-3.5" /> CSV</button>}>
          {sel ?
          <ul className="space-y-1.5">
              {distribution.map((d) =>
            <li key={d.grade} className="grid grid-cols-[28px_1fr_28px] items-center gap-2 text-[12.5px]">
                  <span className="font-semibold">{d.grade}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${d.total ? d.n / d.total * 100 : 0}%` }} /></span>
                  <span className="text-right text-muted-foreground tabular">{d.n}</span>
                </li>
            )}
            </ul> :
          <p className="text-xs text-muted-foreground">No result selected.</p>}
        </Panel>
        <Notice kind="preview">Report cards (term weightage, GPA, bilingual A4 print) are designed; consolidated generation needs backend computation and is not interactive here.</Notice>
      </div>
    </div>);

}
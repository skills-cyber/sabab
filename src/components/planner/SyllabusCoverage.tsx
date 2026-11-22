import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, History, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '../common/Panel';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { CoverageBar } from '../common/CoverageBar';
import { Segmented } from '../common/Segmented';
import { Notice } from '../common/Notice';
import { subjectName } from '../common/SubjectChip';
import { useAcademic } from '../../contexts/AcademicContext';
import { useApp } from '../../contexts/AppContext';
import { courses } from '../../data/academic';
import { subjects, teachers } from '../../data/school';
import { computeCoverage, topicStatus } from '../../utils/coverage';
import { sectionLabel } from '../../utils/timetable';
import { formatDate } from '../../utils/format';
import type { SyllabusTopic } from '../../types/academic';
import { cn } from '../../utils/cn';

const SECTIONS = ['7A', '8A', '8B', '9A'];

const cellTone = (p: number) => p >= 95 ? 'bg-success-bg text-success' : p >= 88 ? 'bg-warning-bg text-warning' : 'bg-danger-bg text-danger';

interface TopicRow extends SyllabusTopic {
  delivered: number;
  status: ReturnType<typeof topicStatus>;
}

export function SyllabusCoverage() {
  const { topics, progress, updateTopic, questions } = useAcademic();
  const { canApprove, role } = useApp();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState('8B-MATH');
  const [filter, setFilter] = useState<'all' | 'behind' | 'open'>('all');

  const coverage = useMemo(() => courses.map((c) => computeCoverage(c, topics, progress)), [topics, progress]);
  const subjectCols = subjects.filter((s) => coverage.some((c) => c.subjectId === s.id));
  const course = courses.find((c) => c.id === courseId)!;
  const cov = coverage.find((c) => c.courseId === courseId)!;

  const rows: TopicRow[] = useMemo(() => {
    if (!course.syllabusId) return [];
    return topics.
    filter((t) => t.syllabusId === course.syllabusId).
    map((t) => {
      const delivered = progress[course.id]?.[t.id] ?? 0;
      return { ...t, delivered, status: topicStatus(t, delivered) };
    }).
    filter((r) => filter === 'behind' ? r.status === 'behind' : filter === 'open' ? r.status !== 'completed' : true);
  }, [topics, progress, course, filter]);

  const lockReason = canApprove ? null : role === 'teacher' ? 'Targets are set by the academic coordinator. Propose changes through a plan revision.' : 'Read-only for your role.';

  const columns: Column<TopicRow>[] = [
  { id: 'chapter', header: 'Ch', cell: (r) => <span className="text-muted-foreground tabular">{r.chapter}</span>, sortValue: (r) => r.chapter, className: 'w-10' },
  {
    id: 'title', header: 'Topic & outcome', cell: (r) =>
    <div className="min-w-[200px]"><p className="font-medium">{r.title}</p><p className="text-[11px] text-muted-foreground">{r.outcome}</p></div>

  },
  {
    id: 'planned', header: 'Planned', align: 'right', cell: (r) => <span className="tabular">{r.plannedPeriods}</span>, sortValue: (r) => r.plannedPeriods,
    edit: {
      value: (r) => String(r.plannedPeriods), type: 'number',
      lockedReason: () => lockReason,
      onSave: (r, v) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 30) return 'Enter 1–30 periods';
        if (n < r.delivered) return `Cannot be below ${r.delivered} delivered`;
        updateTopic(r.id, { plannedPeriods: n });
      }
    }
  },
  {
    id: 'delivered', header: 'Delivered', align: 'right', cell: (r) => <span className="tabular">{r.delivered}</span>, sortValue: (r) => r.delivered,
    edit: { value: (r) => String(r.delivered), onSave: () => undefined, lockedReason: () => 'Derived from submitted lesson logs and makeup classes — never edited directly.' }
  },
  {
    id: 'target', header: 'Target', cell: (r) => <span className="whitespace-nowrap tabular">{formatDate(r.targetDate, 'd MMM')}</span>, sortValue: (r) => r.targetDate,
    edit: {
      value: (r) => r.targetDate,
      lockedReason: () => lockReason,
      onSave: (r, v) => {
        if (!/^2026-\d{2}-\d{2}$/.test(v)) return 'Use YYYY-MM-DD within AY 2026';
        updateTopic(r.id, { targetDate: v });
      }
    }
  },
  { id: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  { id: 'questions', header: 'Qs', align: 'right', mobileHidden: true, hideable: true, cell: (r) => <span className="text-muted-foreground tabular">{questions.filter((q) => q.topicId === r.id).length}</span> }];


  return (
    <div className="space-y-4">
      <Panel title="Coverage matrix" description="Delivered ÷ planned to date · click a cell to drill in" flush>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[720px] border-collapse text-center text-[12.5px]">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="h-9 px-3 text-left text-xs font-medium text-muted-foreground">Section</th>
                {subjectCols.map((s) => <th key={s.id} scope="col" className="px-1 text-xs font-medium text-muted-foreground" title={s.name}>{s.short}</th>)}
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((sid) =>
              <tr key={sid} className="border-t border-border">
                  <th scope="row" className="px-3 py-1.5 text-left font-semibold">{sectionLabel(sid)}</th>
                  {subjectCols.map((s) => {
                  const c = coverage.find((x) => x.sectionId === sid && x.subjectId === s.id);
                  if (!c) return <td key={s.id} className="text-subtle">·</td>;
                  return (
                    <td key={s.id} className="p-0.5">
                        <button
                        type="button"
                        onClick={() => setCourseId(c.courseId)}
                        aria-pressed={courseId === c.courseId}
                        className={cn('h-8 w-full min-w-[48px] rounded-md font-semibold tabular transition', cellTone(c.pct), courseId === c.courseId && 'ring-2 ring-primary ring-offset-1 ring-offset-card')}
                        title={`${sectionLabel(sid)} ${s.name}: ${c.delivered}/${c.plannedToDate} periods`}>
                        
                          {c.pct}%{c.topicLevel && <span className="ml-0.5 align-top text-[8px]">●</span>}
                        </button>
                      </td>);

                })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">● topic-level tracking (lesson logs). Others summarise period counts. Green ≥95% · amber 88–94% · red &lt;88%.</p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Panel title={`${sectionLabel(course.sectionId)} · ${subjectName(course.subjectId)}`} description={teachers.find((t) => t.id === course.teacherId)?.name}>
          <div className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Coverage</span><StatusBadge status={cov.status} label={`${cov.pct}%`} /></div>
            <CoverageBar delivered={cov.delivered} plannedToDate={cov.plannedToDate} plannedYear={cov.plannedYear} showLabel />
            <dl className="grid grid-cols-2 gap-2">
              <div><dt className="text-xs text-muted-foreground">Gap</dt><dd className="font-semibold tabular">{cov.gap} periods</dd></div>
              <div><dt className="text-xs text-muted-foreground">Remaining (yr)</dt><dd className="font-semibold tabular">{cov.plannedYear - cov.delivered}</dd></div>
            </dl>
            {cov.gap > 0 &&
            <button type="button" onClick={() => navigate('/makeup')} className="flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-xs hover:border-primary/40">
                <RefreshCcw className="size-3.5 text-primary" /> Plan {cov.gap} makeup period{cov.gap > 1 ? 's' : ''} to recover
              </button>
            }
          </div>
        </Panel>

        {course.syllabusId ?
        <DataTable
          ariaLabel="Syllabus topics"
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          searchText={(r) => `${r.title} ${r.outcome} ${r.chapterTitle}`}
          searchPlaceholder="Search topics…"
          pageSize={25}
          toolbar={<Segmented ariaLabel="Topic filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'behind', label: 'Behind', count: topics.filter((t) => t.syllabusId === course.syllabusId && topicStatus(t, progress[course.id]?.[t.id] ?? 0) === 'behind').length }]} />}
          rowClassName={(r) => r.status === 'behind' ? 'bg-danger-bg/30' : ''}
          rowActions={(r) => [
          { label: 'Add question for topic', icon: FileQuestion, onSelect: () => navigate(`/exams/questions?topic=${r.id}`) },
          { label: 'Schedule makeup', icon: RefreshCcw, onSelect: () => navigate('/makeup?new=1'), disabled: r.status !== 'behind' },
          { label: 'View lesson history', icon: History, onSelect: () => toast.info(`${r.title}`, { description: `${r.delivered} periods logged · last on ${formatDate('2026-11-02', 'd MMM')} (sample)` }) }]
          }
          emptyTitle={filter === 'behind' ? 'Nothing behind' : 'No topics'}
          footerNote="Delivered = submitted lessons" /> :


        <Panel title="Topic-level tracking not enabled for this course">
            <Notice kind="preview">This sample tracks topic-level progress for Mathematics and Higher Mathematics only. Other courses summarise period delivery ({cov.delivered}/{cov.plannedToDate}). In production every course uses the same topic map after the syllabus is imported.</Notice>
          </Panel>
        }
      </div>
    </div>);

}
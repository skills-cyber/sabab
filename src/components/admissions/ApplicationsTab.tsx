import React, { useMemo, useState } from 'react';
import { Download, Eye, MessageSquare, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { PersonCell } from '../common/PersonCell';
import { SelectField } from '../common/SelectField';
import { Button } from '../ui/Button';
import { campuses } from '../../data/school';
import { useAdmin } from '../../contexts/AdminContext';
import type { AdmissionStage, Application } from '../../types/admissions';
import { docsComplete, type AdmissionsStore } from './useAdmissions';
import { downloadCsv, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

type StageFilter = 'all' | 'active' | AdmissionStage;

const FUNNEL: Array<{id: StageFilter;label: string;}> = [
{ id: 'applied', label: 'Applied' },
{ id: 'test-scheduled', label: 'Test scheduled' },
{ id: 'tested', label: 'Scored' },
{ id: 'offered', label: 'Offered' },
{ id: 'admitted', label: 'Admitted' },
{ id: 'waitlisted', label: 'Waitlisted' }];


interface Props {
  store: AdmissionsStore;
  campusId: string;
  canEdit: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
}

/** Pipeline funnel (click to filter) + application table. */
export function ApplicationsTab({ store, campusId, canEdit, onOpen, onNew }: Props) {
  const { queueMessage } = useAdmin();
  const [stage, setStage] = useState<StageFilter>('active');
  const [grade, setGrade] = useState('all');
  const scoped = useMemo(() => store.apps.filter((a) => campusId === 'all' || a.campusId === campusId), [store.apps, campusId]);
  const rows = useMemo(
    () => scoped.filter((a) => (grade === 'all' || String(a.grade) === grade) && (stage === 'all' || (stage === 'active' ? !['admitted', 'rejected', 'withdrawn'].includes(a.stage) : a.stage === stage))),
    [scoped, grade, stage]
  );

  const columns: Column<Application>[] = [
  { id: 'name', header: 'Applicant', sortValue: (a) => a.applicant, cell: (a) => <PersonCell name={a.applicant} bn={a.applicantBn} sub={<span className="tabular">{a.id}</span>} /> },
  { id: 'class', header: 'Class', sortValue: (a) => a.grade, cell: (a) => <span className="whitespace-nowrap">Class {a.grade} <span className="text-muted-foreground">· {campuses.find((c) => c.id === a.campusId)?.short}</span></span> },
  { id: 'guardian', header: 'Guardian', mobileHidden: true, cell: (a) => <div className="min-w-[140px]"><p className="flex items-center gap-1 font-medium">{a.guardianName}{a.siblingOf && <Users className="size-3.5 text-primary" aria-label={`Sibling of ${a.siblingOf}`} />}</p><p className="text-[11px] text-muted-foreground tabular">{a.guardianPhone}</p></div> },
  { id: 'docs', header: 'Docs', align: 'center', mobileHidden: true, sortValue: (a) => a.docs.filter((d) => d.status === 'verified').length, cell: (a) => {const req = a.docs.filter((d) => d.required);const ok = req.filter((d) => d.status === 'verified').length;return <span className={cn('tabular text-[12px]', ok === req.length ? 'text-success' : 'text-warning')}>{ok}/{req.length}</span>;} },
  { id: 'score', header: 'Score', align: 'right', sortValue: (a) => a.score ?? -1, cell: (a) => <span className="tabular">{a.score ?? '—'}</span> },
  { id: 'applied', header: 'Applied', hideable: true, sortValue: (a) => a.appliedOn, cell: (a) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(a.appliedOn, 'd MMM')}</span> },
  { id: 'source', header: 'Source', hideable: true, defaultHidden: true, cell: (a) => a.source },
  { id: 'stage', header: 'Stage', sortValue: (a) => a.stage, cell: (a) => <span className="inline-flex items-center gap-1.5"><StatusBadge status={a.stage} />{!a.formFeePaid && <span className="text-[11px] text-warning">fee due</span>}</span> }];


  const exportRows = (list: Application[]) => downloadCsv('admissions.csv', list.map((a) => ({ ID: a.id, Applicant: a.applicant, Class: a.grade, Campus: a.campusId, Guardian: a.guardianName, Phone: a.guardianPhone, Score: a.score ?? '', Stage: a.stage, DocsComplete: docsComplete(a) ? 'Yes' : 'No' })));
  const count = (s: StageFilter) => scoped.filter((a) => a.stage === s).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-card shadow-card sm:grid-cols-6" role="group" aria-label="Admission funnel">
        {FUNNEL.map((f, i) =>
        <button
          key={f.id}
          type="button"
          aria-pressed={stage === f.id}
          onClick={() => setStage(stage === f.id ? 'active' : f.id)}
          className={cn('relative px-3 py-2.5 text-left transition-colors hover:bg-muted', i > 0 && 'border-l border-border', i === 3 && 'max-sm:border-l-0 max-sm:border-t', i > 3 && 'max-sm:border-t', stage === f.id && 'bg-accent hover:bg-accent')}>
          
            <p className="text-[11px] font-medium text-muted-foreground">{f.label}</p>
            <p className={cn('text-lg font-semibold tabular leading-tight', stage === f.id && 'text-accent-foreground')}>{count(f.id)}</p>
            {stage === f.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden />}
          </button>
        )}
      </div>

      <DataTable
        ariaLabel="Applications"
        rows={rows}
        columns={columns}
        getRowId={(a) => a.id}
        onRowClick={(a) => onOpen(a.id)}
        searchText={(a) => `${a.applicant} ${a.applicantBn} ${a.id} ${a.guardianName} ${a.guardianPhone}`}
        searchPlaceholder="Applicant, ID, guardian or phone…"
        initialSort={{ id: 'applied', dir: 'desc' }}
        toolbar={
        <>
            <SelectField size="sm" className="w-32" ariaLabel="Class" value={grade} onValueChange={setGrade} options={[{ value: 'all', label: 'All classes' }, ...Array.from(new Set(store.apps.map((a) => a.grade))).sort((x, y) => x - y).map((g) => ({ value: String(g), label: `Class ${g}` }))]} />
            <SelectField size="sm" className="w-40" ariaLabel="Stage" value={stage} onValueChange={(v) => setStage(v as StageFilter)} options={[{ value: 'active', label: 'In progress' }, { value: 'all', label: 'All stages' }, ...FUNNEL.map((f) => ({ value: f.id, label: f.label })), { value: 'rejected', label: 'Rejected' }, { value: 'withdrawn', label: 'Withdrawn' }]} />
          </>
        }
        rowActions={(a) => [
        { label: 'Open application', icon: Eye, onSelect: () => onOpen(a.id) },
        { label: 'SMS guardian', icon: MessageSquare, onSelect: () => {queueMessage({ channel: 'SMS', audience: `Guardian of ${a.applicant}`, recipients: 1, template: 'Admission update', body: `Update on ${a.id}`, credits: 1 });toast.success('SMS queued');} },
        { label: 'Export row', icon: Download, onSelect: () => exportRows([a]) }]
        }
        bulkActions={(ids, clear) =>
        <>
            <Button size="xs" variant="outline" onClick={() => {queueMessage({ channel: 'SMS', audience: `${ids.length} applicant guardians`, recipients: ids.length, template: 'Admission update', body: 'Admission update from school office', credits: ids.length });toast.success(`SMS queued to ${ids.length} guardians`);clear();}}><MessageSquare className="size-3.5" /> SMS guardians</Button>
            <Button size="xs" variant="outline" onClick={() => exportRows(store.apps.filter((a) => ids.includes(a.id)))}><Download className="size-3.5" /> Export</Button>
          </>
        }
        emptyTitle="No applications match"
        emptyAction={canEdit ? <Button size="sm" onClick={onNew}><Plus className="size-4" /> New application</Button> : undefined}
        footerNote="Fictional sample applicants · session 2027" />
      
    </div>);

}
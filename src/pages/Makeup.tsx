import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck2, CalendarPlus, CheckCheck, History, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { KpiStrip } from '../components/common/KpiStrip';
import { DataTable, type Column } from '../components/common/DataTable/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Segmented } from '../components/common/Segmented';
import { ApprovalDialog } from '../components/common/ApprovalDialog';
import { ApprovalTimeline } from '../components/common/ApprovalTimeline';
import { SubjectChip } from '../components/common/SubjectChip';
import { Button } from '../components/ui/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../components/ui/Sheet';
import { MakeupProposalDialog } from '../components/makeup/MakeupProposalDialog';
import { ReportMissedDialog } from '../components/makeup/ReportMissedDialog';
import { useAcademic } from '../contexts/AcademicContext';
import { useApp } from '../contexts/AppContext';
import { teachers } from '../data/school';
import type { MakeupRequest } from '../types/academic';
import { sectionLabel } from '../utils/timetable';
import { formatDate } from '../utils/format';

type Filter = 'all' | 'open' | 'proposed' | 'done';

export function Makeup() {
  const { makeups, decideMakeup, completeMakeup, topics } = useAcademic();
  const { canApprove, role } = useApp();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [proposeId, setProposeId] = useState<string | null>(null);
  const [decideId, setDecideId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (params.get('new') === '1') {
      setReportOpen(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const scoped = role === 'teacher' ? makeups.filter((m) => m.teacherId === 'T01' || m.proposal?.teacherId === 'T01') : makeups;
  const rows = useMemo(() => scoped.filter((m) => filter === 'all' || filter === 'open' && (m.status === 'gap-open' || m.status === 'rejected') || filter === 'proposed' && m.status === 'proposed' || filter === 'done' && (m.status === 'approved' || m.status === 'completed')), [scoped, filter]);
  const find = (id: string | null) => makeups.find((m) => m.id === id);

  const columns: Column<MakeupRequest>[] = [
  { id: 'id', header: 'ID', cell: (m) => <span className="font-medium tabular">{m.id}</span>, sortValue: (m) => m.id },
  { id: 'class', header: 'Class', cell: (m) => <span className="inline-flex items-center gap-2 whitespace-nowrap"><b className="font-semibold">{sectionLabel(m.sectionId)}</b><SubjectChip id={m.subjectId} /></span>, sortValue: (m) => m.sectionId },
  { id: 'missed', header: 'Missed', cell: (m) => <span className="whitespace-nowrap tabular">{formatDate(m.originalDate, 'EEE d MMM')} · P{m.originalPeriod}</span>, sortValue: (m) => m.originalDate },
  { id: 'reason', header: 'Reason', mobileHidden: true, cell: (m) => <span className="line-clamp-1 max-w-[220px] text-muted-foreground">{m.reason}</span> },
  { id: 'impact', header: 'Syllabus impact', mobileHidden: true, hideable: true, cell: (m) => <span className="text-[12px]">{topics.find((t) => t.id === m.topicId)?.title ?? '1 period (summary course)'}</span> },
  { id: 'slot', header: 'Makeup slot', cell: (m) => m.proposal ? <span className="whitespace-nowrap text-[12.5px]">{formatDate(m.proposal.date, 'EEE d MMM')} · {m.proposal.period === 8 ? 'Extra' : `P${m.proposal.period}`} · {m.proposal.roomId}<span className="block text-[11px] text-muted-foreground">{teachers.find((t) => t.id === m.proposal!.teacherId)?.name}</span></span> : <span className="text-subtle">—</span> },
  { id: 'status', header: 'Status', cell: (m) => <StatusBadge status={m.status} />, sortValue: (m) => m.status }];


  const primaryAction = (m: MakeupRequest) => {
    if (m.status === 'gap-open' || m.status === 'rejected') return <Button size="xs" variant="outline" onClick={(e) => {e.stopPropagation();setProposeId(m.id);}}>Propose</Button>;
    if (m.status === 'proposed' && canApprove) return <Button size="xs" onClick={(e) => {e.stopPropagation();setDecideId(m.id);}}>Review</Button>;
    if (m.status === 'approved') return <Button size="xs" variant="outline" onClick={(e) => {e.stopPropagation();completeMakeup(m.id);toast.success(`${m.id} delivered — syllabus gap resolved`);}}>Mark delivered</Button>;
    return null;
  };

  const decide = find(decideId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cancelled & Makeup Classes"
        bn="বাতিল ও মেকআপ ক্লাস"
        description="Missed classes are never counted as delivered. Each gap is tracked until a clash-checked, approved makeup is completed."
        actions={<Button size="sm" onClick={() => setReportOpen(true)}><Plus className="size-4" /> Report cancelled class</Button>} />
      
      <KpiStrip
        items={[
        { label: 'Gaps without a plan', value: scoped.filter((m) => m.status === 'gap-open').length, sub: 'Need a makeup proposal', icon: CalendarPlus, tone: 'danger', onClick: () => setFilter('open') },
        { label: 'Awaiting approval', value: scoped.filter((m) => m.status === 'proposed').length, sub: 'Principal decision', icon: ShieldCheck, tone: 'warning', onClick: () => setFilter('proposed') },
        { label: 'Approved · upcoming', value: scoped.filter((m) => m.status === 'approved').length, sub: 'Guardians notified', icon: CalendarCheck2, tone: 'info', onClick: () => setFilter('done') },
        { label: 'Resolved this term', value: scoped.filter((m) => m.status === 'completed').length + 11, sub: 'Incl. 11 earlier (sample)', icon: CheckCheck, tone: 'success' }]
        } />
      
      <DataTable
        ariaLabel="Makeup requests"
        rows={rows}
        columns={[...columns, { id: 'next', header: 'Next step', align: 'right', cell: (m) => primaryAction(m) ?? <span className="text-xs text-subtle">—</span> }]}
        getRowId={(m) => m.id}
        onRowClick={(m) => setHistoryId(m.id)}
        searchText={(m) => `${m.id} ${sectionLabel(m.sectionId)} ${m.subjectId} ${m.reason}`}
        searchPlaceholder="Search ID, class, reason…"
        toolbar={<Segmented ariaLabel="Status filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Gaps' }, { value: 'proposed', label: 'Pending' }, { value: 'done', label: 'Approved / done' }]} />}
        rowActions={(m) => [
        { label: 'View history', icon: History, onSelect: () => setHistoryId(m.id) },
        { label: m.proposal ? 'Change proposal' : 'Propose makeup', icon: CalendarPlus, onSelect: () => setProposeId(m.id), disabled: m.status === 'completed' || m.status === 'approved' },
        { label: 'Approve / reject', icon: ShieldCheck, onSelect: () => setDecideId(m.id), disabled: m.status !== 'proposed' || !canApprove },
        { label: 'Mark delivered', icon: CheckCheck, onSelect: () => {completeMakeup(m.id);toast.success('Gap resolved');}, disabled: m.status !== 'approved', separatorBefore: true }]
        }
        emptyTitle="No makeup items in this view" />
      

      {find(proposeId) && <MakeupProposalDialog request={find(proposeId)!} open={!!proposeId} onOpenChange={(o) => !o && setProposeId(null)} />}
      {decide &&
      <ApprovalDialog
        open={!!decide}
        onOpenChange={(o) => !o && setDecideId(null)}
        title={`${decide.id} · ${sectionLabel(decide.sectionId)} makeup`}
        description={decide.reason}
        history={decide.history}
        approveLabel="Approve & notify guardians"
        returnLabel="Reject"
        onDecision={(ok, n) => {decideMakeup(decide.id, ok, n);toast.success(ok ? 'Approved — SMS queued to guardians' : 'Rejected — teacher will re-propose');}}>
        
          {decide.proposal && <p className="text-[13px]">{formatDate(decide.proposal.date, 'EEEE d MMM')} · {decide.proposal.period === 8 ? 'Extra period 13:40–14:20' : `P${decide.proposal.period}`} · {decide.proposal.roomId} · {teachers.find((t) => t.id === decide.proposal!.teacherId)?.name}</p>}
          <p className="rounded-md bg-success-bg px-2 py-1 text-xs text-success">Clash check passed at proposal time.</p>
        </ApprovalDialog>
      }
      <Sheet open={!!historyId} onOpenChange={(o) => !o && setHistoryId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {find(historyId) &&
          <>
              <SheetHeader>
                <SheetTitle>{find(historyId)!.id} · {sectionLabel(find(historyId)!.sectionId)} {find(historyId)!.subjectId}</SheetTitle>
                <SheetDescription>{find(historyId)!.reason}</SheetDescription>
              </SheetHeader>
              <div className="space-y-3 px-4 pb-6">
                <StatusBadge status={find(historyId)!.status} />
                <ApprovalTimeline entries={find(historyId)!.history} />
              </div>
            </>
          }
        </SheetContent>
      </Sheet>
      <ReportMissedDialog open={reportOpen} onOpenChange={setReportOpen} />
    </div>);

}
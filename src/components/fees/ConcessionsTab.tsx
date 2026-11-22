import React, { useState } from 'react';
import { BadgePercent, CalendarX2, Eye, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge, ToneChip } from '../common/StatusBadge';
import { PersonCell } from '../common/PersonCell';
import { Segmented } from '../common/Segmented';
import { KpiStrip } from '../common/KpiStrip';
import { ApprovalDialog } from '../common/ApprovalDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConcessionDialog } from './ConcessionDialog';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import { CONCESSION_LABEL, type Concession } from '../../types/concessions';
import { concessionActiveIn, concessionAmount, monthToLabel, tuitionFor } from '../../utils/concessions';
import { sectionLabel } from '../../utils/timetable';
import { TODAY, formatBDT } from '../../utils/format';

type Filter = 'active' | 'pending' | 'all';
const TYPE_TONE = { sibling: 'info', merit: 'primary', 'staff-child': 'neutral', hardship: 'warning' } as const;
const THIS_MONTH = TODAY.slice(0, 7);

/** Standing fee concessions — sibling, merit, staff-child and hardship — with approval and end dates. */
export function ConcessionsTab() {
  const admin = useAdmin();
  const { role } = useApp();
  const canCreate = ['owner', 'principal', 'accountant', 'office'].includes(role);
  const [filter, setFilter] = useState<Filter>('active');
  const [adding, setAdding] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [ending, setEnding] = useState<Concession | null>(null);
  const [lastMonth, setLastMonth] = useState(THIS_MONTH);

  const student = (id: string) => admin.students.find((s) => s.id === id);
  const monthly = (c: Concession) => concessionAmount(c, tuitionFor(student(c.studentId), admin.feeHeads));
  const rows = admin.concessions.filter((c) => filter === 'all' || (filter === 'pending' ? c.status === 'pending' : c.status === 'approved'));
  const activeNow = admin.concessions.filter((c) => concessionActiveIn(c, THIS_MONTH));
  const review = admin.concessions.find((c) => c.id === reviewId);

  const columns: Column<Concession>[] = [
  { id: 'student', header: 'Student', sortValue: (c) => student(c.studentId)?.name ?? '', cell: (c) => {const s = student(c.studentId);return <PersonCell name={s?.name ?? c.studentId} sub={`${c.id} · ${s ? sectionLabel(s.sectionId) : ''}`} />;} },
  { id: 'type', header: 'Type', sortValue: (c) => c.type, cell: (c) => <ToneChip tone={TYPE_TONE[c.type]}>{CONCESSION_LABEL[c.type]}</ToneChip> },
  { id: 'value', header: 'Concession', align: 'right', sortValue: (c) => monthly(c), cell: (c) => <span className="tabular">{c.basis === 'percent' ? `${c.value}%` : formatBDT(c.value)}<span className="block text-[11px] text-muted-foreground">−{formatBDT(monthly(c))}/month</span></span> },
  { id: 'period', header: 'Period', mobileHidden: true, sortValue: (c) => c.from, cell: (c) => <span className="tabular">{monthToLabel(c.from)} – {c.to ? monthToLabel(c.to) : 'ongoing'}</span> },
  { id: 'reason', header: 'Reason', mobileHidden: true, hideable: true, cell: (c) => <span className="line-clamp-2 text-[12.5px] text-muted-foreground">{c.reason}</span> },
  { id: 'status', header: 'Status', sortValue: (c) => c.status, cell: (c) => <StatusBadge status={c.status === 'ended' ? 'completed' : c.status} label={c.status === 'ended' ? 'Ended' : c.status === 'pending' ? 'Awaiting approval' : undefined} /> }];


  return (
    <div className="space-y-4">
      <KpiStrip items={[
      { label: 'Active this month', value: activeNow.length, icon: BadgePercent, tone: 'primary', onClick: () => setFilter('active') },
      { label: 'Monthly tuition waived', value: formatBDT(activeNow.reduce((t, c) => t + monthly(c), 0)), icon: Users },
      { label: 'Awaiting approval', value: admin.concessions.filter((c) => c.status === 'pending').length, tone: 'warning', onClick: () => setFilter('pending') }]
      } />
      {!canCreate && <Notice kind="locked">View only — finance, office or the principal grant concessions.</Notice>}
      <DataTable
        ariaLabel="Fee concessions"
        rows={rows}
        columns={columns}
        getRowId={(c) => c.id}
        onRowClick={(c) => setReviewId(c.id)}
        searchText={(c) => `${student(c.studentId)?.name ?? ''} ${c.id} ${c.reason} ${CONCESSION_LABEL[c.type]}`}
        searchPlaceholder="Student, ID or reason…"
        toolbar={<Segmented ariaLabel="Concession status" value={filter} onChange={setFilter} options={[{ value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending', count: admin.concessions.filter((c) => c.status === 'pending').length }, { value: 'all', label: 'All' }]} />}
        toolbarRight={canCreate ? <Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" /> New concession</Button> : undefined}
        rowActions={(c) => [
        { label: admin.canApproveConcession && c.status === 'pending' ? 'Review' : 'View', icon: Eye, onSelect: () => setReviewId(c.id) },
        { label: 'End concession', icon: CalendarX2, destructive: true, separatorBefore: true, disabled: !canCreate || c.status !== 'approved', onSelect: () => {setLastMonth(THIS_MONTH);setEnding(c);} }]
        }
        emptyTitle={filter === 'pending' ? 'Nothing waiting for approval' : 'No concessions'}
        emptyAction={canCreate && filter !== 'pending' ? <Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" /> New concession</Button> : undefined}
        footerNote="Applied to tuition when monthly dues are generated · existing invoices are unchanged unless you choose otherwise" />
      
      <ConcessionDialog open={adding} onOpenChange={setAdding} />
      {review &&
      <ApprovalDialog
        open={!!review}
        onOpenChange={(o) => !o && setReviewId(null)}
        title={`${student(review.studentId)?.name} · ${CONCESSION_LABEL[review.type]}`}
        description={`${review.id} · requested by ${review.requestedBy}`}
        history={review.history}
        approveLabel="Approve concession"
        returnLabel="Reject"
        readOnly={!admin.canApproveConcession || review.status !== 'pending'}
        onDecision={(ok, note) => {admin.decideConcession(review.id, ok, note);toast.success(ok ? `${review.id} approved` : `${review.id} rejected`);}}>
        
          <dl className="space-y-1.5 text-[13px]">
            <div><dt className="inline text-muted-foreground">Amount: </dt><dd className="inline">{review.basis === 'percent' ? `${review.value}% of tuition` : formatBDT(review.value)} = <b>{formatBDT(monthly(review))}/month</b></dd></div>
            <div><dt className="inline text-muted-foreground">Period: </dt><dd className="inline">{monthToLabel(review.from)} – {review.to ? monthToLabel(review.to) : 'ongoing'}</dd></div>
            <div><dt className="inline text-muted-foreground">Reason: </dt><dd className="inline">{review.reason}</dd></div>
            {review.applyCurrent && <div className="text-muted-foreground">Also reduces the current unpaid invoice on approval.</div>}
          </dl>
        </ApprovalDialog>
      }
      <ConfirmDialog
        open={!!ending}
        onOpenChange={(o) => !o && setEnding(null)}
        title={`End ${ending?.id}?`}
        description="Invoices generated after the last month are billed at full tuition. Past invoices keep their discount."
        confirmLabel="End concession"
        destructive
        reasonLabel="Reason"
        onConfirm={(reason) => {if (ending) {admin.endConcession(ending.id, lastMonth, reason);toast.success(`${ending.id} ends after ${monthToLabel(lastMonth)}`);}}}>
        
        <Field label="Last month it applies" htmlFor="cn-last"><Input id="cn-last" type="month" min={ending?.from} value={lastMonth} onChange={(e) => setLastMonth(e.target.value)} /></Field>
      </ConfirmDialog>
    </div>);

}
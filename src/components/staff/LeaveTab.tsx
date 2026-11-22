import React, { useState } from 'react';
import { Check, Eye, Plus, Undo2, X } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { PersonCell } from '../common/PersonCell';
import { Segmented } from '../common/Segmented';
import { ApprovalDialog } from '../common/ApprovalDialog';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { useStaff } from '../../contexts/StaffContext';
import { useAcademic } from '../../contexts/AcademicContext';
import { LEAVE_LABEL, LEAVE_QUOTA, type LeaveRequest } from '../../types/staff';
import { formatDate } from '../../utils/format';

type Filter = 'pending' | 'approved' | 'all';

/** All leave requests with balances — the principal approves or rejects; requesters can cancel pending ones. */
export function LeaveTab({ onRequest }: {onRequest: () => void;}) {
  const store = useStaff();
  const { timetable } = useAcademic();
  const [filter, setFilter] = useState<Filter>('pending');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const rows = store.leaves.filter((l) => filter === 'all' || l.status === filter);
  const review = store.leaves.find((l) => l.id === reviewId);
  const name = (id?: string) => store.staff.find((s) => s.id === id)?.name ?? '—';

  const columns: Column<LeaveRequest>[] = [
  { id: 'who', header: 'Staff', sortValue: (l) => name(l.staffId), cell: (l) => {const s = store.staff.find((x) => x.id === l.staffId);return <PersonCell name={s?.name ?? l.staffId} sub={`${l.id} · ${s?.designation ?? ''}`} />;} },
  { id: 'type', header: 'Type', sortValue: (l) => l.type, cell: (l) => <span>{LEAVE_LABEL[l.type]}{l.type !== 'unpaid' && <span className="block text-[11px] text-muted-foreground">{LEAVE_QUOTA[l.type] - store.leaveUsed(l.staffId, l.type)} days left</span>}</span> },
  { id: 'dates', header: 'Dates', sortValue: (l) => l.from, cell: (l) => <span className="tabular">{formatDate(l.from, 'd MMM')}{l.to !== l.from ? ` – ${formatDate(l.to, 'd MMM')}` : ''}<span className="block text-[11px] text-muted-foreground">{l.days} school day{l.days === 1 ? '' : 's'}</span></span> },
  { id: 'reason', header: 'Reason', mobileHidden: true, cell: (l) => <span className="line-clamp-2 text-[12.5px] text-muted-foreground">{l.reason}</span> },
  { id: 'sub', header: 'Substitute', mobileHidden: true, hideable: true, cell: (l) => l.substituteId ? name(l.substituteId) : <span className="text-subtle">—</span> },
  { id: 'status', header: 'Status', cell: (l) => <StatusBadge status={l.status} /> }];


  const weeklyPeriods = review ? timetable.filter((c) => c.teacherId === review.staffId).length : 0;

  return (
    <div className="space-y-3">
      {!store.canApproveLeave && <Notice kind="locked">Leave is approved by the principal or owner. You can request and track leave here.</Notice>}
      <DataTable
        ariaLabel="Leave requests"
        rows={rows}
        columns={columns}
        getRowId={(l) => l.id}
        onRowClick={(l) => setReviewId(l.id)}
        searchText={(l) => `${name(l.staffId)} ${l.id} ${l.reason}`}
        searchPlaceholder="Name or reason…"
        initialSort={{ id: 'dates', dir: 'desc' }}
        toolbar={<Segmented ariaLabel="Leave status" value={filter} onChange={setFilter} options={[{ value: 'pending', label: 'Pending', count: store.leaves.filter((l) => l.status === 'pending').length }, { value: 'approved', label: 'Approved' }, { value: 'all', label: 'All' }]} />}
        toolbarRight={<Button size="sm" onClick={onRequest}><Plus className="size-4" /> Request leave</Button>}
        rowActions={(l) => [
        { label: store.canApproveLeave && l.status === 'pending' ? 'Review' : 'View', icon: Eye, onSelect: () => setReviewId(l.id) },
        { label: 'Approve', icon: Check, disabled: !store.canApproveLeave || l.status !== 'pending', onSelect: () => {store.decideLeave(l.id, true);toast.success(`${l.id} approved`, { description: l.type === 'unpaid' ? 'Unpaid days will be deducted on the salary sheet.' : undefined });} },
        { label: 'Reject', icon: X, destructive: true, disabled: !store.canApproveLeave || l.status !== 'pending', onSelect: () => setReviewId(l.id) },
        { label: 'Cancel request', icon: Undo2, separatorBefore: true, disabled: l.status !== 'pending' || l.requestedBy !== store.actor && !store.canManage, onSelect: () => {store.cancelLeave(l.id);toast.success(`${l.id} cancelled`);} }]
        }
        emptyTitle={filter === 'pending' ? 'No pending leave' : 'No leave requests'}
        emptyHint={filter === 'pending' ? 'New requests appear here and in the principal’s action queue.' : undefined} />
      
      {review &&
      <ApprovalDialog
        open={!!review}
        onOpenChange={(o) => !o && setReviewId(null)}
        title={`${name(review.staffId)} · ${LEAVE_LABEL[review.type]} leave`}
        description={`${review.id} · ${review.days} school day(s)`}
        history={review.history}
        approveLabel="Approve leave"
        returnLabel="Reject"
        readOnly={!store.canApproveLeave || review.status !== 'pending'}
        onDecision={(ok, note) => {store.decideLeave(review.id, ok, note);toast.success(ok ? `${review.id} approved` : `${review.id} rejected`);}}>
        
          <div className="space-y-2 text-[13px]">
            <p><span className="text-muted-foreground">Dates:</span> {formatDate(review.from)}{review.to !== review.from ? ` – ${formatDate(review.to)}` : ''}</p>
            <p><span className="text-muted-foreground">Reason:</span> {review.reason}</p>
            {review.type !== 'unpaid' && <p><span className="text-muted-foreground">Balance after:</span> {LEAVE_QUOTA[review.type] - store.leaveUsed(review.staffId, review.type) - (review.status === 'pending' ? review.days : 0)} of {LEAVE_QUOTA[review.type]} days</p>}
            {review.substituteId && <p><span className="text-muted-foreground">Suggested substitute:</span> {name(review.substituteId)}</p>}
            {weeklyPeriods > 0 && <Notice kind="warning">{weeklyPeriods} weekly periods need cover — assign substitutes in Routine & Timetable after approving.</Notice>}
            {review.type === 'unpaid' && <Notice kind="info">Unpaid days are deducted automatically on that month’s salary sheet.</Notice>}
          </div>
        </ApprovalDialog>
      }
    </div>);

}
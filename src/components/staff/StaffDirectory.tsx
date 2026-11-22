import React, { useState } from 'react';
import { Briefcase, CalendarOff, Eye, HandCoins, Pencil, Plus, RotateCcw, UserMinus, UserRoundCheck, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { KpiStrip } from '../common/KpiStrip';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge, ToneChip } from '../common/StatusBadge';
import { PersonCell } from '../common/PersonCell';
import { SubjectChip } from '../common/SubjectChip';
import { Segmented } from '../common/Segmented';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Field } from '../common/Field';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useStaff } from '../../contexts/StaffContext';
import { usePayroll } from '../../contexts/PayrollContext';
import { campuses } from '../../data/school';
import type { StaffMember } from '../../types/staff';
import { TODAY, formatBDT } from '../../utils/format';
import { grossOf } from '../../utils/payroll';
import { cn } from '../../utils/cn';

type Filter = 'all' | 'teaching' | 'support' | 'on-leave' | 'resigned';

interface Props {
  onView: (id: string) => void;
  onAdd: () => void;
  onEdit: (s: StaffMember) => void;
  onSalary: (s: StaffMember) => void;
  onLeave: (id: string) => void;
  onAdvance: (id: string) => void;
}

/** Teaching and support staff in one list — add, edit, salary, leave, advance and resignation. */
export function StaffDirectory({ onView, onAdd, onEdit, onSalary, onLeave, onAdvance }: Props) {
  const store = useStaff();
  const payroll = usePayroll();
  const [filter, setFilter] = useState<Filter>('all');
  const [resigning, setResigning] = useState<StaffMember | null>(null);
  const [lastDay, setLastDay] = useState(TODAY);

  const current = store.staff.filter((s) => s.status !== 'resigned');
  const rows = store.staff.filter((s) => {
    if (filter === 'resigned') return s.status === 'resigned';
    if (s.status === 'resigned') return false;
    if (filter === 'on-leave') return s.status === 'on-leave';
    return filter === 'all' || s.kind === filter;
  });
  const monthly = current.reduce((t, s) => t + grossOf(s.salary), 0);
  const overloaded = store.teachers.filter((t) => t.status !== 'resigned' && store.assignedLoad(t.id) > t.maxPeriods).length;

  const columns: Column<StaffMember>[] = [
  { id: 'name', header: 'Name', sortValue: (s) => s.name, cell: (s) => <PersonCell name={s.name} bn={s.bn} sub={`${s.id} · ${s.designation}`} /> },
  { id: 'kind', header: 'Type', sortValue: (s) => s.kind, cell: (s) => <ToneChip tone={s.kind === 'teaching' ? 'primary' : 'neutral'}>{s.kind === 'teaching' ? 'Teaching' : 'Support'}</ToneChip> },
  { id: 'campus', header: 'Campus', mobileHidden: true, hideable: true, cell: (s) => campuses.find((c) => c.id === s.campusId)?.short },
  { id: 'subjects', header: 'Subjects', mobileHidden: true, hideable: true, cell: (s) => s.subjects.length ? <span className="flex flex-wrap gap-1.5">{s.subjects.map((x) => <SubjectChip key={x} id={x} />)}</span> : <span className="text-subtle">—</span> },
  {
    id: 'load', header: 'Load / week', align: 'right', mobileHidden: true, sortValue: (s) => s.kind === 'teaching' ? store.assignedLoad(s.id) : -1,
    cell: (s) => {
      if (s.kind !== 'teaching') return <span className="text-subtle">—</span>;
      const l = store.assignedLoad(s.id);
      return <span className={cn('tabular', l > s.maxPeriods && 'font-semibold text-danger')}>{l}<span className="text-muted-foreground">/{s.maxPeriods}</span></span>;
    },
    edit: {
      value: (s) => String(s.maxPeriods), type: 'number',
      lockedReason: (s) => s.kind !== 'teaching' ? 'Support staff have no teaching load.' : store.canEditStructure ? null : 'Workload limits are set by the principal.',
      onSave: (s, v) => {const n = Number(v);if (!Number.isInteger(n) || n < 6 || n > 36) return '6–36';store.updateStaff(s.id, { maxPeriods: n }, 'Workload limit changed');}
    }
  },
  ...(store.canSeeSalary ? [{ id: 'gross', header: 'Gross / month', align: 'right' as const, sortValue: (s: StaffMember) => grossOf(s.salary), cell: (s: StaffMember) => <span className="tabular">{formatBDT(grossOf(s.salary))}</span> }] : []),
  { id: 'phone', header: 'Phone', mobileHidden: true, hideable: true, defaultHidden: true, cell: (s) => <span className="tabular text-muted-foreground">{s.phone}</span> },
  { id: 'status', header: 'Status', sortValue: (s) => s.status, cell: (s) => <StatusBadge status={s.status === 'resigned' ? 'withdrawn' : s.status} label={s.status === 'resigned' ? 'Resigned' : undefined} /> }];


  return (
    <div className="space-y-4">
      <KpiStrip
        items={[
        { label: 'Active staff', value: current.length, sub: `${store.teachers.filter((t) => t.status !== 'resigned').length} teaching · ${current.filter((s) => s.kind === 'support').length} support`, icon: Users, tone: 'primary', onClick: () => setFilter('all') },
        { label: 'On leave today', value: current.filter((s) => s.status === 'on-leave').length, sub: 'Substitutes needed', icon: UserMinus, tone: 'warning', onClick: () => setFilter('on-leave') },
        { label: 'Leave requests', value: store.leaves.filter((l) => l.status === 'pending').length, sub: 'Waiting for principal', icon: CalendarOff, tone: 'info' },
        { label: 'Over max load', value: overloaded, sub: 'Rebalance assignments', icon: Briefcase, tone: overloaded ? 'danger' : 'success' },
        ...(store.canSeeSalary ? [{ label: 'Monthly gross', value: formatBDT(monthly), sub: `${payroll.sheets.filter((s) => s.status === 'submitted').length} sheet(s) awaiting approval`, icon: Wallet, tone: 'neutral' as const }] : [])]
        } />
      
      <DataTable
        ariaLabel="Staff"
        rows={rows}
        columns={columns}
        getRowId={(s) => s.id}
        onRowClick={(s) => onView(s.id)}
        searchText={(s) => `${s.name} ${s.bn} ${s.id} ${s.designation} ${s.subjects.join(' ')} ${s.phone}`}
        searchPlaceholder="Name, ID, role or subject…"
        toolbar={<Segmented ariaLabel="Staff filter" value={filter} onChange={setFilter} options={[
        { value: 'all', label: 'All', count: current.length },
        { value: 'teaching', label: 'Teaching', count: current.filter((s) => s.kind === 'teaching').length },
        { value: 'support', label: 'Support', count: current.filter((s) => s.kind === 'support').length },
        { value: 'on-leave', label: 'On leave' },
        { value: 'resigned', label: 'Resigned' }]
        } />}
        toolbarRight={store.canManage ? <Button size="sm" onClick={onAdd}><Plus className="size-4" /> Add staff</Button> : undefined}
        rowActions={(s) => [
        { label: 'View profile', icon: Eye, onSelect: () => onView(s.id) },
        { label: 'Edit profile', icon: Pencil, disabled: !store.canManage, onSelect: () => onEdit(s) },
        { label: 'Request leave', icon: CalendarOff, disabled: !store.canManage || s.status === 'resigned', onSelect: () => onLeave(s.id) },
        { label: 'Change salary', icon: Wallet, separatorBefore: true, disabled: !store.canSeeSalary || s.status === 'resigned', onSelect: () => onSalary(s) },
        { label: 'Give advance', icon: HandCoins, disabled: !payroll.canPrepare || s.status === 'resigned', onSelect: () => onAdvance(s.id) },
        s.status === 'resigned' ?
        { label: 'Reactivate', icon: RotateCcw, separatorBefore: true, disabled: !store.canEditStructure, onSelect: () => {store.reactivate(s.id);toast.success(`${s.name} reactivated`);} } :
        { label: 'Mark resigned', icon: UserRoundCheck, destructive: true, separatorBefore: true, disabled: !store.canEditStructure, onSelect: () => {setLastDay(TODAY);setResigning(s);} }]
        }
        emptyTitle={filter === 'resigned' ? 'No former staff' : 'No staff match'}
        emptyAction={store.canManage && filter !== 'resigned' ? <Button size="sm" onClick={onAdd}><Plus className="size-4" /> Add staff</Button> : undefined}
        footerNote="Hover Load to change a teacher’s weekly limit" />
      
      <ConfirmDialog
        open={!!resigning}
        onOpenChange={(o) => !o && setResigning(null)}
        title={`Mark ${resigning?.name} as resigned?`}
        description="They’re removed from class assignments and future salary sheets after the last day. History and ledger are kept."
        confirmLabel="Mark resigned"
        destructive
        reasonLabel="Reason"
        onConfirm={(reason) => {
          if (!resigning) return;
          const due = payroll.staffBalance(resigning.id);
          store.resign(resigning.id, lastDay, reason);
          toast.success(`${resigning.name} marked resigned`, { description: due > 0 ? `Final settlement: ${formatBDT(due)} still owed — pay from Payroll.` : due < 0 ? `${formatBDT(-due)} advance outstanding — recover before release.` : 'Nothing owed either way.' });
        }}>
        
        <Field label="Last working day" htmlFor="rs-last"><Input id="rs-last" type="date" value={lastDay} onChange={(e) => setLastDay(e.target.value)} /></Field>
      </ConfirmDialog>
    </div>);

}
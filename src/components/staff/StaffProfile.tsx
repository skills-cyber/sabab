import React, { useState } from 'react';
import { CalendarOff, FileText, Mail, Pencil, Phone, Wallet } from 'lucide-react';
import { Button } from '../ui/Button';
import { UnderlineTabs } from '../common/UnderlineTabs';
import { StatusBadge, ToneChip } from '../common/StatusBadge';
import { SubjectChip } from '../common/SubjectChip';
import { EmptyState } from '../common/EmptyState';
import { Meter } from '../common/Meter';
import { StaffLedgerPanel } from './StaffLedgerPanel';
import { PayslipDialog } from '../payroll/PayslipDialog';
import { useStaff } from '../../contexts/StaffContext';
import { usePayroll } from '../../contexts/PayrollContext';
import { campuses } from '../../data/school';
import { LEAVE_LABEL, LEAVE_QUOTA, type LeaveType, type StaffMember } from '../../types/staff';
import { maskNumber } from '../accounts/useAccounts';
import { formatBDT, formatDate } from '../../utils/format';
import { allowanceTotal, deductionTotal, grossOf, monthLabel } from '../../utils/payroll';
import { cn } from '../../utils/cn';

type Tab = 'overview' | 'salary' | 'ledger' | 'leave' | 'classes';

export interface ProfileActions {
  onEdit?: () => void;
  onSalary?: () => void;
  onLeave?: () => void;
  onAdvance?: () => void;
}

/** Tabbed staff profile body — used in the directory side panel and in “My leave & pay”. */
export function StaffProfile({ person, actions, selfView }: {person: StaffMember;actions: ProfileActions;selfView?: boolean;}) {
  const store = useStaff();
  const payroll = usePayroll();
  const [tab, setTab] = useState<Tab>('overview');
  const [slip, setSlip] = useState<{sheetId: string;staffId: string;} | null>(null);
  const showMoney = store.canSeeSalary || selfView;
  const teaching = person.kind === 'teaching';

  const tabs = [
  { id: 'overview', label: 'Overview' },
  ...(showMoney ? [{ id: 'salary', label: 'Salary' }, { id: 'ledger', label: 'Ledger' }] : []),
  { id: 'leave', label: 'Leave', count: store.leaves.filter((l) => l.staffId === person.id && l.status === 'pending').length || undefined },
  ...(teaching ? [{ id: 'classes', label: 'Classes' }] : [])];


  const myLeaves = store.leaves.filter((l) => l.staffId === person.id);
  const mySheets = payroll.sheets.filter((s) => ['approved', 'partly-paid', 'paid'].includes(s.status) && s.rows.some((r) => r.staffId === person.id));
  const myAssignments = store.assignments.filter((a) => a.teacherId === person.id);
  const load = store.assignedLoad(person.id);

  const Info = ({ k, v }: {k: string;v: React.ReactNode;}) =>
  <div className="min-w-0"><dt className="text-[11.5px] text-muted-foreground">{k}</dt><dd className="truncate text-[13px]">{v || <span className="text-subtle">—</span>}</dd></div>;


  return (
    <div className="space-y-4">
      <UnderlineTabs tabs={tabs} value={tab} onChange={(t) => setTab(t as Tab)} layoutId={`staff-profile-${selfView ? 'self' : 'sheet'}`} />

      {tab === 'overview' &&
      <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={person.status === 'resigned' ? 'withdrawn' : person.status} label={person.status === 'resigned' ? `Resigned · ${person.lastDay ? formatDate(person.lastDay) : ''}` : undefined} />
            <ToneChip tone={teaching ? 'primary' : 'neutral'}>{teaching ? 'Teaching' : 'Support staff'}</ToneChip>
            <ToneChip tone="neutral">{person.employment === 'part-time' ? 'Part-time' : person.employment === 'contract' ? 'Contract' : 'Permanent'}</ToneChip>
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
            <Info k="Phone" v={<a href={`tel:${person.phone}`} className="inline-flex items-center gap-1 tabular text-primary hover:underline"><Phone className="size-3.5" />{person.phone}</a>} />
            <Info k="Email" v={person.email && <a href={`mailto:${person.email}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Mail className="size-3.5" />{person.email}</a>} />
            <Info k="Campus" v={campuses.find((c) => c.id === person.campusId)?.name} />
            <Info k="Joined" v={formatDate(person.joined)} />
            <Info k="NID" v={<span className="tabular">{maskNumber(person.nid)}</span>} />
            <Info k="Emergency contact" v={<span className="tabular">{person.emergencyContact}</span>} />
            <Info k="Address" v={person.address} />
            <Info k="Qualification" v={person.qualification} />
            {showMoney && <Info k="Paid via" v={`${person.payMethod}${person.payAccount ? ` · ${maskNumber(person.payAccount)}` : ''}`} />}
            {teaching && <Info k="Workload" v={<span className="tabular">{load} / {person.maxPeriods} periods</span>} />}
          </dl>
          {teaching && <div className="flex flex-wrap gap-1">{person.subjects.map((s) => <SubjectChip key={s} id={s} />)}</div>}
          {actions.onEdit && <Button size="sm" variant="outline" onClick={actions.onEdit}><Pencil className="size-4" /> Edit profile</Button>}
        </div>
      }

      {tab === 'salary' && showMoney &&
      <div className="space-y-4">
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-[13px] font-semibold">Current structure <span className="font-normal text-muted-foreground">· from {monthLabel(person.salary.effectiveFrom)}</span></p>
              {actions.onSalary && <Button size="xs" variant="outline" onClick={actions.onSalary}><Wallet className="size-3.5" /> Change</Button>}
            </div>
            <dl className="divide-y divide-border text-[13px]">
              <div className="flex justify-between px-3 py-1.5"><dt>Basic</dt><dd className="tabular">{formatBDT(person.salary.basic)}</dd></div>
              {person.salary.allowances.map((l) => <div key={l.id} className="flex justify-between px-3 py-1.5"><dt className="text-muted-foreground">+ {l.label}</dt><dd className="tabular">{formatBDT(l.amount)}</dd></div>)}
              <div className="flex justify-between bg-muted/50 px-3 py-1.5 font-semibold"><dt>Gross</dt><dd className="tabular">{formatBDT(grossOf(person.salary))}</dd></div>
              {person.salary.deductions.map((l) => <div key={l.id} className="flex justify-between px-3 py-1.5"><dt className="text-muted-foreground">− {l.label}</dt><dd className="tabular">{formatBDT(l.amount)}</dd></div>)}
              <div className="flex justify-between px-3 py-1.5 font-semibold"><dt>Net before leave & advance</dt><dd className="tabular">{formatBDT(person.salary.basic + allowanceTotal(person.salary) - deductionTotal(person.salary))}</dd></div>
            </dl>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">Payslips</p>
            {mySheets.length === 0 ? <p className="text-[13px] text-muted-foreground">No approved salary sheets yet.</p> :
          <ul className="divide-y divide-border rounded-lg border border-border">
                {mySheets.map((s) => {
              const r = s.rows.find((x) => x.staffId === person.id)!;
              return (
                <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
                      <div className="min-w-0"><p className="font-medium">{monthLabel(s.month)}</p><p className="text-[11.5px] text-muted-foreground">Net {formatBDT(r.net)} · {r.paid >= r.net ? 'paid' : r.paid ? `${formatBDT(r.net - r.paid)} due` : 'not paid yet'}</p></div>
                      <Button size="xs" variant="ghost" onClick={() => setSlip({ sheetId: s.id, staffId: person.id })}><FileText className="size-3.5" /> Payslip</Button>
                    </li>);

            })}
              </ul>
          }
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">Revision history</p>
            <ul className="space-y-1.5 text-[12.5px]">
              {person.salaryHistory.map((h, i) =>
            <li key={i} className="flex justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                  <span className="min-w-0 truncate">{h.note ?? 'Revision'} · <span className="text-muted-foreground">{h.changedBy} · {h.at}</span></span>
                  <span className="shrink-0 tabular">{formatBDT(grossOf(h))}</span>
                </li>
            )}
            </ul>
          </div>
        </div>
      }

      {tab === 'ledger' && showMoney && <StaffLedgerPanel person={person} onAdvance={actions.onAdvance} />}

      {tab === 'leave' &&
      <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(['casual', 'sick', 'earned'] as LeaveType[]).map((t) => {
            const used = store.leaveUsed(person.id, t);
            return (
              <div key={t} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-[11.5px] text-muted-foreground">{LEAVE_LABEL[t]}</p>
                  <p className="text-[15px] font-semibold tabular">{LEAVE_QUOTA[t] - used}<span className="text-[12px] font-normal text-muted-foreground"> / {LEAVE_QUOTA[t]} left</span></p>
                  <Meter value={Math.round(used / LEAVE_QUOTA[t] * 100)} className="mt-1" />
                </div>);

          })}
          </div>
          {actions.onLeave && person.status !== 'resigned' && <Button size="sm" variant="outline" onClick={actions.onLeave}><CalendarOff className="size-4" /> Request leave</Button>}
          {myLeaves.length === 0 ? <EmptyState title="No leave this year" /> :
        <ul className="divide-y divide-border rounded-lg border border-border">
              {myLeaves.map((l) =>
          <li key={l.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
                  <div className="min-w-0">
                    <p className="font-medium">{LEAVE_LABEL[l.type]} · {l.days} day{l.days === 1 ? '' : 's'}</p>
                    <p className="truncate text-[11.5px] text-muted-foreground">{formatDate(l.from, 'd MMM')}{l.to !== l.from ? ` – ${formatDate(l.to, 'd MMM')}` : ''} · {l.reason}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </li>
          )}
            </ul>
        }
        </div>
      }

      {tab === 'classes' && teaching &&
      <div className="space-y-3">
          <div className="rounded-lg border border-border px-3 py-2">
            <div className="flex justify-between text-[13px]"><span>Assigned weekly periods</span><b className={cn('tabular', load > person.maxPeriods && 'text-danger')}>{load} / {person.maxPeriods}</b></div>
            <Meter value={Math.round(load / Math.max(1, person.maxPeriods) * 100)} className="mt-1.5" />
          </div>
          {myAssignments.length === 0 ? <EmptyState title="No classes assigned" hint="Assign subjects in Settings › Classes & sections." /> :
        <ul className="divide-y divide-border rounded-lg border border-border">
              {myAssignments.map((a) => {
            const sec = store.sections.find((s) => s.id === a.sectionId);
            const periods = store.classSubjects[sec?.grade ?? 0]?.find((c) => c.subjectId === a.subjectId)?.periods ?? 0;
            return (
              <li key={`${a.sectionId}-${a.subjectId}`} className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
                    <span className="flex items-center gap-2"><b className="w-14">{sec?.label ?? a.sectionId}</b><SubjectChip id={a.subjectId} /></span>
                    <span className="tabular text-muted-foreground">{periods}/wk</span>
                  </li>);

          })}
            </ul>
        }
        </div>
      }

      <PayslipDialog target={slip} onOpenChange={(o) => !o && setSlip(null)} />
    </div>);

}
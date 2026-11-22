import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarRange, ClipboardCheck, FileCheck2, PenLine, RefreshCcw, UserMinus, BoxIcon, Landmark, HandCoins, BadgePercent } from "lucide-react";
import { useAccounts } from "../../contexts/AccountsContext";
import { useStaff } from "../../contexts/StaffContext";
import { usePayroll } from "../../contexts/PayrollContext";
import { LEAVE_LABEL } from "../../types/staff";
import { CONCESSION_LABEL } from "../../types/concessions";
import { concessionAmount, monthToLabel, tuitionFor } from "../../utils/concessions";
import { monthLabel } from "../../utils/payroll";
import { toast } from "sonner";
import { Panel } from "../common/Panel";
import { StatusBadge } from "../common/StatusBadge";
import { ApprovalDialog } from "../common/ApprovalDialog";
import { EmptyState } from "../common/EmptyState";
import { Button } from "../ui/Button";
import { useAcademic } from "../../contexts/AcademicContext";
import { useApp } from "../../contexts/AppContext";
import { useAdmin } from "../../contexts/AdminContext";
import { sectionLabel } from "../../utils/timetable";
import { formatBDT, formatDate } from "../../utils/format";
import { subjectName } from "../common/SubjectChip";
import { TimelineEntry } from "../../types/academic";
interface QueueItem {
  id: string;
  kind: string;
  icon: BoxIcon;
  title: string;
  detail: string;
  status: string;
  history: TimelineEntry[];
  body: React.ReactNode;
  approveLabel: string;
  onDecision: (approve: boolean, note: string) => void;
}

/** Principal's single, actionable approval inbox (plans, makeups, papers, results, corrections, leave). */
export function ActionQueue() {
  const {
    plans,
    decidePlan,
    makeups,
    decideMakeup,
    assessments,
    moveStage,
    corrections,
    decideCorrection
  } = useAcademic();
  const {
    canApprove
  } = useApp();
  const admin = useAdmin();
  const navigate = useNavigate();
  const fin = useAccounts();
  const staffStore = useStaff();
  const payroll = usePayroll();
  const [openId, setOpenId] = useState<string | null>(null);
  const items = useMemo<QueueItem[]>(() => {
    const list: QueueItem[] = [];
    plans.filter((p) => p.status === 'submitted').forEach((p) => list.push({
      id: p.id,
      kind: 'Plan revision',
      icon: CalendarRange,
      title: `Academic plan ${p.version} — ${p.title}`,
      detail: `${p.author} · ${p.changes.length} changes`,
      status: 'submitted',
      history: p.history,
      approveLabel: 'Approve & publish',
      body: <div className="space-y-2 text-[13px]">
          <p><span className="text-muted-foreground">Reason:</span> {p.changeReason}</p>
          <ul className="list-disc space-y-1 pl-5">{p.changes.map((c) => <li key={c}>{c}</li>)}</ul>
          <p className="text-xs text-muted-foreground">Publishing locks this version; the current published version becomes superseded (kept for history).</p>
        </div>,
      onDecision: (a, n) => {
        decidePlan(p.id, a, n);
        toast.success(a ? `Plan ${p.version} published` : `Plan ${p.version} returned`);
      }
    }));
    makeups.filter((m) => m.status === 'proposed').forEach((m) => list.push({
      id: m.id,
      kind: 'Makeup class',
      icon: RefreshCcw,
      title: `${sectionLabel(m.sectionId)} ${subjectName(m.subjectId)} makeup`,
      detail: m.proposal ? `${m.proposal.day} ${formatDate(m.proposal.date, 'd MMM')} · P${m.proposal.period} · ${m.proposal.roomId}` : '',
      status: 'proposed',
      history: m.history,
      approveLabel: 'Approve & notify',
      body: <div className="space-y-1.5 text-[13px]">
          <p><span className="text-muted-foreground">Missed:</span> {formatDate(m.originalDate)} · P{m.originalPeriod} — {m.reason}</p>
          <p><span className="text-muted-foreground">Proposed:</span> {m.proposal && `${formatDate(m.proposal.date)} · Extra period 13:40 · Room ${m.proposal.roomId}`}</p>
          <p className="rounded-md bg-success-bg px-2 py-1 text-xs text-success">Clash check passed — teacher, room and section are free.</p>
        </div>,
      onDecision: (a, n) => {
        decideMakeup(m.id, a, n);
        toast.success(a ? `${m.id} approved · guardians notified` : `${m.id} rejected`);
      }
    }));
    assessments.filter((a) => a.stage === 'moderation' || a.stage === 'verification').forEach((a) => list.push({
      id: a.id,
      kind: a.stage === 'moderation' ? 'Paper moderation' : 'Result verification',
      icon: a.stage === 'moderation' ? ClipboardCheck : FileCheck2,
      title: `${a.title} · ${a.sectionIds.map(sectionLabel).join(', ')}`,
      detail: a.stage === 'moderation' ? `${a.questionIds.length} questions · ${a.totalMarks} marks` : 'Marks submitted — verify before publishing',
      status: a.stage,
      history: a.history,
      approveLabel: a.stage === 'moderation' ? 'Approve paper' : 'Verify & publish',
      body: <p className="text-[13px]">
          {a.stage === 'moderation' ? 'Approving schedules the paper and locks its questions.' : 'Publishing releases results to linked guardians and students. Later changes need an audited correction.'}{' '}
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(`/exams/a/${a.id}`)}>Open full assessment →</button>
        </p>,
      onDecision: (ok, n) => {
        if (a.stage === 'moderation') moveStage(a.id, ok ? 'scheduled' : 'draft', ok ? 'Paper approved by principal' : 'Paper returned for revision', n, ok ? 'success' : 'warning');else moveStage(a.id, ok ? 'published' : 'marking', ok ? 'Verified & published to guardians' : 'Marks returned to teacher', n, ok ? 'success' : 'warning');
        toast.success(ok ? 'Decision recorded' : 'Returned to teacher');
      }
    }));
    corrections.filter((c) => c.status === 'pending').forEach((c) => list.push({
      id: c.id,
      kind: 'Mark correction',
      icon: PenLine,
      title: `${c.assessmentId} · ${c.studentId}: ${c.from ?? '—'} → ${c.to}`,
      detail: c.reason,
      status: 'pending',
      history: [],
      approveLabel: 'Approve correction',
      body: <p className="text-[13px]">Published result correction requested by {c.by}. Guardians see the corrected value with a “revised” flag.</p>,
      onDecision: (ok) => {
        decideCorrection(c.id, ok);
        toast.success(ok ? 'Correction applied & audited' : 'Correction rejected');
      }
    }));
    staffStore.leaves.filter((l) => l.status === 'pending').forEach((l) => {
      const who = staffStore.staff.find((s) => s.id === l.staffId)?.name ?? l.staffId;
      const sub = staffStore.staff.find((s) => s.id === l.substituteId)?.name;
      list.push({
        id: l.id,
        kind: 'Staff leave',
        icon: UserMinus,
        title: `${who} — ${LEAVE_LABEL[l.type]} leave · ${formatDate(l.from, 'd MMM')}${l.to !== l.from ? `–${formatDate(l.to, 'd MMM')}` : ''} (${l.days}d)`,
        detail: l.reason,
        status: 'pending',
        history: l.history,
        approveLabel: 'Approve leave',
        body: <div className="space-y-1.5 text-[13px]">
            <p><span className="text-muted-foreground">Reason:</span> {l.reason}</p>
            {sub && <p><span className="text-muted-foreground">Suggested substitute:</span> {sub}</p>}
            {l.type === 'unpaid' && <p className="text-muted-foreground">Unpaid days are deducted on that month’s salary sheet.</p>}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate('/staff/leave')}>Open leave requests →</button>
          </div>,
        onDecision: (ok, n) => {
          staffStore.decideLeave(l.id, ok, n);
          toast.success(ok ? `${l.id} approved` : `${l.id} rejected`);
        }
      });
    });
    payroll.sheets.filter((s) => s.status === 'submitted').forEach((s) => {
      const net = s.rows.reduce((t, r) => t + r.net, 0);
      list.push({
        id: s.id,
        kind: 'Salary sheet',
        icon: HandCoins,
        title: `Salary · ${monthLabel(s.month)} · ${formatBDT(net)}`,
        detail: `${s.rows.length} staff · prepared by ${s.createdBy}`,
        status: 'submitted',
        history: s.history,
        approveLabel: 'Approve sheet',
        body: <div className="space-y-1.5 text-[13px]">
            <p>Net payable <b>{formatBDT(net)}</b> to {s.rows.length} staff after leave and advance deductions.</p>
            {s.createdBy === payroll.actor && <p className="text-warning">You prepared this sheet — someone else must approve it.</p>}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(`/payroll/sheets?sheet=${s.id}`)}>Open full sheet →</button>
          </div>,
        onDecision: (ok, n) => {
          if (s.createdBy === payroll.actor) {toast.error('You can’t approve a sheet you prepared');return;}
          payroll.decide(s.id, ok, n);
          toast.success(ok ? `${s.id} approved` : `${s.id} returned to ${s.createdBy}`);
        }
      });
    });
    admin.concessions.filter((c) => c.status === 'pending').forEach((c) => {
      const st = admin.students.find((s) => s.id === c.studentId);
      const amt = concessionAmount(c, tuitionFor(st, admin.feeHeads));
      list.push({
        id: c.id,
        kind: 'Fee concession',
        icon: BadgePercent,
        title: `${st?.name ?? c.studentId} — ${CONCESSION_LABEL[c.type]} · ${formatBDT(amt)}/month`,
        detail: `${c.reason} · by ${c.requestedBy}`,
        status: 'pending',
        history: c.history,
        approveLabel: 'Approve concession',
        body: <div className="space-y-1.5 text-[13px]">
            <p><span className="text-muted-foreground">Period:</span> {monthToLabel(c.from)} – {c.to ? monthToLabel(c.to) : 'ongoing'}</p>
            <p><span className="text-muted-foreground">Reason:</span> {c.reason}</p>
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate('/fees/concessions')}>Open concessions →</button>
          </div>,
        onDecision: (ok, n) => {
          admin.decideConcession(c.id, ok, n);
          toast.success(ok ? `${c.id} approved` : `${c.id} rejected`);
        }
      });
    });
    fin.pending.filter((t) => t.createdBy !== fin.actor).forEach((t) => {
      const fee = t.kind === 'transfer' ? fin.txns.find((x) => x.pairId === t.id) : undefined;
      const what = t.kind === 'transfer' ? `${fin.accountName(t.accountId)} → ${fin.accountName(t.toAccountId)}` : t.kind === 'adjustment' ? `Reconcile ${fin.accountName(t.accountId)}` : fin.categoryName(t.categoryId);
      list.push({
        id: t.id,
        kind: t.kind === 'transfer' ? 'Money transfer' : t.kind === 'income' ? 'Income entry' : t.kind === 'expense' ? 'Expense entry' : 'Reconciliation',
        icon: Landmark,
        title: `${t.voucher} · ${formatBDT(t.amount)} · ${what}`,
        detail: [fin.partyName(t.partyId), t.note, `by ${t.createdBy}`].filter(Boolean).join(' · '),
        status: 'pending',
        history: t.history,
        approveLabel: 'Approve & post',
        body: <div className="space-y-1.5 text-[13px]">
            <p><span className="text-muted-foreground">Date:</span> {formatDate(t.date)} · {t.method ?? '—'}{t.reference ? ` · ${t.reference}` : ''}</p>
            {fee && <p><span className="text-muted-foreground">Transfer fee:</span> {formatBDT(fee.amount)} (posted together)</p>}
            {t.note && <p><span className="text-muted-foreground">Note:</span> {t.note}</p>}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate('/accounts/transactions')}>Open in Accounts →</button>
          </div>,
        onDecision: (ok, n) => {
          if (ok) fin.approve([t.id], n);else fin.returnTxn(t.id, n);
          toast.success(ok ? `${t.voucher} posted` : `${t.voucher} returned to ${t.createdBy}`);
        }
      });
    });
    return list;
  }, [plans, makeups, assessments, corrections, decidePlan, decideMakeup, moveStage, decideCorrection, navigate, fin, staffStore, payroll, admin]);
  const open = items.find((i) => i.id === openId);
  return <Panel title="Action queue" description={`${items.length} items need your decision`} flush>
      {items.length === 0 ? <EmptyState title="Inbox zero" hint="Nothing is waiting for approval." /> : <ul className="divide-y divide-border">
          {items.map((i) => <li key={i.id} className="flex items-center gap-3 px-4 py-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><i.icon className="size-3.5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{i.title}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">{i.kind} · {i.detail}</p>
              </div>
              <StatusBadge status={i.status} className="hidden sm:inline-flex" />
              <Button size="sm" variant={canApprove ? 'default' : 'outline'} onClick={() => setOpenId(i.id)}>{canApprove ? 'Review' : 'View'}</Button>
            </li>)}
        </ul>}
      {open && <ApprovalDialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)} title={open.title} description={open.kind} history={open.history} approveLabel={open.approveLabel} readOnly={!canApprove} onDecision={open.onDecision}>
          {open.body}
        </ApprovalDialog>}
    </Panel>;
}
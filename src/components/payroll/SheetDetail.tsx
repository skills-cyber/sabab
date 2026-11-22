import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, FileText, HandCoins, Send, ShieldCheck, Trash2, UserMinus } from 'lucide-react';
import { PaymentFileDialog } from './PaymentFileDialog';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { KpiStrip } from '../common/KpiStrip';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { PersonCell } from '../common/PersonCell';
import { Panel } from '../common/Panel';
import { Notice } from '../common/Notice';
import { ApprovalTimeline } from '../common/ApprovalTimeline';
import { ApprovalDialog } from '../common/ApprovalDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PayDialog } from './PayDialog';
import { PayslipDialog } from './PayslipDialog';
import { usePayroll } from '../../contexts/PayrollContext';
import { useStaff } from '../../contexts/StaffContext';
import { campuses } from '../../data/school';
import type { SheetRow } from '../../types/payroll';
import { downloadCsv, formatBDT } from '../../utils/format';
import { monthLabel } from '../../utils/payroll';

/** One salary sheet: review & adjust (draft) → submit → approve/return → pay → payslips. */
export function SheetDetail({ sheetId, onBack }: {sheetId: string;onBack: () => void;}) {
  const payroll = usePayroll();
  const { staff } = useStaff();
  const sheet = payroll.sheets.find((s) => s.id === sheetId);
  const [review, setReview] = useState(false);
  const [pay, setPay] = useState<{open: boolean;ids?: string[];}>({ open: false });
  const [slip, setSlip] = useState<{sheetId: string;staffId: string;} | null>(null);
  const [del, setDel] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);

  if (!sheet) return <Notice kind="info" action={<Button size="sm" variant="outline" onClick={onBack}>Back</Button>}>This sheet no longer exists.</Notice>;

  const editable = (sheet.status === 'draft' || sheet.status === 'returned') && payroll.canPrepare;
  const payable = (sheet.status === 'approved' || sheet.status === 'partly-paid') && payroll.canPrepare;
  const person = (id: string) => staff.find((s) => s.id === id);
  const sum = (k: keyof SheetRow) => sheet.rows.reduce((t, r) => t + (Number(r[k]) || 0), 0);
  const remaining = sum('net') - sum('paid');
  const lastReturn = [...sheet.history].reverse().find((h) => h.action === 'Returned');
  const lock = editable ? null : sheet.status === 'submitted' ? 'Waiting for approval — locked.' : sheet.status === 'draft' || sheet.status === 'returned' ? 'Only the accountant or owner edits sheets.' : 'Approved sheets are locked.';

  const num = (row: SheetRow, k: 'bonus' | 'leaveDays' | 'advanceRecovery', max: number, label: string) => (v: string) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > max) return `0–${max}`;
    if (k === 'leaveDays' && !Number.isInteger(n)) return 'Whole days';
    payroll.updateRow(sheet.id, row.staffId, { [k]: n });
    toast.success(`${label} updated for ${person(row.staffId)?.name}`);
  };

  const columns: Column<SheetRow>[] = [
  { id: 'name', header: 'Staff', sortValue: (r) => person(r.staffId)?.name ?? '', cell: (r) => <PersonCell name={person(r.staffId)?.name ?? r.staffId} sub={`${r.staffId} · ${person(r.staffId)?.designation ?? ''}`} /> },
  { id: 'gross', header: 'Gross', align: 'right', sortValue: (r) => r.gross, cell: (r) => <span className="tabular">{formatBDT(r.gross)}</span> },
  {
    id: 'leave', header: 'Unpaid leave', align: 'right', mobileHidden: true, sortValue: (r) => r.leaveDeduction,
    cell: (r) => r.leaveDays ? <span className="tabular text-danger">−{formatBDT(r.leaveDeduction)}<span className="block text-[11px] text-muted-foreground">{r.leaveDays} day{r.leaveDays === 1 ? '' : 's'}</span></span> : <span className="text-subtle">—</span>,
    edit: { value: (r) => String(r.leaveDays), type: 'number', lockedReason: () => lock, onSave: (r, v) => num(r, 'leaveDays', sheet.workingDays, 'Leave days')(v) }
  },
  { id: 'pf', header: 'PF / tax', align: 'right', mobileHidden: true, hideable: true, cell: (r) => r.otherDeductions ? <span className="tabular">−{formatBDT(r.otherDeductions)}</span> : <span className="text-subtle">—</span> },
  {
    id: 'adv', header: 'Advance', align: 'right', mobileHidden: true, sortValue: (r) => r.advanceRecovery,
    cell: (r) => r.advanceRecovery ? <span className="tabular text-warning">−{formatBDT(r.advanceRecovery)}</span> : <span className="text-subtle">—</span>,
    edit: { value: (r) => String(r.advanceRecovery), type: 'number', lockedReason: (r) => lock ?? (payroll.outstandingAdvance(r.staffId) === 0 && r.advanceRecovery === 0 ? 'No advance outstanding.' : null), onSave: (r, v) => num(r, 'advanceRecovery', Math.max(r.advanceRecovery, payroll.outstandingAdvance(r.staffId)), 'Advance recovery')(v) }
  },
  {
    id: 'bonus', header: 'Bonus', align: 'right', mobileHidden: true, sortValue: (r) => r.bonus,
    cell: (r) => r.bonus ? <span className="tabular text-success">+{formatBDT(r.bonus)}</span> : <span className="text-subtle">—</span>,
    edit: { value: (r) => String(r.bonus), type: 'number', lockedReason: () => lock, onSave: (r, v) => num(r, 'bonus', 100000, 'Bonus')(v) }
  },
  { id: 'net', header: 'Net pay', align: 'right', sortValue: (r) => r.net, cell: (r) => <b className="tabular">{formatBDT(r.net)}</b> },
  {
    id: 'paid', header: 'Paid', align: 'right', sortValue: (r) => r.net - r.paid,
    cell: (r) => ['approved', 'partly-paid', 'paid'].includes(sheet.status) ?
    r.paid >= r.net ? <StatusBadge status="paid" /> : r.paid ? <span className="tabular text-warning">{formatBDT(r.paid)}<span className="block text-[11px] text-muted-foreground">{formatBDT(r.net - r.paid)} due</span></span> : <StatusBadge status="unpaid" /> :
    <span className="text-subtle">—</span>
  }];


  const exportCsv = () => downloadCsv(`${sheet.id}.csv`, sheet.rows.map((r) => ({ ID: r.staffId, Name: person(r.staffId)?.name ?? '', Basic: r.basic, Allowances: r.allowances, Gross: r.gross, 'Leave days': r.leaveDays, 'Leave deduction': r.leaveDeduction, 'PF/Tax': r.otherDeductions, Advance: r.advanceRecovery, Bonus: r.bonus, Net: r.net, Paid: r.paid })));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button size="icon-sm" variant="outline" aria-label="Back to sheets" onClick={onBack}><ArrowLeft className="size-4" /></Button>
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">Salary · {monthLabel(sheet.month)} <StatusBadge status={sheet.status === 'partly-paid' ? 'partial' : sheet.status} label={sheet.status === 'partly-paid' ? 'Partly paid' : undefined} /></h2>
            <p className="text-[12.5px] text-muted-foreground">{sheet.id} · {campuses.find((c) => c.id === sheet.campusId)?.name} · {sheet.workingDays} working days · prepared by {sheet.createdBy}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}><Download className="size-4" /> CSV</Button>
          {editable && <Button size="sm" variant="outline" onClick={() => setDel(true)}><Trash2 className="size-4" /> Delete draft</Button>}
          {editable && <Button size="sm" onClick={() => {payroll.submit(sheet.id);toast.success(`${sheet.id} sent for approval`, { description: 'The principal/owner sees it in their action queue.' });}}><Send className="size-4" /> Submit for approval</Button>}
          {sheet.status === 'submitted' && payroll.canApprove && <Button size="sm" onClick={() => setReview(true)}><ShieldCheck className="size-4" /> Review & approve</Button>}
          {payable && remaining > 0 && <Button size="sm" variant="outline" onClick={() => setFileOpen(true)}><FileSpreadsheet className="size-4" /> Bank / bKash file</Button>}
          {payable && remaining > 0 && <Button size="sm" onClick={() => setPay({ open: true })}><HandCoins className="size-4" /> Pay salaries</Button>}
        </div>
      </div>

      {sheet.status === 'returned' && lastReturn?.note && <Notice kind="warning">Returned by {lastReturn.actor}: “{lastReturn.note}”. Fix and submit again.</Notice>}
      {sheet.status === 'submitted' && !payroll.canApprove && <Notice kind="locked">Waiting for owner or principal approval. Edits are locked.</Notice>}
      {sheet.status === 'paid' && <Notice kind="success">Everyone on this sheet is paid. Payslips are available per person.</Notice>}

      <KpiStrip
        items={[
        { label: 'Staff', value: sheet.rows.length },
        { label: 'Gross', value: formatBDT(sum('gross')) },
        { label: 'Deductions', value: formatBDT(sum('leaveDeduction') + sum('otherDeductions') + sum('advanceRecovery')), sub: `${formatBDT(sum('advanceRecovery'))} advance recovery` },
        { label: 'Bonus', value: formatBDT(sum('bonus')) },
        { label: 'Net payable', value: formatBDT(sum('net')), tone: 'primary', icon: CheckCircle2 },
        { label: 'Still to pay', value: formatBDT(['approved', 'partly-paid', 'paid'].includes(sheet.status) ? remaining : sum('net')), tone: remaining ? 'warning' : 'success', icon: HandCoins }]
        } />
      

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <DataTable
          ariaLabel="Salary sheet rows"
          rows={sheet.rows}
          columns={columns}
          getRowId={(r) => r.staffId}
          searchText={(r) => `${person(r.staffId)?.name ?? ''} ${r.staffId}`}
          searchPlaceholder="Find staff…"
          pageSize={25}
          bulkActions={payable ? (ids, clear) => <Button size="sm" onClick={() => {setPay({ open: true, ids });clear();}}><HandCoins className="size-4" /> Pay selected</Button> : undefined}
          rowActions={(r) => [
          { label: 'Payslip', icon: FileText, disabled: !['approved', 'partly-paid', 'paid'].includes(sheet.status), onSelect: () => setSlip({ sheetId: sheet.id, staffId: r.staffId }) },
          { label: 'Pay this person', icon: HandCoins, disabled: !payable || r.paid >= r.net, onSelect: () => setPay({ open: true, ids: [r.staffId] }) },
          { label: 'Remove from sheet', icon: UserMinus, destructive: true, separatorBefore: true, disabled: !editable, onSelect: () => {payroll.removeRow(sheet.id, r.staffId);toast.success(`${person(r.staffId)?.name} removed from ${sheet.id}`);} }]
          }
          footerNote={editable ? 'Hover leave, advance or bonus to adjust' : undefined} />
        
        <Panel title="History">
          <ApprovalTimeline entries={[...sheet.history].reverse()} />
        </Panel>
      </div>

      <ApprovalDialog
        open={review}
        onOpenChange={setReview}
        title={`Approve salary · ${monthLabel(sheet.month)}`}
        description={`${sheet.id} · ${sheet.rows.length} staff · net ${formatBDT(sum('net'))}`}
        history={sheet.history}
        approveLabel="Approve sheet"
        readOnly={sheet.createdBy === payroll.actor}
        readOnlyReason="You prepared this sheet — someone else must approve it."
        onDecision={(ok, note) => {payroll.decide(sheet.id, ok, note);toast.success(ok ? `${sheet.id} approved` : `${sheet.id} returned to ${sheet.createdBy}`, { description: ok ? 'The accountant can now pay salaries. Advance instalments are booked.' : undefined });}}>
        
        <dl className="grid grid-cols-2 gap-2 text-[13px]">
          <div><dt className="text-muted-foreground">Gross</dt><dd className="font-semibold tabular">{formatBDT(sum('gross'))}</dd></div>
          <div><dt className="text-muted-foreground">Unpaid leave</dt><dd className="font-semibold tabular">−{formatBDT(sum('leaveDeduction'))}</dd></div>
          <div><dt className="text-muted-foreground">Advance recovery</dt><dd className="font-semibold tabular">−{formatBDT(sum('advanceRecovery'))}</dd></div>
          <div><dt className="text-muted-foreground">Bonus</dt><dd className="font-semibold tabular">+{formatBDT(sum('bonus'))}</dd></div>
        </dl>
        <p className="rounded-md bg-muted px-2.5 py-1.5 text-[13px]">Net payable <b className="tabular">{formatBDT(sum('net'))}</b> to {sheet.rows.length} staff.</p>
      </ApprovalDialog>
      <PayDialog sheetId={pay.open ? sheet.id : null} preselect={pay.ids} onOpenChange={(o) => !o && setPay({ open: false })} />
      <PayslipDialog target={slip} onOpenChange={(o) => !o && setSlip(null)} />
      <PaymentFileDialog sheetId={fileOpen ? sheet.id : null} onOpenChange={(o) => !o && setFileOpen(false)} onRecordPaid={(ids) => setPay({ open: true, ids })} />
      <ConfirmDialog open={del} onOpenChange={setDel} title={`Delete ${sheet.id}?`} description="The draft is removed. You can generate it again." confirmLabel="Delete draft" destructive onConfirm={() => {payroll.deleteDraft(sheet.id);toast.success('Draft deleted');onBack();}} />
    </div>);

}
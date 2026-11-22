import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, CreditCard, FilePlus2, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { PersonCell } from '../common/PersonCell';
import { Segmented } from '../common/Segmented';
import { SelectField } from '../common/SelectField';
import { Field } from '../common/Field';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import type { Invoice, InvoiceStatus } from '../../types/finance';
import { invoiceBalance, invoiceStatus, invoiceTotal } from '../../utils/fees';
import { sectionLabel } from '../../utils/timetable';
import { concessionActiveIn } from '../../utils/concessions';
import { formatBDT, formatDate } from '../../utils/format';

type Filter = 'all' | InvoiceStatus;
const BILLABLE = ['4B', '6A', '7A', '8A', '8B', '9A'];

export function InvoicesTab() {
  const { invoices, students, applyDiscount, generateInvoices, queueMessage, concessions } = useAdmin();
  const { role } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [period, setPeriod] = useState('all');
  const [concession, setConcession] = useState<Invoice | null>(null);
  const [cAmt, setCAmt] = useState('');
  const [cNote, setCNote] = useState('');
  const [cErr, setCErr] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genSections, setGenSections] = useState<string[]>(BILLABLE);
  const canPost = role === 'accountant' || role === 'principal';
  const studentOf = (id: string) => students.find((s) => s.id === id);

  const periods = [...new Set(invoices.map((i) => i.period))];
  const rows = useMemo(() => invoices.filter((i) => (period === 'all' || i.period === period) && (filter === 'all' || invoiceStatus(i) === filter)), [invoices, period, filter]);
  const count = (s: InvoiceStatus) => invoices.filter((i) => (period === 'all' || i.period === period) && invoiceStatus(i) === s).length;

  const remind = (list: Invoice[]) => {
    const targets = list.filter((i) => invoiceBalance(i) > 0 && studentOf(i.studentId)?.smsOptIn);
    if (!targets.length) return toast.info('No opted-in guardians with dues in the selection.');
    queueMessage({ channel: 'SMS', audience: `Fee reminder · ${targets.length} guardians`, recipients: targets.length, template: 'Fee reminder', body: 'প্রিয় অভিভাবক, বকেয়া ফি পরিশোধ করুন।', credits: targets.length * 2 });
    toast.success(`Reminder queued to ${targets.length} guardians`, { description: `${targets.length * 2} SMS credits` });
  };

  const columns: Column<Invoice>[] = [
  { id: 'id', header: 'Invoice', sortValue: (i) => i.id, cell: (i) => <span className="font-medium tabular">{i.id}<span className="block text-[11px] font-normal text-muted-foreground">{i.period}</span></span> },
  { id: 'student', header: 'Student', sortValue: (i) => studentOf(i.studentId)?.name ?? '', cell: (i) => {const s = studentOf(i.studentId);return s ? <PersonCell name={s.name} sub={`${sectionLabel(s.sectionId)} · Roll ${s.roll}`} /> : i.studentId;} },
  { id: 'total', header: 'Total', align: 'right', sortValue: (i) => invoiceTotal(i), cell: (i) => <span className="tabular">{formatBDT(invoiceTotal(i))}{i.discount > 0 && <span className="block text-[11px] text-success" title={i.discountNote}>−{formatBDT(i.discount)}</span>}</span> },
  { id: 'paid', header: 'Paid', align: 'right', mobileHidden: true, cell: (i) => <span className="tabular text-muted-foreground">{formatBDT(i.paid)}</span> },
  { id: 'balance', header: 'Balance', align: 'right', sortValue: (i) => invoiceBalance(i), cell: (i) => <span className="font-medium tabular">{invoiceBalance(i) ? formatBDT(invoiceBalance(i)) : '—'}</span> },
  { id: 'due', header: 'Due', mobileHidden: true, sortValue: (i) => i.dueDate, cell: (i) => <span className="whitespace-nowrap tabular">{formatDate(i.dueDate, 'd MMM')}</span> },
  { id: 'status', header: 'Status', cell: (i) => <StatusBadge status={invoiceStatus(i)} /> }];


  const saveConcession = () => {
    if (!concession) return;
    const n = Number(cAmt);
    if (!Number.isFinite(n) || n <= 0 || n > invoiceBalance(concession)) return setCErr(`Enter 1–${invoiceBalance(concession)}`);
    if (cNote.trim().length < 4) return setCErr('Reason required (e.g. “Hardship waiver approved by principal”).');
    applyDiscount(concession.id, n, cNote.trim());
    toast.success('Concession applied', { description: `${formatBDT(n)} on ${concession.id} · audited` });
    setConcession(null);
  };

  return (
    <>
      <DataTable
        ariaLabel="Invoices"
        rows={rows}
        columns={columns}
        getRowId={(i) => i.id}
        searchText={(i) => `${i.id} ${studentOf(i.studentId)?.name ?? ''} ${studentOf(i.studentId)?.studentNo ?? ''}`}
        searchPlaceholder="Invoice, student or ID…"
        toolbar={
        <>
            <SelectField size="sm" className="w-32" ariaLabel="Period" value={period} onValueChange={setPeriod} options={[{ value: 'all', label: 'All periods' }, ...periods.map((p) => ({ value: p, label: p }))]} />
            <Segmented ariaLabel="Status" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'overdue', label: 'Overdue', count: count('overdue') }, { value: 'unpaid', label: 'Unpaid', count: count('unpaid') }, { value: 'partial', label: 'Partial', count: count('partial') }, { value: 'paid', label: 'Paid' }]} />
          </>
        }
        toolbarRight={canPost ? <Button size="sm" variant="outline" onClick={() => setGenOpen(true)}><FilePlus2 className="size-4" /> Generate dues</Button> : undefined}
        rowActions={(i) => [
        { label: 'Collect payment', icon: CreditCard, disabled: !invoiceBalance(i) || !canPost, onSelect: () => navigate(`/fees/collection?collect=${i.studentId}`) },
        { label: 'Apply concession', icon: Percent, disabled: !invoiceBalance(i) || !canPost, onSelect: () => {setConcession(i);setCAmt('');setCNote('');setCErr(null);} },
        { label: 'Send reminder', icon: BellRing, disabled: !invoiceBalance(i), onSelect: () => remind([i]) }]
        }
        bulkActions={(ids, clear) => <Button size="xs" variant="outline" onClick={() => {remind(invoices.filter((i) => ids.includes(i.id)));clear();}}><BellRing className="size-3.5" /> Send reminders</Button>}
        emptyTitle="No invoices in this view" />
      

      <Dialog open={!!concession} onOpenChange={(o) => !o && setConcession(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply concession</DialogTitle>
            <DialogDescription>{concession?.id} · balance {formatBDT(concession ? invoiceBalance(concession) : 0)}. Posted as an adjustment — never edits the original invoice lines.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Amount (৳)" required htmlFor="cc-amt"><Input id="cc-amt" type="number" value={cAmt} onChange={(e) => setCAmt(e.target.value)} /></Field>
            <Field label="Reason" required error={cErr} htmlFor="cc-note"><Input id="cc-note" value={cNote} onChange={(e) => setCNote(e.target.value)} placeholder="Hardship waiver approved by principal" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConcession(null)}>Cancel</Button>
            <Button onClick={saveConcession}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate December 2026 dues</DialogTitle>
            <DialogDescription>Uses the current fee structure, transport routes and concessions. Students already billed for the period are skipped.</DialogDescription>
          </DialogHeader>
          <Field label="Sections">
            <div className="grid grid-cols-3 gap-2">
              {BILLABLE.map((s) =>
              <label key={s} className="flex items-center gap-1.5 text-[13px]">
                  <Checkbox checked={genSections.includes(s)} onCheckedChange={(v) => setGenSections((x) => v ? [...x, s] : x.filter((y) => y !== s))} />
                  {sectionLabel(s)}
                </label>
              )}
            </div>
          </Field>
          {(() => {
            const targets = students.filter((s) => s.status === 'active' && genSections.includes(s.sectionId) && !invoices.some((i) => i.studentId === s.id && i.period === 'Dec 2026'));
            const riders = targets.filter((s) => s.transport);
            const transport = riders.reduce((t, s) => t + (s.transportFee ?? 0), 0);
            const withConcession = targets.filter((s) => concessions.some((c) => c.studentId === s.id && concessionActiveIn(c, '2026-12'))).length;
            return (
              <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border text-[12.5px]">
                <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Students</dt><dd className="font-semibold tabular">{targets.length}</dd></div>
                <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Bus riders</dt><dd className="font-semibold tabular">{riders.length} · {formatBDT(transport)}</dd></div>
                <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Concessions</dt><dd className="font-semibold tabular">{withConcession}</dd></div>
              </dl>);

          })()}
          <p className="text-[11.5px] text-muted-foreground">Transport is billed from each rider’s route zone (one-way riders pay 60%). Approved concessions reduce tuition.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
            <Button disabled={!genSections.length} onClick={() => {const n = generateInvoices('Dec 2026', genSections);setGenOpen(false);setPeriod('Dec 2026');toast.success(n ? `${n} invoices generated` : 'Nothing new to generate', { description: n ? 'Due 10 Dec 2026' : 'All selected students are already billed.' });}}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

}
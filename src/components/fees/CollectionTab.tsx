import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Banknote, Eye, Plus, Printer, Smartphone, Undo2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { KpiStrip } from '../common/KpiStrip';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { PersonCell } from '../common/PersonCell';
import { Segmented } from '../common/Segmented';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '../ui/Button';
import { CollectDialog } from './CollectDialog';
import { ReceiptDialog } from './ReceiptDialog';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import type { PaymentMethod } from '../../types/finance';
import { invoiceBalance } from '../../utils/fees';
import { sectionLabel } from '../../utils/timetable';
import { TODAY, formatBDT, formatDate } from '../../utils/format';

interface ReceiptRow {
  receiptNo: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  date: string;
  time: string;
  status: 'posted' | 'reversed';
  periods: string;
  reason?: string;
}

type Scope = 'today' | 'all';

export function CollectionTab() {
  const { payments, students, invoices, reverseReceipt, dayClose } = useAdmin();
  const { role } = useApp();
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<Scope>('today');
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectFor, setCollectFor] = useState<string | undefined>();
  const [receipt, setReceipt] = useState<string | null>(null);
  const [reverse, setReverse] = useState<ReceiptRow | null>(null);
  const canPost = role === 'accountant' || role === 'principal';

  useEffect(() => {
    const sid = params.get('collect');
    if (sid || params.get('new') === '1') {
      setCollectFor(sid ?? undefined);
      setCollectOpen(true);
      params.delete('collect');
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const receipts = useMemo<ReceiptRow[]>(() => {
    const map = new Map<string, ReceiptRow>();
    payments.forEach((p) => {
      const inv = invoices.find((i) => i.id === p.invoiceId);
      const r = map.get(p.receiptNo);
      if (r) {
        r.amount += p.amount;
        if (inv && !r.periods.includes(inv.period)) r.periods += `, ${inv.period}`;
      } else {
        map.set(p.receiptNo, { receiptNo: p.receiptNo, studentId: p.studentId, amount: p.amount, method: p.method, reference: p.reference, date: p.date, time: p.time, status: p.status, periods: inv?.period ?? '', reason: p.reversalReason });
      }
    });
    return [...map.values()].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  }, [payments, invoices]);

  const today = receipts.filter((r) => r.date === TODAY && r.status === 'posted');
  const sumBy = (m: PaymentMethod[]) => today.filter((r) => m.includes(r.method)).reduce((s, r) => s + r.amount, 0);
  const outstanding = invoices.reduce((s, i) => s + invoiceBalance(i), 0);
  const rows = scope === 'today' ? receipts.filter((r) => r.date === TODAY) : receipts;
  const studentOf = (id: string) => students.find((s) => s.id === id);

  const columns: Column<ReceiptRow>[] = [
  { id: 'no', header: 'Receipt', sortValue: (r) => r.receiptNo, cell: (r) => <span className="font-medium tabular">{r.receiptNo}<span className="block text-[11px] font-normal text-muted-foreground">{formatDate(r.date, 'd MMM')} · {r.time}</span></span> },
  { id: 'student', header: 'Student', sortValue: (r) => studentOf(r.studentId)?.name ?? '', cell: (r) => {const s = studentOf(r.studentId);return s ? <PersonCell name={s.name} sub={`${sectionLabel(s.sectionId)} · ${s.studentNo}`} /> : r.studentId;} },
  { id: 'period', header: 'For', mobileHidden: true, cell: (r) => <span className="text-[12px] text-muted-foreground">{r.periods}</span> },
  { id: 'method', header: 'Method', cell: (r) => <span className="whitespace-nowrap">{r.method}{r.reference && <span className="block text-[11px] text-muted-foreground tabular">{r.reference}</span>}</span> },
  { id: 'amount', header: 'Amount', align: 'right', sortValue: (r) => r.amount, cell: (r) => <span className={r.status === 'reversed' ? 'text-subtle line-through tabular' : 'font-medium tabular'}>{formatBDT(r.amount)}</span> },
  { id: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> }];


  return (
    <div className="space-y-4">
      <KpiStrip
        items={[
        { label: 'Collected today', value: formatBDT(sumBy(['Cash', 'Bank', 'bKash', 'Nagad'])), sub: `${today.length} receipts`, icon: Wallet, tone: 'primary' },
        { label: 'Cash in drawer', value: formatBDT(sumBy(['Cash'])), sub: dayClose ? 'Day closed' : 'Counted at daily close', icon: Banknote, tone: 'success' },
        { label: 'Mobile banking', value: formatBDT(sumBy(['bKash', 'Nagad'])), sub: 'bKash + Nagad', icon: Smartphone, tone: 'info' },
        { label: 'Outstanding dues', value: formatBDT(outstanding), sub: 'All open invoices', icon: Wallet, tone: 'warning' }]
        } />
      
      <DataTable
        ariaLabel="Receipts"
        rows={rows}
        columns={columns}
        getRowId={(r) => r.receiptNo}
        onRowClick={(r) => setReceipt(r.receiptNo)}
        searchText={(r) => `${r.receiptNo} ${studentOf(r.studentId)?.name ?? ''} ${r.reference ?? ''}`}
        searchPlaceholder="Receipt, student or TRX ID…"
        toolbar={<Segmented ariaLabel="Date scope" value={scope} onChange={setScope} options={[{ value: 'today', label: 'Today', count: receipts.filter((r) => r.date === TODAY).length }, { value: 'all', label: 'All receipts' }]} />}
        toolbarRight={canPost ? <Button size="sm" onClick={() => {setCollectFor(undefined);setCollectOpen(true);}}><Plus className="size-4" /> Collect payment</Button> : undefined}
        rowActions={(r) => [
        { label: 'View receipt', icon: Eye, onSelect: () => setReceipt(r.receiptNo) },
        { label: 'Print receipt', icon: Printer, onSelect: () => setReceipt(r.receiptNo) },
        { label: 'Reverse receipt', icon: Undo2, destructive: true, separatorBefore: true, disabled: r.status === 'reversed' || !canPost, onSelect: () => setReverse(r) }]
        }
        emptyTitle="No receipts today yet"
        emptyHint="Payments you post appear here instantly."
        footerNote="Posted entries are immutable" />
      
      <CollectDialog open={collectOpen} onOpenChange={setCollectOpen} studentId={collectFor} onCollected={setReceipt} />
      <ReceiptDialog receiptNo={receipt} onOpenChange={(o) => !o && setReceipt(null)} />
      <ConfirmDialog
        open={!!reverse}
        onOpenChange={(o) => !o && setReverse(null)}
        title={`Reverse ${reverse?.receiptNo}?`}
        description={`${formatBDT(reverse?.amount ?? 0)} returns to the student's dues. The original entry stays in the ledger, marked reversed.`}
        confirmLabel="Reverse receipt"
        destructive
        reasonLabel="Reason for reversal"
        onConfirm={(reason) => {if (reverse) {reverseReceipt(reverse.receiptNo, reason);toast.warning(`${reverse.receiptNo} reversed`, { description: 'Logged in the audit trail.' });}}} />
      
    </div>);

}
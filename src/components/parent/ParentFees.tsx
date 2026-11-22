import React, { useState } from 'react';
import { CreditCard, Receipt } from 'lucide-react';
import { Panel } from '../common/Panel';
import { StatusBadge } from '../common/StatusBadge';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { CollectDialog } from '../fees/CollectDialog';
import { ReceiptDialog } from '../fees/ReceiptDialog';
import { useAdmin } from '../../contexts/AdminContext';
import type { Student } from '../../types/school';
import { invoiceBalance, invoiceStatus, invoiceTotal } from '../../utils/fees';
import { formatBDT, formatDate } from '../../utils/format';

export function ParentFees({ child }: {child: Student;}) {
  const { invoices, payments } = useAdmin();
  const [pay, setPay] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const inv = invoices.filter((i) => i.studentId === child.id).sort((a, b) => b.issuedOn.localeCompare(a.issuedOn));
  const due = inv.reduce((s, i) => s + invoiceBalance(i), 0);
  const receipts = [...new Map(payments.filter((p) => p.studentId === child.id).map((p) => [p.receiptNo, p])).values()];

  return (
    <div className="space-y-4">
      <Panel
        title="Fees"
        description={due ? `Outstanding ${formatBDT(due)}` : 'All dues cleared'}
        actions={due > 0 ? <Button size="sm" onClick={() => setPay(true)}><CreditCard className="size-4" /> Pay {formatBDT(due)}</Button> : <StatusBadge status="paid" />}
        flush>
        
        <ul className="divide-y divide-border">
          {inv.map((i) =>
          <li key={i.id} className="px-4 py-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{i.period} <span className="text-[11px] font-normal text-muted-foreground">· due {formatDate(i.dueDate, 'd MMM')}</span></span>
                <StatusBadge status={invoiceStatus(i)} />
              </div>
              <ul className="mt-1 space-y-0.5 text-[12px] text-muted-foreground">
                {i.lines.map((l) => <li key={l.headId} className="flex justify-between"><span>{l.label}</span><span className="tabular">{formatBDT(l.amount)}</span></li>)}
                {i.discount > 0 && <li className="flex justify-between text-success"><span>{i.discountNote ?? 'Concession'}</span><span className="tabular">−{formatBDT(i.discount)}</span></li>}
                <li className="flex justify-between border-t border-border pt-0.5 font-medium text-foreground"><span>Total · paid {formatBDT(i.paid)}</span><span className="tabular">{formatBDT(invoiceTotal(i))}</span></li>
              </ul>
            </li>
          )}
        </ul>
      </Panel>
      <Panel title="Receipts" flush>
        {receipts.length === 0 ? <p className="px-4 py-3 text-xs text-muted-foreground">No receipts yet.</p> :
        <ul className="divide-y divide-border">
            {receipts.map((p) =>
          <li key={p.receiptNo}>
                <button type="button" onClick={() => setReceipt(p.receiptNo)} className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[13px] hover:bg-muted/50">
                  <span className="flex items-center gap-2"><Receipt className="size-4 text-subtle" /><span>{p.receiptNo}<span className="block text-[11px] text-muted-foreground">{formatDate(p.date, 'd MMM')} · {p.method}</span></span></span>
                  {p.status === 'reversed' ? <StatusBadge status="reversed" /> : <span className="text-xs font-medium text-primary">View</span>}
                </button>
              </li>
          )}
          </ul>
        }
      </Panel>
      <Notice kind="preview">Online payment is a prototype: bKash / Nagad / SSLCOMMERZ need provider agreements and a backend callback before going live.</Notice>
      <CollectDialog open={pay} onOpenChange={setPay} studentId={child.id} onCollected={setReceipt} guardianMode />
      <ReceiptDialog receiptNo={receipt} onOpenChange={(o) => !o && setReceipt(null)} />
    </div>);

}
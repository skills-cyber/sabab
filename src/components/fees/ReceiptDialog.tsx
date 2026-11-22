import React from 'react';
import { Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { StatusBadge } from '../common/StatusBadge';
import { useAdmin } from '../../contexts/AdminContext';
import { school } from '../../data/school';
import { sectionLabel } from '../../utils/timetable';
import { formatBDT, formatDate } from '../../utils/format';

/** Bilingual printable receipt (A4/thermal friendly). */
export function ReceiptDialog({ receiptNo, onOpenChange }: {receiptNo: string | null;onOpenChange: (o: boolean) => void;}) {
  const { payments, students, invoices } = useAdmin();
  const lines = payments.filter((p) => p.receiptNo === receiptNo);
  const first = lines[0];
  const student = students.find((s) => s.id === first?.studentId);
  const total = lines.reduce((s, p) => s + p.amount, 0);

  return (
    <Dialog open={!!receiptNo} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="sr-only">Receipt {receiptNo}</DialogTitle></DialogHeader>
        {first && student &&
        <div className="print-area space-y-3 rounded-lg border border-border p-4 text-[13px]">
            <div className="text-center">
              <p className="font-semibold">{school.name}</p>
              <p lang="bn" className="font-bn text-xs text-muted-foreground">{school.bn}</p>
              <p className="text-[11px] text-muted-foreground">{school.address}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider">Money receipt · <span lang="bn" className="font-bn normal-case">টাকা প্রাপ্তির রসিদ</span></p>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12.5px]">
              <dt className="text-muted-foreground">Receipt no.</dt><dd className="text-right font-medium tabular">{first.receiptNo}</dd>
              <dt className="text-muted-foreground">Date</dt><dd className="text-right tabular">{formatDate(first.date)} {first.time}</dd>
              <dt className="text-muted-foreground">Student</dt><dd className="text-right">{student.name}</dd>
              <dt className="text-muted-foreground">Class / ID</dt><dd className="text-right tabular">{sectionLabel(student.sectionId)} · {student.studentNo}</dd>
              <dt className="text-muted-foreground">Method</dt><dd className="text-right">{first.method}{first.reference ? ` · ${first.reference}` : ''}</dd>
            </dl>
            <table className="w-full border-t border-border text-[12.5px]">
              <tbody>
                {lines.map((p) =>
              <tr key={p.id} className="border-b border-border"><td className="py-1.5">{invoices.find((i) => i.id === p.invoiceId)?.period} <span className="text-muted-foreground">({p.invoiceId})</span></td><td className="py-1.5 text-right tabular">{formatBDT(p.amount)}</td></tr>
              )}
                <tr><td className="pt-2 font-semibold">Total received · <span lang="bn" className="font-bn">মোট</span></td><td className="pt-2 text-right font-semibold tabular">{formatBDT(total)}</td></tr>
              </tbody>
            </table>
            <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
              <span>Collected by {first.collectedBy}</span>
              {first.status === 'reversed' ? <StatusBadge status="reversed" /> : <StatusBadge status="posted" />}
            </div>
          </div>
        }
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
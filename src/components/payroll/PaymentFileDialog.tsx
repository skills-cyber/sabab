import React, { useEffect, useMemo, useState } from 'react';
import { Download, HandCoins } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { Notice } from '../common/Notice';
import { usePayroll } from '../../contexts/PayrollContext';
import { useStaff } from '../../contexts/StaffContext';
import { useAccounts } from '../../contexts/AccountsContext';
import { useAdmin } from '../../contexts/AdminContext';
import { maskNumber } from '../accounts/useAccounts';
import { downloadCsv, formatBDT } from '../../utils/format';
import { monthLabel } from '../../utils/payroll';

type Channel = 'bank' | 'mfs';

interface Props {
  sheetId: string | null;
  onOpenChange: (o: boolean) => void;
  /** Opens the pay dialog for the people in the file once the bank confirms. */
  onRecordPaid: (staffIds: string[]) => void;
}

/**
 * Bulk salary file for the bank (BEFTN/internal transfer) or bKash/Nagad disbursement.
 * Downloading does not move money — record the payment after the bank confirms.
 */
export function PaymentFileDialog({ sheetId, onOpenChange, onRecordPaid }: Props) {
  const payroll = usePayroll();
  const { staff } = useStaff();
  const fin = useAccounts();
  const { addAudit } = useAdmin();
  const sheet = payroll.sheets.find((s) => s.id === sheetId);
  const [channel, setChannel] = useState<Channel>('bank');
  const debitAccounts = fin.accounts.filter((a) => !a.archived && (channel === 'bank' ? a.type === 'bank' : a.type === 'wallet'));
  const [debitId, setDebitId] = useState('');

  useEffect(() => {if (sheetId) setChannel('bank');}, [sheetId]);
  useEffect(() => {setDebitId(debitAccounts[0]?.id ?? ''); /* eslint-disable-next-line react-hooks/exhaustive-deps */}, [channel, sheetId]);

  const rows = useMemo(() => (sheet?.rows ?? []).filter((r) => r.net - r.paid > 0).map((r) => ({ r, p: staff.find((s) => s.id === r.staffId) })).filter(({ p }) => channel === 'bank' ? p?.payMethod === 'Bank transfer' : p?.payMethod === 'bKash' || p?.payMethod === 'Nagad'), [sheet, staff, channel]);
  const ready = rows.filter(({ p }) => (p?.payAccount ?? '').replace(/\D/g, '').length >= 10);
  const missing = rows.filter((x) => !ready.includes(x));
  const total = ready.reduce((t, { r }) => t + r.net - r.paid, 0);
  const debit = fin.accounts.find((a) => a.id === debitId);
  const bal = debit ? fin.balanceOf(debit.id).balance : 0;
  const cashOthers = (sheet?.rows ?? []).filter((r) => r.net - r.paid > 0 && staff.find((s) => s.id === r.staffId)?.payMethod === 'Cash').length;

  const download = () => {
    if (!sheet || !ready.length) return;
    const narration = `Salary ${monthLabel(sheet.month)}`;
    downloadCsv(`${sheet.id}-${channel === 'bank' ? 'bank' : 'mfs'}-file.csv`, ready.map(({ r, p }, i) => channel === 'bank' ?
    { 'Sl': i + 1, 'Debit account': debit?.number ?? '', 'Beneficiary name': p?.name ?? '', 'Beneficiary account': (p?.payAccount ?? '').replace(/\D/g, ''), 'Amount (BDT)': r.net - r.paid, 'Narration': narration, 'Employee ID': r.staffId } :
    { 'Sl': i + 1, 'Wallet': p?.payMethod ?? '', 'Wallet number': (p?.payAccount ?? '').replace(/\D/g, ''), 'Name': p?.name ?? '', 'Amount (BDT)': r.net - r.paid, 'Reference': `${narration} ${r.staffId}` }));
    addAudit('Payroll', 'Salary payment file downloaded', `${sheet.id} · ${channel === 'bank' ? 'Bank' : 'MFS'} · ${ready.length} staff · ${formatBDT(total)}`, 'warning');
    toast.success('Payment file downloaded', { description: 'Upload it in your bank / bKash business portal. Record the payment here once it’s confirmed.' });
  };

  return (
    <Dialog open={!!sheet} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Salary payment file · {sheet ? monthLabel(sheet.month) : ''}</DialogTitle>
          <DialogDescription>A bulk file to upload to the bank or bKash business portal. Downloading it doesn’t pay anyone.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-end gap-3">
          <Segmented ariaLabel="Channel" value={channel} onChange={setChannel} options={[{ value: 'bank', label: 'Bank transfer' }, { value: 'mfs', label: 'bKash / Nagad' }]} />
          <Field label="Debit account" htmlFor="pf-acc" className="min-w-[220px] flex-1">
            <SelectField id="pf-acc" value={debitId} placeholder="No account of this type" onValueChange={setDebitId} options={debitAccounts.map((a) => ({ value: a.id, label: `${a.name} ${maskNumber(a.number)} · ${formatBDT(fin.balanceOf(a.id).balance)}` }))} />
          </Field>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-[12.5px]">
            <thead className="bg-muted text-muted-foreground"><tr><th className="h-8 px-3 text-left font-medium">Staff</th><th className="px-3 text-left font-medium">{channel === 'bank' ? 'Account' : 'Wallet'}</th><th className="px-3 text-right font-medium">Amount</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">Nobody unpaid on this sheet is paid by {channel === 'bank' ? 'bank transfer' : 'bKash or Nagad'}.</td></tr>}
              {rows.map(({ r, p }) => {
                const ok = ready.some((x) => x.r.staffId === r.staffId);
                return (
                  <tr key={r.staffId} className="border-t border-border">
                    <td className="px-3 py-1.5">{p?.name}<span className="ml-1.5 text-[11px] text-muted-foreground">{r.staffId}</span></td>
                    <td className="px-3 py-1.5 tabular">{ok ? <>{channel === 'mfs' && <span className="mr-1 text-muted-foreground">{p?.payMethod}</span>}{maskNumber(p?.payAccount)}</> : <span className="text-danger">Missing / invalid number</span>}</td>
                    <td className={`px-3 py-1.5 text-right tabular ${ok ? '' : 'text-subtle line-through'}`}>{formatBDT(r.net - r.paid)}</td>
                  </tr>);

              })}
            </tbody>
            {ready.length > 0 && <tfoot><tr className="border-t border-border bg-muted/50 font-semibold"><td className="px-3 py-1.5" colSpan={2}>{ready.length} payments in file</td><td className="px-3 py-1.5 text-right tabular">{formatBDT(total)}</td></tr></tfoot>}
          </table>
        </div>
        {missing.length > 0 && <Notice kind="warning">{missing.length} staff left out — add their {channel === 'bank' ? 'bank account' : 'wallet'} number in Teachers & Staff, or pay them separately.</Notice>}
        {debit && total > bal && <Notice kind="error">{debit.name} has {formatBDT(bal)} — less than the file total. Transfer money in first.</Notice>}
        {cashOthers > 0 && <p className="text-[11.5px] text-muted-foreground">{cashOthers} staff are paid in cash and aren’t in any file.</p>}
        <p className="text-[11.5px] text-muted-foreground">The file contains full account numbers. Share it only through the bank portal.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" disabled={!ready.length || !debit} onClick={() => {onRecordPaid(ready.map(({ r }) => r.staffId));onOpenChange(false);}}><HandCoins className="size-4" /> Record as paid</Button>
          <Button disabled={!ready.length || !debit} onClick={download}><Download className="size-4" /> Download file</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
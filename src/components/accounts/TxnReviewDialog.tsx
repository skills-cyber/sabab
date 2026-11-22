import React from 'react';
import { toast } from 'sonner';
import { ApprovalDialog } from '../common/ApprovalDialog';
import { StatusBadge } from '../common/StatusBadge';
import { useAccounts } from '../../contexts/AccountsContext';
import type { Txn } from '../../types/accounts';
import { formatBDT, formatDate } from '../../utils/format';

interface Props {
  txn: Txn | null;
  onOpenChange: (o: boolean) => void;
}

const KIND_LABEL: Record<Txn['kind'], string> = { income: 'Income', expense: 'Expense', transfer: 'Transfer', adjustment: 'Reconciliation adjustment' };

/** Entry detail + history. Pending entries can be approved/returned by owner or principal (never by the person who recorded them). */
export function TxnReviewDialog({ txn, onOpenChange }: Props) {
  const store = useAccounts();
  if (!txn) return null;
  const t = txn;
  const fee = store.txns.find((x) => x.pairId === t.id);
  const isPending = t.status === 'pending-approval';
  const own = t.createdBy === store.actor;
  const readOnly = !isPending || !store.canApprove || own;
  const reason = !isPending ? `This entry is ${t.status === 'posted' ? 'posted' : t.status === 'reversed' ? 'reversed' : 'returned to the accountant'}.` : own ? 'You recorded this entry — another approver must decide.' : 'Only the owner or principal can approve.';
  const bal = store.balanceOf(t.accountId).balance;
  const short = isPending && t.kind !== 'income' && !(t.kind === 'adjustment' && t.direction === 'in') && t.amount + (fee?.amount ?? 0) > bal;

  const Row = ({ k, v }: {k: string;v: React.ReactNode;}) =>
  <div className="flex justify-between gap-4 border-b border-border py-1.5 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;


  return (
    <ApprovalDialog
      open={!!txn}
      onOpenChange={onOpenChange}
      title={`${t.voucher} · ${formatBDT(t.amount)}`}
      description={<span className="inline-flex items-center gap-2">{KIND_LABEL[t.kind]} <StatusBadge status={t.status} label={isPending ? 'Awaiting approval' : undefined} /></span>}
      history={t.history}
      approveLabel="Approve & post"
      readOnly={readOnly}
      readOnlyReason={reason}
      onDecision={(ok, note) => {
        if (ok) {
          if (short) return toast.error('Insufficient balance — the source account cannot cover this entry.');
          store.approve([t.id], note);
          toast.success(`${t.voucher} approved & posted`);
        } else {
          store.returnTxn(t.id, note);
          toast.success(`${t.voucher} returned to ${t.createdBy}`);
        }
      }}>
      
      <dl className="text-[13px]">
        <Row k="Date" v={formatDate(t.date)} />
        {t.kind === 'transfer' ?
        <>
            <Row k="From" v={store.accountName(t.accountId)} />
            <Row k="To" v={store.accountName(t.toAccountId)} />
            {fee && <Row k="Transfer fee" v={<span className="tabular">{formatBDT(fee.amount)} · Bank & MFS charges</span>} />}
          </> :

        <>
            <Row k={t.kind === 'income' ? 'Received into' : t.kind === 'adjustment' ? 'Account' : 'Paid from'} v={store.accountName(t.accountId)} />
            {t.kind !== 'adjustment' && <Row k="Category" v={store.categoryName(t.categoryId)} />}
            {t.partyId && <Row k={t.kind === 'income' ? 'From' : 'Paid to'} v={store.partyName(t.partyId)} />}
            {t.kind === 'adjustment' && <Row k="Direction" v={t.direction === 'in' ? 'Excess (add to book)' : 'Shortfall (deduct from book)'} />}
          </>
        }
        {t.method && <Row k="Method" v={t.method} />}
        {t.reference && <Row k="Reference" v={<span className="tabular">{t.reference}</span>} />}
        {t.note && <Row k="Note" v={t.note} />}
        {t.attachment && <Row k="Attachment" v={t.attachment} />}
        <Row k="Recorded by" v={t.createdBy} />
      </dl>
      {short && <p className="rounded-md bg-danger-bg px-2 py-1 text-xs text-danger">{store.accountName(t.accountId)} has only {formatBDT(bal)} — approve after funds arrive or return the entry.</p>}
    </ApprovalDialog>);

}
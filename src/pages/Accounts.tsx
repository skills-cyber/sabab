import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Plus } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { Notice } from '../components/common/Notice';
import { Button } from '../components/ui/Button';
import { OverviewTab } from '../components/accounts/OverviewTab';
import { TransactionsTab, type TypeFilter } from '../components/accounts/TransactionsTab';
import { AccountsTab } from '../components/accounts/AccountsTab';
import { PartiesTab } from '../components/accounts/PartiesTab';
import { CategoriesTab } from '../components/accounts/CategoriesTab';
import { AccountSheet } from '../components/accounts/AccountSheet';
import { AccountDialog } from '../components/accounts/AccountDialog';
import { TransferDialog } from '../components/accounts/TransferDialog';
import { TxnDialog } from '../components/accounts/TxnDialog';
import { ReconcileDialog } from '../components/accounts/ReconcileDialog';
import { useAccounts } from '../contexts/AccountsContext';
import type { FinAccount, Txn } from '../types/accounts';
import { formatBDT } from '../utils/format';

const TABS = ['overview', 'transactions', 'accounts', 'parties', 'categories'];
const LEGACY: Record<string, string> = { daybook: '/accounts/transactions', expenses: '/accounts/transactions?type=expense', registers: '/accounts/accounts' };

/** Accounts & Finance — accounts, transfers, income/expense, parties and categories with approvals. */
export function Accounts() {
  const { tab } = useParams();
  const [params, setParams] = useSearchParams();
  const store = useAccounts();

  const [accDialog, setAccDialog] = useState<{open: boolean;account?: FinAccount | null;}>({ open: false });
  const [transfer, setTransfer] = useState<{open: boolean;fromId?: string;editing?: Txn | null;}>({ open: false });
  const [txn, setTxn] = useState<{open: boolean;kind: 'income' | 'expense';accountId?: string;partyId?: string;editing?: Txn | null;}>({ open: false, kind: 'expense' });
  const [reconcile, setReconcile] = useState<FinAccount | null>(null);
  const [viewAcc, setViewAcc] = useState<string | null>(null);
  const [partyOpen, setPartyOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  // Deep links from quick actions / search: ?new=transfer|income|expense|account
  useEffect(() => {
    const n = params.get('new');
    if (!n) return;
    if (store.canRecord) {
      if (n === 'transfer') setTransfer({ open: true });else
      if (n === 'income' || n === 'expense') setTxn({ open: true, kind: n });else
      if (n === 'account') setAccDialog({ open: true });
    }
    params.delete('new');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (tab && LEGACY[tab]) return <Navigate to={LEGACY[tab]} replace />;
  if (!tab || !TABS.includes(tab)) return <Navigate to="/accounts/overview" replace />;

  const typeParam = params.get('type');
  const initialType: TypeFilter = typeParam === 'income' || typeParam === 'expense' || typeParam === 'transfer' ? typeParam : 'all';

  const editEntry = (t: Txn) => t.kind === 'transfer' ? setTransfer({ open: true, editing: t }) : setTxn({ open: true, kind: t.kind === 'income' ? 'income' : 'expense', editing: t });
  const record = (kind: 'income' | 'expense', opts: {accountId?: string;partyId?: string;} = {}) => setTxn({ open: true, kind, ...opts });
  const openTransfer = (fromId?: string) => {setViewAcc(null);setTransfer({ open: true, fromId });};
  const viewed = store.accounts.find((a) => a.id === viewAcc) ?? null;

  const contextual =
  tab === 'accounts' ? <Button size="sm" variant="outline" onClick={() => setAccDialog({ open: true })}><Plus className="size-4" /> Add account</Button> :
  tab === 'parties' ? <Button size="sm" variant="outline" onClick={() => setPartyOpen(true)}><Plus className="size-4" /> Add party</Button> :
  tab === 'categories' ? <Button size="sm" variant="outline" onClick={() => setCatOpen(true)}><Plus className="size-4" /> Add category</Button> :
  null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Accounts & Finance"
        bn="হিসাব ও অর্থ"
        description="Accounts, transfers, income and expense · all campuses"
        actions={store.canRecord ?
        <>
            {contextual}
            <Button size="sm" variant="outline" onClick={() => openTransfer()}><ArrowRightLeft className="size-4" /> Transfer</Button>
            <Button size="sm" variant="outline" onClick={() => record('income')}><ArrowDownLeft className="size-4" /> Income</Button>
            <Button size="sm" onClick={() => record('expense')}><ArrowUpRight className="size-4" /> Expense</Button>
          </> :
        undefined} />
      
      <UnderlineTabs
        layoutId="acc-tabs"
        tabs={[
        { id: 'overview', label: 'Overview', to: '/accounts/overview' },
        { id: 'transactions', label: 'Transactions', to: '/accounts/transactions', count: store.pending.length + store.returned.length || undefined },
        { id: 'accounts', label: 'Accounts', to: '/accounts/accounts', count: store.accounts.filter((a) => !a.archived).length },
        { id: 'parties', label: 'Parties', to: '/accounts/parties' },
        { id: 'categories', label: 'Categories', to: '/accounts/categories' }]
        } />
      
      {!store.canRecord &&
      <Notice kind="locked">
          {store.canApprove ? `View & approve — entries are recorded by the accountant or owner. You approve amounts of ${formatBDT(store.approvalLimit)} or more.` : 'Read-only.'}
        </Notice>
      }

      {tab === 'overview' && <OverviewTab onAdd={() => setAccDialog({ open: true })} onView={(a) => setViewAcc(a.id)} />}
      {tab === 'transactions' && <TransactionsTab key={initialType} initialType={initialType} onEdit={editEntry} />}
      {tab === 'accounts' && <AccountsTab onAdd={() => setAccDialog({ open: true })} onEdit={(a) => setAccDialog({ open: true, account: a })} onView={(a) => setViewAcc(a.id)} onTransfer={openTransfer} onReconcile={setReconcile} />}
      {tab === 'parties' && <PartiesTab addOpen={partyOpen} setAddOpen={setPartyOpen} onRecord={(kind, partyId) => record(kind, { partyId })} />}
      {tab === 'categories' && <CategoriesTab addOpen={catOpen} setAddOpen={setCatOpen} />}

      <AccountSheet
        account={viewed}
        onOpenChange={(o) => !o && setViewAcc(null)}
        onEdit={(a) => setAccDialog({ open: true, account: a })}
        onTransfer={openTransfer}
        onRecord={(kind, accountId) => record(kind, { accountId })}
        onReconcile={setReconcile} />
      
      <AccountDialog open={accDialog.open} account={accDialog.account} onOpenChange={(o) => setAccDialog((s) => ({ ...s, open: o }))} />
      <TransferDialog open={transfer.open} fromId={transfer.fromId} editing={transfer.editing} onOpenChange={(o) => setTransfer((s) => ({ ...s, open: o }))} />
      <TxnDialog open={txn.open} initialKind={txn.kind} accountId={txn.accountId} partyId={txn.partyId} editing={txn.editing} onOpenChange={(o) => setTxn((s) => ({ ...s, open: o }))} />
      <ReconcileDialog account={reconcile} onOpenChange={(o) => !o && setReconcile(null)} />
    </div>);

}
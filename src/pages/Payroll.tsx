import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { HandCoins, Plus } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { Notice } from '../components/common/Notice';
import { Button } from '../components/ui/Button';
import { SheetsTab } from '../components/payroll/SheetsTab';
import { SheetDetail } from '../components/payroll/SheetDetail';
import { AdvancesTab } from '../components/payroll/AdvancesTab';
import { PaymentsTab } from '../components/payroll/PaymentsTab';
import { GenerateSheetDialog } from '../components/payroll/GenerateSheetDialog';
import { AdvanceDialog } from '../components/payroll/AdvanceDialog';
import { PayDialog } from '../components/payroll/PayDialog';
import { usePayroll } from '../contexts/PayrollContext';

const TABS = ['sheets', 'advances', 'payments'];

/** Payroll — monthly salary sheets with approval, payments from Accounts, advances and payslips. */
export function Payroll() {
  const { tab } = useParams();
  const [params, setParams] = useSearchParams();
  const payroll = usePayroll();
  const [generate, setGenerate] = useState(false);
  const [advance, setAdvance] = useState(false);
  const [paySheet, setPaySheet] = useState<string | null>(null);
  const openId = params.get('sheet');

  useEffect(() => {
    if (!params.get('new')) return;
    if (payroll.canPrepare) {
      if (tab === 'advances') setAdvance(true);else
      setGenerate(true);
    }
    params.delete('new');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (!TABS.includes(tab ?? '')) return <Navigate to="/payroll/sheets" replace />;

  const openSheet = (id: string | null) => {
    if (id) params.set('sheet', id);else
    params.delete('sheet');
    setParams(params);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll"
        bn="বেতন"
        description="Salary sheets, approvals, payments and advances · posts to Accounts as Salaries"
        actions={payroll.canPrepare ?
        <>
            <Button size="sm" variant="outline" onClick={() => setAdvance(true)}><HandCoins className="size-4" /> Give advance</Button>
            <Button size="sm" onClick={() => setGenerate(true)}><Plus className="size-4" /> Generate sheet</Button>
          </> :
        undefined} />
      
      <UnderlineTabs
        layoutId="payroll-tabs"
        tabs={[
        { id: 'sheets', label: 'Salary sheets', to: '/payroll/sheets', count: payroll.sheets.filter((s) => s.status === 'submitted').length || undefined },
        { id: 'advances', label: 'Advances', to: '/payroll/advances' },
        { id: 'payments', label: 'Payments', to: '/payroll/payments' }]
        } />
      
      {!payroll.canPrepare && <Notice kind="locked">{payroll.canApprove ? 'You approve or return salary sheets. The accountant prepares and pays them.' : 'Read-only.'}</Notice>}

      {tab === 'sheets' && (openId ?
      <SheetDetail key={openId} sheetId={openId} onBack={() => openSheet(null)} /> :
      <SheetsTab onOpen={openSheet} onGenerate={() => setGenerate(true)} onPay={setPaySheet} />)}
      {tab === 'advances' && <AdvancesTab onGive={() => setAdvance(true)} />}
      {tab === 'payments' && <PaymentsTab />}

      <GenerateSheetDialog open={generate} onOpenChange={setGenerate} onCreated={(id) => openSheet(id)} />
      <AdvanceDialog open={advance} onOpenChange={setAdvance} />
      <PayDialog sheetId={paySheet} onOpenChange={(o) => !o && setPaySheet(null)} />
    </div>);

}
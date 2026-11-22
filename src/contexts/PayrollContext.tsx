import React, { createContext, useContext } from 'react';
import { usePayrollStore, type PayrollStore } from '../components/payroll/usePayroll';

const PayrollContext = createContext<PayrollStore | null>(null);

/** Shares payroll app-wide so Staff profiles, Accounts parties, the approval queue and My leave & pay stay in sync. */
export function PayrollProvider({ children }: {children: React.ReactNode;}) {
  const store = usePayrollStore();
  return <PayrollContext.Provider value={store}>{children}</PayrollContext.Provider>;
}

export function usePayroll(): PayrollStore {
  const ctx = useContext(PayrollContext);
  if (!ctx) throw new Error('usePayroll must be used inside PayrollProvider');
  return ctx;
}
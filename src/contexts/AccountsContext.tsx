import React, { createContext, useContext } from 'react';
import { useAccountsStore, type AccountsStore } from '../components/accounts/useAccounts';

const AccountsContext = createContext<AccountsStore | null>(null);

/** Shares the accounts store app-wide so nav badges, the approval queue, fee collection and Settings stay in sync. */
export function AccountsProvider({ children }: {children: React.ReactNode;}) {
  const store = useAccountsStore();
  return <AccountsContext.Provider value={store}>{children}</AccountsContext.Provider>;
}

export function useAccounts(): AccountsStore {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used inside AccountsProvider');
  return ctx;
}
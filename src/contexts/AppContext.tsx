import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Role, RoleId } from '../types/school';
import { roles } from '../data/school';

interface AppContextValue {
  role: RoleId;
  roleInfo: Role;
  setRole: (r: RoleId) => void;
  campusId: string;
  setCampusId: (c: string) => void;
  year: string;
  setYear: (y: string) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  lang: 'en' | 'bn';
  setLang: (l: 'en' | 'bn') => void;
  online: boolean;
  setOnline: (o: boolean) => void;
  /** Leadership roles can approve / edit institution-level data. */
  canApprove: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  initialRole: RoleId;
  initialDark: boolean;
  children: React.ReactNode;
}

export function AppProvider({ initialRole, initialDark, children }: AppProviderProps) {
  const [role, setRole] = useState<RoleId>(initialRole);
  const [campusId, setCampusId] = useState('mirpur');
  const [year, setYear] = useState('2026');
  const [dark, setDark] = useState(initialDark);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [online, setOnline] = useState(true);

  useEffect(() => setRole(initialRole), [initialRole]);
  useEffect(() => setDark(initialDark), [initialDark]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const value = useMemo<AppContextValue>(() => {
    const roleInfo = roles.find((r) => r.id === role) ?? roles[0];
    return {
      role, roleInfo, setRole, campusId, setCampusId, year, setYear, dark, setDark, lang, setLang, online, setOnline,
      canApprove: role === 'principal' || role === 'owner' || role === 'coordinator'
    };
  }, [role, campusId, year, dark, lang, online]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
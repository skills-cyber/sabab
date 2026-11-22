import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandSearch } from './CommandSearch';
import { NavTree } from './NavTree';
import { SababLogo } from './SababLogo';
import { MobileDrawer } from './MobileDrawer';
import { Button } from '../ui/Button';
import { EmptyState } from '../common/EmptyState';
import { useApp } from '../../contexts/AppContext';
import { canAccess } from '../../data/navigation';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sabab.sidebar') === 'collapsed');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeDrawer = useCallback(() => setMobileOpen(false), []);
  const { role, roleInfo } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Close the drawer on navigation and when resizing to desktop (sidebar takes over).
  useEffect(() => setMobileOpen(false), [pathname, role]);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mq.matches && setMobileOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('sabab.sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const allowed = canAccess(role, pathname);
  const reduceMotion = useReducedMotion();
  // One animation per module (e.g. /fees/*) — switching tabs inside a module stays instant.
  const segs = pathname.split('/').filter(Boolean);
  const moduleKey = segs[0] === 'm' ? `m/${segs[1] ?? ''}` : segs[0] === 'exams' && segs[1] === 'a' ? `exams/a/${segs[2]}` : segs[0] ?? 'home';

  // Start each newly opened module at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [moduleKey]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileDrawer open={mobileOpen} onClose={closeDrawer} label={`Navigation · ${roleInfo.label}`}>
          <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-3.5">
            <SababLogo />
          </div>
          <NavTree onNavigate={() => setMobileOpen(false)} />
          <div className="shrink-0 border-t border-sidebar-border px-3.5 py-2.5 text-[11.5px] leading-snug">
            <p className="font-medium text-foreground">{roleInfo.user}</p>
            <p className="text-muted-foreground">{roleInfo.label} · {roleInfo.scope}</p>
          </div>
      </MobileDrawer>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileOpen(true)} onSearch={() => setSearchOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-4 lg:px-6" id="main">
          {allowed ?
          <motion.div
            key={moduleKey}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            
              <Outlet />
            </motion.div> :

          <div className="rounded-xl border border-border bg-card shadow-card">
              <EmptyState
              icon={ShieldOff}
              title="You don't have permission to view this page"
              hint={`${roleInfo.label} access is limited to: ${roleInfo.scope}. Ask your school administrator if you need access. (Enforced server-side in production.)`}
              action={<Button size="sm" onClick={() => navigate(roleInfo.home)}>Go to my home</Button>} />
            
            </div>
          }
        </main>
      </div>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>);

}
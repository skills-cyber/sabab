import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FileText, GraduationCap, Search, Building2, Zap } from 'lucide-react';
import { quickActions } from '../../data/quickActions';
import { Dialog, DialogContent, DialogTitle } from '../ui/Dialog';
import { useApp } from '../../contexts/AppContext';
import { useAdmin } from '../../contexts/AdminContext';
import { navForRole } from '../../data/navigation';
import { sectionLabel } from '../../utils/timetable';
import { canAccess } from '../../data/navigation';
import { cn } from '../../utils/cn';

interface Result {
  id: string;
  label: string;
  sub: string;
  href: string;
  kind: 'page' | 'student' | 'tenant' | 'action';
}

const icons = { page: FileText, student: GraduationCap, tenant: Building2, action: Zap };

/** Global search (Ctrl/⌘+K): pages, students (permission-scoped), tenants (platform only). */
export function CommandSearch({ open, onOpenChange }: {open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { role } = useApp();
  const { students, tenants } = useAdmin();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const pages: Result[] = navForRole(role).flatMap((g) =>
    g.items.flatMap((i) => i.children ? i.children.map((c) => ({ id: c.path, label: `${i.label} › ${c.label}`, sub: g.label, href: c.path, kind: 'page' as const })) : [{ id: i.path, label: i.label, sub: g.label, href: i.path, kind: 'page' as const }])
    );
    const studentResults: Result[] = canAccess(role, '/students') ?
    students.map((s) => ({ id: s.id, label: s.name, sub: `${s.studentNo} · ${sectionLabel(s.sectionId)} · ${s.guardianPhone}`, href: `/students?id=${s.id}`, kind: 'student' as const })) :
    [];
    const tenantResults: Result[] = role === 'platform' ? tenants.map((t) => ({ id: t.id, label: t.name, sub: `${t.id} · ${t.district}`, href: `/platform/tenants?id=${t.id}`, kind: 'tenant' as const })) : [];
    const actionResults: Result[] = (quickActions[role] ?? []).map((a) => ({ id: `qa-${a.href}`, label: a.label, sub: 'Quick action', href: a.href, kind: 'action' as const }));
    const all = [...actionResults, ...pages, ...studentResults, ...tenantResults];
    if (!term) return pages.slice(0, 8);
    return all.filter((r) => `${r.label} ${r.sub}`.toLowerCase().includes(term)).slice(0, 12);
  }, [q, role, students, tenants]);

  const go = (r: Result) => {
    navigate(r.href);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent placement="top" className="gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Search Sabab</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-subtle" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === 'Enter' && results[active]) go(results[active]);
            }}
            placeholder={role === 'platform' ? 'Search tenants, pages…' : 'Search students, guardians, phone, pages…'}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
            aria-label="Search" />
          
          <kbd className="rounded border border-border px-1.5 text-[10px] text-subtle">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5" role="listbox">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results for “{q}”</li>}
          {results.map((r, i) => {
            const Icon = icons[r.kind];
            return (
              <li key={`${r.kind}-${r.id}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left', i === active ? 'bg-accent text-accent-foreground' : 'text-foreground')}>
                  
                  <Icon className="size-4 shrink-0 text-subtle" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{r.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{r.sub}</span>
                  </span>
                  {i === active && <CornerDownLeft className="size-3.5 text-subtle" aria-hidden />}
                </button>
              </li>);

          })}
        </ul>
      </DialogContent>
    </Dialog>);

}
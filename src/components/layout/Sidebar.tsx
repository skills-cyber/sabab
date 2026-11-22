import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { SababLogo } from './SababLogo';
import { NavTree } from './NavTree';
import { useApp } from '../../contexts/AppContext';
import { campuses, school } from '../../data/school';
import { cn } from '../../utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { role, campusId } = useApp();
  const campus = campuses.find((c) => c.id === campusId);
  const isPlatform = role === 'platform';
  return (
    <aside
      className={cn('sticky top-0 z-20 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex', collapsed ? 'w-16' : 'w-64')}
      aria-label="Sidebar">
      
      <div className={cn('flex h-14 items-center justify-between px-3', collapsed && 'justify-center')}>
        <SababLogo collapsed={collapsed} />
        {!collapsed &&
        <button type="button" onClick={onToggle} className="inline-flex size-8 items-center justify-center rounded-md text-subtle hover:bg-sidebar-accent hover:text-foreground" aria-label="Collapse sidebar (Ctrl+B)" title="Collapse (Ctrl+B)">
            <PanelLeftClose className="size-4" />
          </button>
        }
      </div>
      {!collapsed &&
      <div className="mx-3 mb-1 flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-card px-2.5 py-2 shadow-card">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-primary">{isPlatform ? 'SP' : school.short.slice(0, 2)}</span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-foreground">{isPlatform ? 'Sabab Platform' : school.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{isPlatform ? 'Control plane · 10 tenants' : role === 'parent' ? 'Guardian portal' : campusId === 'all' ? 'All campuses' : campus?.name}</p>
          </div>
        </div>
      }
      <NavTree collapsed={collapsed} />
      <div className={cn('border-t border-sidebar-border p-2.5', collapsed && 'flex justify-center')}>
        {collapsed ?
        <button type="button" onClick={onToggle} className="inline-flex size-10 items-center justify-center rounded-lg text-subtle hover:bg-sidebar-accent" aria-label="Expand sidebar (Ctrl+B)">
            <PanelLeftOpen className="size-4" />
          </button> :

        <p className="px-1 text-[10.5px] leading-snug text-subtle">Prototype · fictional sample data · no live backend</p>
        }
      </div>
    </aside>);

}
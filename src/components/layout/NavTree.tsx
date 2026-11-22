import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { navForRole, type NavItem } from '../../data/navigation';
import { useApp } from '../../contexts/AppContext';
import { useNavBadges } from '../../hooks/useNavBadges';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { cn } from '../../utils/cn';
import { CountBadge } from '../common/CountBadge';

interface NavTreeProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** Role-filtered sidebar tree. Child links mirror the in-page underline tabs 1:1. */
export function NavTree({ collapsed, onNavigate }: NavTreeProps) {
  const { role, lang } = useApp();
  const { pathname } = useLocation();
  const badges = useNavBadges();
  const groups = navForRole(role);

  const isActive = (item: NavItem) => pathname === item.path || pathname.startsWith(item.path + '/');

  return (
    <nav className="flex-1 space-y-3 overflow-y-auto px-2.5 py-2 scrollbar-thin" aria-label="Main navigation">
      {groups.map((g) =>
      <div key={g.id}>
          {!collapsed && <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
            const active = isActive(item);
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            const primary = lang === 'bn' ? item.bn : item.label;
            const link =
            <NavLink
              to={item.children ? item.children[0].path : item.path}
              onClick={onNavigate}
              className={cn(
                'group relative flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                collapsed && 'mx-auto size-10 justify-center px-0',
                active ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-muted hover:text-foreground active:bg-sidebar-accent'
              )}
              aria-current={active ? 'page' : undefined}>
              
                  {active && <motion.span layoutId={collapsed ? 'nav-ind-c' : 'nav-ind'} className="absolute inset-0 rounded-lg bg-sidebar-accent" transition={{ duration: 0.18 }} />}
                  <item.icon className={cn('relative size-[18px] shrink-0 transition-[color,transform] duration-150 motion-reduce:transition-none', active ? 'text-sidebar-primary' : 'text-subtle group-hover:translate-x-0.5 group-hover:text-sidebar-primary')} aria-hidden />
                  {!collapsed &&
              <span className="relative min-w-0 flex-1 truncate">
                      <span lang={lang === 'bn' ? 'bn' : undefined} className={lang === 'bn' ? 'font-bn' : undefined}>{primary}</span>
                    </span>
              }
                  {!collapsed && item.phase &&
              <span className="relative rounded border border-border px-1 text-[9.5px] font-medium uppercase tracking-wide text-subtle">{item.phase === 'planned' ? 'Soon' : 'Preview'}</span>
              }
                  {collapsed ? <CountBadge count={badge} overlay className="ring-sidebar" /> : <CountBadge count={badge} className="relative" />}
                  {!collapsed && item.children && <ChevronRight className={cn('relative size-3.5 shrink-0 text-subtle transition-transform duration-150 group-hover:text-foreground', active && 'rotate-90')} aria-hidden />}
                </NavLink>;

            return (
              <li key={item.id}>
                  {collapsed ?
                <Tooltip>
                      <TooltipTrigger className="block w-full" aria-label={item.label}>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip> :

                link
                }
                  {!collapsed && item.children && active &&
                <ul className="ml-[22px] mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2.5">
                      {item.children.map((c) =>
                  <li key={c.path}>
                          <NavLink
                      to={c.path}
                      end
                      onClick={onNavigate}
                      className={({ isActive: a }) => cn('relative flex h-8 items-center rounded-md px-2 text-[12.5px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-sidebar-ring', a ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:-left-[11px] before:top-1.5 before:h-5 before:w-0.5 before:rounded-full before:bg-sidebar-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                      
                            {c.label}
                          </NavLink>
                        </li>
                  )}
                    </ul>
                }
                </li>);

          })}
          </ul>
        </div>
      )}
    </nav>);

}
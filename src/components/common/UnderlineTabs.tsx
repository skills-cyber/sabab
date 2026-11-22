import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { CountBadge } from './CountBadge';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  to?: string;
}

interface UnderlineTabsProps {
  tabs: TabItem[];
  value?: string;
  onChange?: (id: string) => void;
  layoutId?: string;
  className?: string;
}

/** HisabIQ underline tabs: 2px primary underline, 36px min height, route- or state-driven. */
export function UnderlineTabs({ tabs, value, onChange, layoutId = 'tab-underline', className }: UnderlineTabsProps) {
  const base = 'relative inline-flex h-9 shrink-0 items-center gap-1.5 px-1 text-[13px] font-medium transition-colors focus-visible:outline-2';
  const renderInner = (t: TabItem, active: boolean) =>
  <>
      {t.label}
      {typeof t.count === 'number' && <CountBadge count={t.count} tone={active ? 'active' : 'neutral'} />}
      {active && <motion.span layoutId={layoutId} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" transition={{ duration: 0.2 }} />}
    </>;

  return (
    <div role="tablist" className={cn('flex gap-5 overflow-x-auto border-b border-border scrollbar-thin', className)}>
      {tabs.map((t) =>
      t.to ?
      <NavLink key={t.id} to={t.to} end role="tab" className={({ isActive }) => cn(base, isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {({ isActive }) => renderInner(t, isActive)}
          </NavLink> :

      <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange?.(t.id)} className={cn(base, value === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {renderInner(t, value === t.id)}
          </button>

      )}
    </div>);

}
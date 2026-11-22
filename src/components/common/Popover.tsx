import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { menuUpVariants, menuVariants } from '../../utils/motion';

const GAP = 6;
const EDGE = 12;

interface PopoverProps {
  /** Trigger content (rendered inside a <button>). */
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel: string;
  /** Panel content; call close() after an action. */
  children: (close: () => void) => React.ReactNode;
  align?: 'start' | 'end';
  /** Preferred width in px; always clamped to viewport − 24px. */
  width?: number;
  className?: string;
}

/**
 * Sabab Popover — the single floating-panel primitive for menus in the app shell and tables.
 * Fixed-position in a body portal, clamped to the visible viewport on both axes (never causes
 * horizontal page scroll), flips above when there is no room below, closes on outside click,
 * Escape, scroll or route change, and only one is open at a time.
 */
export function Popover({ trigger, triggerClassName, triggerLabel, children, align = 'start', width = 224, className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{top: number;left: number;width: number;maxH: number;up: boolean;} | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const place = useCallback(() => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const w = Math.min(width, vw - EDGE * 2);
    let left = align === 'end' ? r.right - w : r.left;
    left = Math.max(EDGE, Math.min(left, vw - w - EDGE));
    const h = panelRef.current?.scrollHeight ?? 0;
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const flip = h > below && above > below;
    const maxH = Math.max(160, flip ? above : below);
    const top = flip ? Math.max(EDGE, r.top - GAP - Math.min(h, maxH)) : r.bottom + GAP;
    setPos({ top, left, width: w, maxH, up: flip });
  }, [align, width]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const id = requestAnimationFrame(place);
    return () => cancelAnimationFrame(id);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const n = e.target as Node;
      if (panelRef.current?.contains(n) || triggerRef.current?.contains(n)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== triggerRef.current) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    window.addEventListener('sabab:popover-open', onOther);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('sabab:popover-open', onOther);
    };
  }, [open, place]);

  useEffect(() => {
    if (open && pos) panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled), button:not(:disabled)')?.focus({ preventScroll: true });
  }, [open, pos]);

  const onPanelKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        data-state={open ? 'open' : 'closed'}
        onClick={(e) => {
          e.stopPropagation();
          if (!open) window.dispatchEvent(new CustomEvent('sabab:popover-open', { detail: triggerRef.current }));
          setPos(null);
          setOpen((o) => !o);
        }}
        className={triggerClassName}>
        
        {trigger}
      </button>
      {createPortal(
        <AnimatePresence>
          {open &&
          <motion.div
            key="popover"
            ref={panelRef}
            role="menu"
            aria-label={triggerLabel}
            data-floating-layer=""
            onKeyDown={onPanelKey}
            variants={pos?.up ? menuUpVariants : menuVariants}
            initial="hidden"
            animate={pos ? 'show' : 'hidden'}
            exit="exit"
            style={{
              position: 'fixed',
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: pos?.width ?? width,
              maxHeight: pos?.maxH,
              visibility: pos ? 'visible' : 'hidden',
              transformOrigin: `${pos?.up ? 'bottom' : 'top'} ${align === 'end' ? 'right' : 'left'}`
            }}
            className={cn('z-[100] overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg scrollbar-thin', className)}>
            
              {children(close)}
            </motion.div>
          }
        </AnimatePresence>,
        document.body
      )}
    </>);

}

interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  destructive?: boolean;
}

/** Item row for use inside <Popover>. */
export function MenuItem({ active, destructive, className, children, ...rest }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      {...rest}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] outline-none transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
        destructive ? 'text-danger hover:bg-danger-bg focus-visible:bg-danger-bg' : 'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
        active && 'bg-accent text-accent-foreground',
        className
      )}>
      
      {children}
    </button>);

}

export function MenuLabel({ children, className }: {children: React.ReactNode;className?: string;}) {
  return <p className={cn('px-2 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle', className)}>{children}</p>;
}
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, BoxIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { menuUpVariants, menuVariants } from "../../utils/motion";
export interface RowAction {
  label: string;
  icon?: BoxIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}
interface RowActionsProps {
  actions: RowAction[];
  label?: string;
  heading?: string;
  className?: string;
}
const MENU_W = 216;
const GAP = 4;
const EDGE = 8;

/**
 * The universal ⋯ action menu.
 * Rendered in a body portal with fixed positioning so it is never clipped by
 * scrolling tables or sticky columns. Flips above the trigger when there is not
 * enough room below, and clamps to the viewport horizontally — no scrolling needed.
 */
export function RowActions({
  actions,
  label = 'Row actions',
  heading,
  className
}: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    maxH: number;
    up: boolean;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const place = useCallback(() => {
    const t = triggerRef.current;
    const m = menuRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const h = m?.scrollHeight ?? 0;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const flip = h > below && above > below;
    const maxH = Math.max(120, flip ? above : below);
    const shown = Math.min(h, maxH);
    const top = flip ? r.top - GAP - shown : r.bottom + GAP;
    const left = Math.min(Math.max(EDGE, r.right - MENU_W), vw - MENU_W - EDGE);
    setPos({
      top,
      left,
      maxH,
      up: flip
    });
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    place();
    // second pass once the menu has measured height
    const id = requestAnimationFrame(place);
    return () => cancelAnimationFrame(id);
  }, [open, place]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);
  useEffect(() => {
    if (open && pos) itemsRef.current.find((b) => b && !b.disabled)?.focus();
  }, [open, pos]);
  const focusMove = (dir: 1 | -1) => {
    const items = itemsRef.current.filter((b): b is HTMLButtonElement => !!b && !b.disabled);
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + dir + items.length) % items.length].focus();
  };
  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusMove(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusMove(-1);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };
  const run = (a: RowAction) => {
    setOpen(false);
    window.setTimeout(a.onSelect, 0);
  };
  return <>
      <button ref={triggerRef} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} data-state={open ? 'open' : 'closed'} onClick={(e) => {
      e.stopPropagation();
      setPos(null);
      setOpen((o) => !o);
    }} onKeyDown={(e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
    }} className={cn('inline-flex size-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 data-[state=open]:bg-muted data-[state=open]:text-foreground', className)}>
        <MoreHorizontal className="size-4" />
      </button>
      {createPortal(<AnimatePresence>{open && <motion.div key="row-menu" ref={menuRef} role="menu" aria-label={label} data-floating-layer="" onKeyDown={onMenuKey} onClick={(e) => e.stopPropagation()} variants={pos?.up ? menuUpVariants : menuVariants} initial="hidden" animate={pos ? 'show' : 'hidden'} exit="exit" style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: MENU_W,
        maxHeight: pos?.maxH,
        visibility: pos ? 'visible' : 'hidden',
        transformOrigin: pos?.up ? 'bottom right' : 'top right'
      }} className="z-[100] overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg scrollbar-thin">
            {heading && <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{heading}</p>}
            {actions.map((a, i) => <React.Fragment key={a.label}>
                {a.separatorBefore && i > 0 && <div role="separator" className="-mx-1 my-1 h-px bg-border" />}
                <button ref={(el) => {
            itemsRef.current[i] = el;
          }} type="button" role="menuitem" disabled={a.disabled} onClick={() => run(a)} className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] outline-none transition-colors disabled:pointer-events-none disabled:opacity-45', a.destructive ? 'text-danger hover:bg-danger-bg focus:bg-danger-bg' : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground')}>
                  {a.icon && <a.icon className={cn('size-4 shrink-0', a.destructive ? 'text-danger' : 'text-muted-foreground')} aria-hidden />}
                  <span className="truncate">{a.label}</span>
                </button>
              </React.Fragment>)}
          </motion.div>}</AnimatePresence>, document.body)}
    </>;
}
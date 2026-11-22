import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CountBadge } from '../common/CountBadge';
import { AnimatePresence, motion } from 'framer-motion';
import { menuVariants } from '../../utils/motion';
import { navForRole, type NavItem } from '../../data/navigation';
import { useApp } from '../../contexts/AppContext';
import { useNavBadges } from '../../hooks/useNavBadges';
import { cn } from '../../utils/cn';

const EDGE = 12;
const PANEL_W = 232;

/**
 * Horizontal module navigation for tablet/phone widths (replaces the sidebar below lg).
 * Modules with sub-tabs reveal their tab list on hover (desktop pointer) or via the chevron (touch/keyboard).
 * The tab panel is portalled + viewport-clamped so the scrolling strip never clips it.
 */
export function TopNavStrip() {
  const { role, lang } = useApp();
  const { pathname } = useLocation();
  const badges = useNavBadges();
  const groups = navForRole(role);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pos, setPos] = useState<{top: number;left: number;} | null>(null);
  const anchors = useRef<Record<string, HTMLLIElement | null>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const closeTimer = useRef<number>();

  const isActive = (item: NavItem) => pathname === item.path || pathname.startsWith(item.path + '/');
  const allItems = groups.flatMap((g) => g.items);
  const openItem = allItems.find((i) => i.id === openId);

  const show = useCallback((id: string) => {
    window.clearTimeout(closeTimer.current);
    const el = anchors.current[id];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const left = Math.max(EDGE, Math.min(r.left, vw - PANEL_W - EDGE));
    setPos({ top: r.bottom + 4, left });
    setOpenId(id);
  }, []);
  const hideSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenId(null), 160);
  };
  const close = () => {
    window.clearTimeout(closeTimer.current);
    setOpenId(null);
  };

  // Close on route change, outside tap, Escape, page scroll.
  useEffect(close, [pathname]);
  useEffect(() => {
    if (!openId) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const n = e.target as Node;
      if (panelRef.current?.contains(n) || anchors.current[openId]?.contains(n)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onScroll = (e: Event) => !panelRef.current?.contains(e.target as Node) && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [openId]);

  // Keep the active module visible in the strip.
  useEffect(() => {
    const active = allItems.find(isActive);
    const el = active && anchors.current[active.id];
    if (el && stripRef.current) {
      const s = stripRef.current;
      const l = el.offsetLeft - 52;
      if (l < s.scrollLeft || el.offsetLeft + el.offsetWidth > s.scrollLeft + s.clientWidth - 52) s.scrollTo({ left: l, behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, role]);

  // Edge scroll affordances (‹ ›) shown only when more modules exist in that direction.
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = useCallback(() => {
    const s = stripRef.current;
    if (!s) return;
    setEdges({ left: s.scrollLeft > 2, right: s.scrollLeft + s.clientWidth < s.scrollWidth - 2 });
  }, []);
  useEffect(() => {
    const s = stripRef.current;
    if (!s) return;
    measure();
    s.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    return () => {
      s.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [measure, role, lang]);
  const nudge = (dir: 1 | -1) => {
    const s = stripRef.current;
    if (s) s.scrollBy({ left: dir * Math.max(160, s.clientWidth * 0.6), behavior: 'smooth' });
  };
  const edgeBtn = 'absolute top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-2';

  return (
    <nav aria-label="Modules" className="relative border-t border-border lg:hidden">
      {edges.left &&
      <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-12 bg-card/90" />
          <button type="button" onClick={() => nudge(-1)} aria-label="Scroll modules left" className={cn(edgeBtn, 'left-2')}>
            <ChevronLeft className="size-4" />
          </button>
        </>
      }
      {edges.right &&
      <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-12 bg-card/90" />
          <button type="button" onClick={() => nudge(1)} aria-label="Scroll modules right" className={cn(edgeBtn, 'right-2')}>
            <ChevronRight className="size-4" />
          </button>
        </>
      }
      <ul ref={stripRef} className={cn('flex scroll-px-12 items-center gap-0.5 overflow-x-auto px-2 py-1.5 [scrollbar-width:none] sm:px-3 [&::-webkit-scrollbar]:hidden')}>
        {groups.map((g, gi) =>
        <React.Fragment key={g.id}>
            {gi > 0 && <li aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />}
            {g.items.map((item) => {
            const active = isActive(item);
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            const hasTabs = !!item.children?.length;
            const label = lang === 'bn' ? item.bn : item.label;
            return (
              <li
                key={item.id}
                ref={(el) => {
                  anchors.current[item.id] = el;
                }}
                className="shrink-0"
                onMouseEnter={hasTabs ? () => show(item.id) : undefined}
                onMouseLeave={hasTabs ? hideSoon : undefined}>
                
                  <div className={cn('flex h-8 items-center rounded-md transition-colors', active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground', openId === item.id && !active && 'bg-muted text-foreground')}>
                    <NavLink to={hasTabs ? item.children![0].path : item.path} aria-current={active ? 'page' : undefined} className={cn('flex h-full items-center gap-1.5 rounded-md pl-2.5 text-[13px] font-medium', hasTabs ? 'pr-1' : 'pr-2.5')}>
                      <item.icon className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-subtle')} aria-hidden />
                      <span lang={lang === 'bn' ? 'bn' : undefined} className={cn('whitespace-nowrap', lang === 'bn' && 'font-bn')}>{label}</span>
                      {item.phase === 'planned' && <span className="rounded border border-border px-1 text-[9px] uppercase tracking-wide text-subtle">Soon</span>}
                      <CountBadge count={badge} className="ml-0.5" />
                    </NavLink>
                    {hasTabs &&
                  <button
                    type="button"
                    aria-label={`${item.label} tabs`}
                    aria-haspopup="menu"
                    aria-expanded={openId === item.id}
                    onClick={() => openId === item.id ? close() : show(item.id)}
                    className="grid h-full w-6 place-items-center rounded-md text-subtle hover:text-foreground">
                    
                        <ChevronDown className={cn('size-3.5 transition-transform', openId === item.id && 'rotate-180')} />
                      </button>
                  }
                  </div>
                </li>);

          })}
          </React.Fragment>
        )}
      </ul>

      {createPortal(
        <AnimatePresence>
          {openItem?.children && pos &&
          <motion.div
            key={openItem.id}
            ref={panelRef}
            role="menu"
            aria-label={`${openItem.label} tabs`}
            data-floating-layer=""
            onMouseEnter={() => window.clearTimeout(closeTimer.current)}
            onMouseLeave={hideSoon}
            variants={menuVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: PANEL_W, transformOrigin: 'top left' }}
            className="z-[100] rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
            
            <p className="flex items-center gap-2 px-2 pb-1.5 pt-1 text-[13px] font-semibold">
              <openItem.icon className="size-4 text-primary" aria-hidden />
              {openItem.label}
            </p>
            <ul className="space-y-0.5">
              {openItem.children.map((c) =>
              <li key={c.path}>
                  <NavLink
                  to={c.path}
                  end
                  role="menuitem"
                  onClick={close}
                  className={({ isActive: a }) => cn('flex h-8 items-center rounded-md px-2 text-[13px] transition-colors', a ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  
                    {c.label}
                  </NavLink>
                </li>
              )}
            </ul>
          </motion.div>
          }
        </AnimatePresence>,
        document.body
      )}
    </nav>);

}
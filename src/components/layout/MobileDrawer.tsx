import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}

/**
 * Left navigation drawer for < lg screens. Spring slide + overlay fade (framer-motion),
 * smooth exit, Escape / overlay to close, body scroll lock, focus moved in and restored on close.
 */
export function MobileDrawer({ open, onClose, label, children }: MobileDrawerProps) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();} else
        if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('[aria-current="page"], a[href]')?.focus({ preventScroll: true }), 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
          aria-hidden
          className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
          onClick={onClose} />
        
          <motion.aside
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="absolute inset-y-0 left-0 flex w-[min(86vw,300px)] flex-col bg-sidebar shadow-2xl will-change-transform"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 40, mass: 0.9 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.4, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80 || info.velocity.x < -400) onClose();
          }}>
          
            <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute right-2.5 top-3 z-10 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-2">
            
              <X className="size-4" />
            </button>
            {children}
          </motion.aside>
        </div>
      }
    </AnimatePresence>,
    document.body
  );
}
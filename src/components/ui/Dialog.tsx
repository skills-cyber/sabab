import React, { createContext, useContext, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { dialogVariants, fadeVariants } from '../../utils/motion';
import { isInFloatingLayer, useModalLayer } from '../../hooks/useModalLayer';

/**
 * Sabab Dialog — accessible modal (aria-modal, labelled title/description, Esc, focus trap,
 * scroll lock, focus restore) animated with Framer Motion: scrim fade + panel scale/fade.
 * Drop-in API: Dialog / DialogContent / DialogHeader / DialogTitle / DialogDescription / DialogFooter / DialogClose.
 */
interface Ctx {
  open: boolean;
  setOpen: (o: boolean) => void;
  titleId: string;
  descId: string;
}
const DialogCtx = createContext<Ctx | null>(null);
const useDialog = () => {
  const c = useContext(DialogCtx);
  if (!c) throw new Error('Dialog components must be inside <Dialog>');
  return c;
};

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, defaultOpen, onOpenChange, children }: DialogProps) {
  const [inner, setInner] = useState(!!defaultOpen);
  const uid = useId();
  const isOpen = open ?? inner;
  const setOpen = (o: boolean) => {
    if (open === undefined) setInner(o);
    onOpenChange?.(o);
  };
  return <DialogCtx.Provider value={{ open: isOpen, setOpen, titleId: `${uid}-t`, descId: `${uid}-d` }}>{children}</DialogCtx.Provider>;
}

export function DialogTrigger({ children, className }: {children: React.ReactNode;className?: string;}) {
  const { setOpen } = useDialog();
  return (
    <button type="button" className={className} onClick={() => setOpen(true)}>
      {children}
    </button>);

}

export function DialogClose({ children, className }: {children: React.ReactNode;className?: string;}) {
  const { setOpen } = useDialog();
  return (
    <button type="button" className={className} onClick={() => setOpen(false)}>
      {children}
    </button>);

}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  /** 'center' (default) or 'top' (command palette). */
  placement?: 'center' | 'top';
}

export function DialogContent({ className, children, showCloseButton = true, placement = 'center' }: DialogContentProps) {
  const { open, setOpen, titleId, descId } = useDialog();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalLayer(open, () => setOpen(false), panelRef);

  return createPortal(
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-50" key="dialog">
          <motion.div aria-hidden className="absolute inset-0 bg-black/45" variants={fadeVariants} initial="hidden" animate="show" exit="exit" />
          <div
          className={cn('absolute inset-0 flex justify-center overflow-y-auto p-4', placement === 'top' ? 'items-start pt-[12vh]' : 'items-center')}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isInFloatingLayer(e.target)) setOpen(false);
          }}>
          
            <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            tabIndex={-1}
            variants={dialogVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className={cn(
              'relative grid max-h-[calc(100dvh-2rem)] w-full max-w-lg gap-4 overflow-y-auto rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl outline-none scrollbar-thin',
              className
            )}>
            
              {children}
              {showCloseButton &&
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2">
              
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </button>
            }
            </motion.div>
          </div>
        </div>
      }
    </AnimatePresence>,
    document.body
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 pr-8 text-left', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialog();
  return <h2 id={titleId} className={cn('text-base font-semibold leading-tight text-foreground', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descId } = useDialog();
  return <p id={descId} className={cn('text-[13px] text-muted-foreground', className)} {...props} />;
}
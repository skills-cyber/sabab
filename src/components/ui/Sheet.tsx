import React, { createContext, useContext, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { fadeVariants, sheetVariants } from '../../utils/motion';
import { isInFloatingLayer, useModalLayer } from '../../hooks/useModalLayer';

/**
 * Sabab Sheet — side drawer for record previews. Accessible modal behaviour (shared with Dialog)
 * + Framer Motion spring slide-in, quick slide-out and scrim fade.
 */
interface Ctx {
  open: boolean;
  setOpen: (o: boolean) => void;
  titleId: string;
  descId: string;
}
const SheetCtx = createContext<Ctx | null>(null);
const useSheet = () => {
  const c = useContext(SheetCtx);
  if (!c) throw new Error('Sheet components must be inside <Sheet>');
  return c;
};

interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, defaultOpen, onOpenChange, children }: SheetProps) {
  const [inner, setInner] = useState(!!defaultOpen);
  const uid = useId();
  const isOpen = open ?? inner;
  const setOpen = (o: boolean) => {
    if (open === undefined) setInner(o);
    onOpenChange?.(o);
  };
  return <SheetCtx.Provider value={{ open: isOpen, setOpen, titleId: `${uid}-t`, descId: `${uid}-d` }}>{children}</SheetCtx.Provider>;
}

export function SheetClose({ children, className }: {children: React.ReactNode;className?: string;}) {
  const { setOpen } = useSheet();
  return (
    <button type="button" className={className} onClick={() => setOpen(false)}>
      {children}
    </button>);

}

interface SheetContentProps {
  side?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function SheetContent({ side = 'right', className, children, showCloseButton = true }: SheetContentProps) {
  const { open, setOpen, titleId, descId } = useSheet();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalLayer(open, () => setOpen(false), panelRef);

  return createPortal(
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-50" key="sheet">
          <motion.div
          aria-hidden
          className="absolute inset-0 bg-black/40"
          variants={fadeVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          onMouseDown={(e) => !isInFloatingLayer(e.target) && setOpen(false)} />
        
          <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          tabIndex={-1}
          variants={sheetVariants(side)}
          initial="hidden"
          animate="show"
          exit="exit"
          className={cn(
            'absolute inset-y-0 flex h-full w-3/4 flex-col gap-4 bg-card text-card-foreground shadow-2xl outline-none scrollbar-thin sm:max-w-sm',
            side === 'right' ? 'right-0 border-l border-border' : 'left-0 border-r border-border',
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
      }
    </AnimatePresence>,
    document.body
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-4 pr-12', className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-auto flex flex-col gap-2 border-t border-border p-4', className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useSheet();
  return <h2 id={titleId} className={cn('text-base font-semibold leading-tight text-foreground', className)} {...props} />;
}

export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descId } = useSheet();
  return <p id={descId} className={cn('text-[13px] text-muted-foreground', className)} {...props} />;
}
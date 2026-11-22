import { useEffect, useRef } from 'react';

/** Stack of open modal layers so only the top-most handles Escape / focus trapping. */
const stack: symbol[] = [];

/** True when the event target lives in a floating layer owned by another component (select list, popover, menu). */
export function isInFloatingLayer(node: EventTarget | null): boolean {
  return node instanceof Element && !!node.closest('[data-radix-popper-content-wrapper],[role="listbox"],[data-floating-layer]');
}

function floatingLayerOpen(): boolean {
  return !!document.querySelector('[data-radix-popper-content-wrapper],[data-floating-layer]');
}

/**
 * Accessible modal behaviour without coupling to a specific primitive library:
 * Escape to close (top layer only, ignored while a nested dropdown is open), Tab focus trap,
 * initial focus, focus restore, and body scroll lock.
 */
export function useModalLayer(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement>) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const id = Symbol('layer');
    stack.push(id);
    const restore = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])') ?? []).filter((el) => el.offsetParent !== null);

    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel || panel.contains(document.activeElement)) return;
      const auto = panel.querySelector<HTMLElement>('[autofocus],[data-autofocus]');
      const firstField = panel.querySelector<HTMLElement>('input:not(:disabled):not([type="hidden"]),textarea:not(:disabled)');
      (auto ?? firstField ?? panel).focus({ preventScroll: true });
    }, 40);

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        if (floatingLayerOpen() || e.defaultPrevented) return;
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const list = focusables();
        if (!list.length) return;
        const active = document.activeElement as HTMLElement | null;
        if (!panelRef.current?.contains(active)) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      if (stack.length === 0) document.body.style.overflow = prevOverflow;
      if (restore && document.contains(restore)) restore.focus({ preventScroll: true });
    };
  }, [open, panelRef]);
}
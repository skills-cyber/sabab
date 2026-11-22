import type { Transition, Variants } from 'framer-motion';

/**
 * Sabab motion tokens — the single source for every animation in the ERP (Framer Motion).
 * Rules: animate only transform + opacity (GPU-composited, no layout/paint thrash),
 * keep durations 120–280ms, never animate height/width/box-shadow, respect reduced-motion
 * (handled globally by <MotionConfig reducedMotion="user"> in App).
 */
export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  standard: [0.2, 0, 0, 1] as const
};

export const duration = { fast: 0.12, base: 0.18, slow: 0.26 };

export const spring = {
  /** Panels, drawers, sheets. */
  panel: { type: 'spring', stiffness: 380, damping: 40, mass: 0.9 } as Transition,
  /** Small indicators (segmented thumb, tab underline). */
  snappy: { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 } as Transition
};

/** Overlay scrim behind dialogs / sheets / drawer. */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.in } }
};

/** Centered modal dialog. */
export const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: duration.fast, ease: ease.in } }
};

/** Floating menus / popovers / dropdowns — tiny scale from their anchor. */
export const menuVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: -4 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.fast + 0.02, ease: ease.out } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.09, ease: ease.in } }
};

/** Same as menuVariants but for panels that open upward. */
export const menuUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 4 },
  show: menuVariants.show,
  exit: menuVariants.exit
};

/** Side sheets — x offset depends on side. */
export const sheetVariants = (side: 'left' | 'right'): Variants => ({
  hidden: { x: side === 'right' ? '100%' : '-100%' },
  show: { x: 0, transition: spring.panel },
  exit: { x: side === 'right' ? '100%' : '-100%', transition: { duration: 0.2, ease: ease.in } }
});

/** Page / module entrance. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } }
};

/** Wizard step change — direction-aware horizontal slide (+1 forward, -1 back). */
export const stepVariants: Variants = {
  hidden: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  show: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: ease.out } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -16, transition: { duration: duration.fast, ease: ease.in } })
};

/** Inline reveal for small banners/rows appearing in place. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: -4 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast } }
};
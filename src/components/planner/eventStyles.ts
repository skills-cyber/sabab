import type { CalendarEventType } from '../../types/academic';

export const eventTypeMeta: Record<CalendarEventType, {label: string;cell: string;chip: string;rank: number;}> = {
  holiday: { label: 'Holiday', cell: 'bg-danger-bg text-danger', chip: 'bg-danger-bg text-danger', rank: 6 },
  closure: { label: 'Closure', cell: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100', chip: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100', rank: 5 },
  exam: { label: 'Examination', cell: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200', chip: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200', rank: 4 },
  ct: { label: 'Class test window', cell: 'bg-info-bg text-info', chip: 'bg-info-bg text-info', rank: 3 },
  ramadan: { label: 'Ramadan routine', cell: 'bg-warning-bg text-warning', chip: 'bg-warning-bg text-warning', rank: 2 },
  event: { label: 'School event', cell: 'bg-accent text-accent-foreground', chip: 'bg-accent text-accent-foreground', rank: 1 },
  term: { label: 'Term', cell: '', chip: 'bg-muted text-muted-foreground', rank: 0 }
};
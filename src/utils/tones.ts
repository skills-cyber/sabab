export type SubjectTone = 'teal' | 'blue' | 'amber' | 'violet' | 'rose' | 'emerald' | 'sky' | 'orange' | 'slate' | 'indigo' | 'lime' | 'fuchsia' | 'cyan';

export const subjectToneClass: Record<SubjectTone, string> = {
  teal: 'bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-950/40 dark:text-teal-100 dark:border-teal-900',
  blue: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-900',
  amber: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900',
  violet: 'bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-950/40 dark:text-violet-100 dark:border-violet-900',
  rose: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-900',
  emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-900',
  sky: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-900',
  orange: 'bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/40 dark:text-orange-100 dark:border-orange-900',
  slate: 'bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-800/50 dark:text-slate-100 dark:border-slate-700',
  indigo: 'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-100 dark:border-indigo-900',
  lime: 'bg-lime-50 text-lime-900 border-lime-200 dark:bg-lime-950/40 dark:text-lime-100 dark:border-lime-900',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-100 dark:border-fuchsia-900',
  cyan: 'bg-cyan-50 text-cyan-900 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-100 dark:border-cyan-900'
};

export const subjectToneDot: Record<SubjectTone, string> = {
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  orange: 'bg-orange-500',
  slate: 'bg-slate-500',
  indigo: 'bg-indigo-500',
  lime: 'bg-lime-500',
  fuchsia: 'bg-fuchsia-500',
  cyan: 'bg-cyan-500'
};
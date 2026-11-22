import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { Field } from '../common/Field';
import { Segmented } from '../common/Segmented';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { revealVariants } from '../../utils/motion';
import type { SetupCampus, SetupDraft, SetupYear } from '../../types/setup';

interface Props {
  draft: SetupDraft;
  errors: Record<string, string>;
  onCampuses: (v: SetupCampus[]) => void;
  onYear: (v: SetupYear) => void;
}

const sub = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle';

/** Step 2 — campuses (1–2 on current plan) and the academic year with terms. */
export function CampusYearStep({ draft, errors, onCampuses, onYear }: Props) {
  const { campuses, year } = draft;
  const setCampus = (i: number, patch: Partial<SetupCampus>) => onCampuses(campuses.map((c, j) => j === i ? { ...c, ...patch } : c));
  const setTerm = (i: number, patch: Partial<SetupYear['terms'][number]>) => onYear({ ...year, terms: year.terms.map((t, j) => j === i ? { ...t, ...patch } : t) });

  return (
    <div className="space-y-5">
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className={sub}>Campuses · {campuses.length}/2 on Standard plan</h3>
          <Button size="xs" variant="outline" disabled={campuses.length >= 2} onClick={() => onCampuses([...campuses, { id: `c${Date.now()}`, name: '', short: '', address: '' }])}>
            <Plus className="size-3.5" /> Add campus
          </Button>
        </div>
        {errors.campuses && <p className="text-[11.5px] text-danger">{errors.campuses}</p>}
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {campuses.map((c, i) =>
            <motion.li key={c.id} variants={revealVariants} initial="hidden" animate="show" exit="exit" className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_120px_1.4fr_auto] sm:items-start">
                <Field label="Campus name" required error={errors[`campus-${i}`]} htmlFor={`cp-n-${i}`}>
                  <Input id={`cp-n-${i}`} value={c.name} onChange={(e) => setCampus(i, { name: e.target.value })} placeholder="Uttara Campus" />
                </Field>
                <Field label="Short" htmlFor={`cp-s-${i}`}>
                  <Input id={`cp-s-${i}`} value={c.short} onChange={(e) => setCampus(i, { short: e.target.value })} placeholder="Uttara" />
                </Field>
                <Field label="Address" htmlFor={`cp-a-${i}`}>
                  <Input id={`cp-a-${i}`} value={c.address} onChange={(e) => setCampus(i, { address: e.target.value })} />
                </Field>
                <Button size="icon" variant="ghost" className="mt-6 text-muted-foreground hover:text-danger" disabled={campuses.length === 1} aria-label={`Remove ${c.name || 'campus'}`} onClick={() => onCampuses(campuses.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              </motion.li>
            )}
          </AnimatePresence>
        </ul>
        {campuses.length >= 2 && <Notice kind="info">More campuses require the Multi-campus plan — ask your platform administrator.</Notice>}
      </section>

      <section className="space-y-2.5">
        <h3 className={sub}>Academic year</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Year label" htmlFor="ay-label"><Input id="ay-label" value={year.label} onChange={(e) => onYear({ ...year, label: e.target.value })} /></Field>
          <Field label="Starts" htmlFor="ay-start"><Input id="ay-start" type="date" value={year.start} onChange={(e) => onYear({ ...year, start: e.target.value })} /></Field>
          <Field label="Ends" error={errors.year} htmlFor="ay-end"><Input id="ay-end" type="date" value={year.end} onChange={(e) => onYear({ ...year, end: e.target.value })} /></Field>
          <Field label="Weekly holiday">
            <Segmented ariaLabel="Weekly holiday" value={year.weekend} onChange={(v) => onYear({ ...year, weekend: v })} options={[{ value: 'Fri', label: 'Fri' }, { value: 'Fri-Sat', label: 'Fri–Sat' }, { value: 'Sat-Sun', label: 'Sat–Sun' }]} />
          </Field>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-[13px]">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr><th className="h-9 px-3 text-left font-medium">Term</th><th className="px-3 text-left font-medium">Starts</th><th className="px-3 text-left font-medium">Ends</th><th className="w-10" /></tr>
            </thead>
            <tbody>
              {year.terms.map((t, i) =>
              <tr key={t.id} className="border-t border-border align-top">
                  <td className="px-3 py-2"><Input aria-label="Term name" className="h-8" value={t.name} onChange={(e) => setTerm(i, { name: e.target.value })} /></td>
                  <td className="px-3 py-2"><Input aria-label="Term start" type="date" className="h-8" value={t.start} onChange={(e) => setTerm(i, { start: e.target.value })} /></td>
                  <td className="px-3 py-2">
                    <Input aria-label="Term end" type="date" className="h-8" value={t.end} onChange={(e) => setTerm(i, { end: e.target.value })} />
                    {errors[`term-${i}`] && <p className="mt-1 text-[11px] text-danger">{errors[`term-${i}`]}</p>}
                  </td>
                  <td className="py-2 pr-2">
                    <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-danger" disabled={year.terms.length === 1} aria-label={`Remove ${t.name}`} onClick={() => onYear({ ...year, terms: year.terms.filter((_, j) => j !== i) })}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="border-t border-border px-3 py-2">
            <Button size="xs" variant="ghost" onClick={() => onYear({ ...year, terms: [...year.terms, { id: `t${Date.now()}`, name: `Term ${year.terms.length + 1}`, start: year.end, end: year.end }] })}>
              <Plus className="size-3.5" /> Add term
            </Button>
          </div>
        </div>
        <p className="text-[11.5px] text-muted-foreground">Holidays, exam windows and Ramadan routines are added later in Academic Planner › Calendar.</p>
      </section>
    </div>);

}
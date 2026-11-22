import React from 'react';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import type { SetupDraft, SetupFee, SetupSubject } from '../../types/setup';
import { formatBDT } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Props {
  draft: SetupDraft;
  errors: Record<string, string>;
  onSubjects: (v: SetupSubject[]) => void;
  onFees: (v: SetupFee[]) => void;
}

const th = 'h-9 px-3 text-xs font-medium text-muted-foreground';

/** Step 4 — subject template (grade range + weekly periods) and fee heads with default amounts. */
export function SubjectsFeesStep({ draft, errors, onSubjects, onFees }: Props) {
  const setSub = (id: string, patch: Partial<SetupSubject>) => onSubjects(draft.subjects.map((s) => s.id === id ? { ...s, ...patch } : s));
  const setFee = (id: string, patch: Partial<SetupFee>) => onFees(draft.fees.map((f) => f.id === id ? { ...f, ...patch } : f));
  const monthly = draft.fees.filter((f) => f.enabled && f.frequency === 'Monthly').reduce((s, f) => s + (f.amount || 0), 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <section className="min-w-0 space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">Subjects · {draft.subjects.filter((s) => s.enabled).length} enabled</h3>
          {errors.subjects && <span className="text-[11.5px] text-danger">{errors.subjects}</span>}
        </div>
        <div className="overflow-x-auto rounded-lg border border-border scrollbar-thin">
          <table className="w-full min-w-[480px] text-[13px]">
            <thead className="bg-muted"><tr><th className={cn(th, 'w-12 text-left')}>On</th><th className={cn(th, 'text-left')}>Subject</th><th className={cn(th, 'text-center')}>Classes</th><th className={cn(th, 'text-right')}>Periods/wk</th></tr></thead>
            <tbody>
              {draft.subjects.map((s) =>
              <tr key={s.id} className={cn('border-t border-border transition-opacity', !s.enabled && 'opacity-55')}>
                  <td className="px-3 py-1.5"><Switch checked={s.enabled} onCheckedChange={(v) => setSub(s.id, { enabled: v })} aria-label={`Enable ${s.name}`} /></td>
                  <td className="px-3 py-1.5"><span className="font-medium">{s.name}</span> <span lang="bn" className="font-bn text-[11px] text-muted-foreground">{s.bn}</span></td>
                  <td className="px-3 py-1.5 text-center tabular text-muted-foreground">{s.fromGrade}–{s.toGrade}</td>
                  <td className="px-3 py-1.5">
                    <Input aria-label={`${s.name} periods per week`} type="number" min={1} max={10} disabled={!s.enabled} value={s.periodsPerWeek} onChange={(e) => setSub(s.id, { periodsPerWeek: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })} className="ml-auto h-8 w-16 text-right tabular" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="min-w-0 space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">Fee heads</h3>
          <span className="text-[11.5px] text-muted-foreground">Monthly per student: <b className="font-semibold text-foreground tabular">{formatBDT(monthly)}</b></span>
        </div>
        {errors.fees && <p className="text-[11.5px] text-danger">{errors.fees}</p>}
        <ul className="divide-y divide-border rounded-lg border border-border">
          {draft.fees.map((f) =>
          <li key={f.id} className={cn('flex items-center gap-3 px-3 py-2 transition-opacity', !f.enabled && 'opacity-55')}>
              <Switch checked={f.enabled} onCheckedChange={(v) => setFee(f.id, { enabled: v })} aria-label={`Enable ${f.name}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{f.name}</p>
                <p className="text-[11px] text-muted-foreground">{f.frequency} · <span lang="bn" className="font-bn">{f.bn}</span></p>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">৳</span>
                <Input aria-label={`${f.name} amount`} type="number" min={0} disabled={!f.enabled} value={f.amount} onChange={(e) => setFee(f.id, { amount: Number(e.target.value) })} className="h-8 w-24 pl-6 text-right tabular" />
              </div>
            </li>
          )}
        </ul>
        <p className="text-[11.5px] text-muted-foreground">Per-class amounts, sibling discounts and scholarships are fine-tuned later in Fees › Fee structure.</p>
      </section>
    </div>);

}
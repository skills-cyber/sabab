import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleDot } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../common/StatusBadge';
import { SelectField } from '../common/SelectField';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import type { PromotionStore } from './usePromotion';
import type { PromotionOutcome } from '../../types/promotion';
import { FINAL_GRADES, MIN_ATTENDANCE, PASS_PCT } from '../../utils/annualResult';
import { sectionLabel } from '../../utils/timetable';
import { formatBDT } from '../../utils/format';
import { cn } from '../../utils/cn';

const OUTCOME_LABEL: Record<PromotionOutcome, string> = { promote: 'Promote', hold: 'Hold back', graduate: 'Graduate' };

/** Class-by-class review: suggestion, decision (override needs a reason) and next-year section. */
export function ReviewStep({ store }: {store: PromotionStore;}) {
  const [grade, setGrade] = useState(store.grades.find((g) => !store.reviewed.includes(g)) ?? store.grades[0]);
  const [pending, setPending] = useState<{id: string;name: string;outcome: PromotionOutcome;} | null>(null);
  const all = store.studentsInGrade(grade);
  const rows = useMemo(() => all.filter((s) => s.status === 'active').sort((a, b) => a.sectionId.localeCompare(b.sectionId) || a.roll - b.roll), [all]);
  const left = all.filter((s) => s.status === 'transferred' || s.status === 'withdrawn');
  const isReviewed = store.reviewed.includes(grade);
  const locked = !store.canDecide || isReviewed;
  const done = store.reviewed.length;
  const total = store.grades.length;

  const choose = (id: string, name: string, outcome: PromotionOutcome) => {
    if (outcome === store.suggestions[id]?.outcome) return store.setDecision(id, { outcome, reason: undefined });
    setPending({ id, name, outcome });
  };

  const markReviewed = () => {
    store.toggleReviewed(grade);
    toast.success(`Class ${grade} reviewed`);
    const next = store.grades.find((g) => g !== grade && !store.reviewed.includes(g));
    if (next !== undefined) setGrade(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-1.5 flex items-center justify-between text-[12.5px]"><span className="font-medium">Classes reviewed</span><span className="tabular text-muted-foreground">{done}/{total}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Classes reviewed"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${total ? done / total * 100 : 0}%` }} /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
        <nav aria-label="Classes" className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 lg:flex-col">
          {store.grades.map((g) => {
            const r = store.reviewed.includes(g);
            return (
              <button key={g} type="button" onClick={() => setGrade(g)} aria-current={g === grade ? 'true' : undefined}
              className={cn('flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-colors', g === grade ? 'bg-accent font-semibold text-accent-foreground' : 'hover:bg-muted')}>
                {r ? <Check className="size-4 text-success" aria-label="Reviewed" /> : <CircleDot className="size-4 text-subtle" aria-hidden />}
                Class {g}
                <span className="ml-auto text-[11px] text-muted-foreground tabular">{store.studentsInGrade(g).filter((s) => s.status === 'active').length}</span>
              </button>);

          })}
        </nav>

        <section className="min-w-0 rounded-lg border border-border bg-card" aria-label={`Class ${grade} decisions`}>
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-[14px] font-semibold">Class {grade} → {FINAL_GRADES.includes(grade) ? 'Graduation' : `Class ${grade + 1}`}</h2>
              <p className="text-[12px] text-muted-foreground">{rows.length} students · {rows.filter((s) => store.decisionFor(s).overridden).length} changed from suggestion</p>
            </div>
            {store.canDecide && (isReviewed ?
            <Button size="sm" variant="outline" onClick={() => store.toggleReviewed(grade)}>Re-open Class {grade}</Button> :
            <Button size="sm" onClick={markReviewed}><Check className="size-4" /> Mark Class {grade} reviewed</Button>)}
          </header>
          {!store.canDecide && <Notice kind="info" className="m-3">Only the principal or owner can change decisions. You’re viewing progress.</Notice>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead className="bg-muted/60 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2 font-medium">Student</th><th className="px-3 py-2 font-medium">Result</th><th className="px-3 py-2 text-right font-medium">Attendance</th><th className="px-3 py-2 text-right font-medium">Dues</th><th className="px-3 py-2 font-medium">Suggested</th><th className="px-3 py-2 font-medium">Decision</th><th className="px-3 py-2 font-medium">AY {store.nextYear} section</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => {
                  const r = store.results[s.id];
                  const sug = store.suggestions[s.id];
                  const d = store.decisionFor(s);
                  const dues = store.due(s.id);
                  const targets = store.targetsFor(s);
                  const options = (FINAL_GRADES.includes(grade) ? ['graduate', 'hold'] : ['promote', 'hold']) as PromotionOutcome[];
                  return (
                    <tr key={s.id} className={cn(d.overridden && 'bg-warning-bg/40')}>
                      <td className="px-3 py-2"><p className="font-medium">{s.name}</p><p className="text-[11px] text-muted-foreground">{sectionLabel(s.sectionId)} · Roll {s.roll}</p></td>
                      <td className="px-3 py-2">
                        {r.pct === null ? <span className="text-muted-foreground">No results</span> : <span className="tabular"><b>{r.grade}</b> · {r.pct}%</span>}
                        {r.failed.length > 0 && <p className="text-[11px] text-danger">Below {PASS_PCT}%: {r.failed.join(', ')}</p>}
                      </td>
                      <td className={cn('px-3 py-2 text-right tabular', s.attendancePct < MIN_ATTENDANCE && 'font-semibold text-danger')}>{s.attendancePct}%</td>
                      <td className="px-3 py-2 text-right tabular">{dues ? formatBDT(dues) : '—'}</td>
                      <td className="px-3 py-2"><StatusBadge status={sug.outcome} />{sug.reasons[0] && <p className="mt-0.5 max-w-[170px] text-[11px] text-muted-foreground">{sug.reasons.join(' · ')}</p>}</td>
                      <td className="px-3 py-2">
                        <SelectField size="sm" className="w-32" ariaLabel={`Decision for ${s.name}`} value={d.outcome} disabled={locked} onValueChange={(v) => choose(s.id, s.name, v as PromotionOutcome)} options={options.map((o) => ({ value: o, label: OUTCOME_LABEL[o] }))} />
                        {d.overridden && d.reason && <p className="mt-0.5 max-w-[150px] truncate text-[11px] text-warning" title={d.reason}>Reason: {d.reason}</p>}
                      </td>
                      <td className="px-3 py-2">
                        {d.outcome === 'promote' ?
                        targets.length ?
                        <SelectField size="sm" className="w-36" ariaLabel={`Next section for ${s.name}`} value={d.targetSectionId ?? ''} disabled={locked} onValueChange={(v) => store.setDecision(s.id, { outcome: 'promote', targetSectionId: v })}
                        options={targets.map((t) => ({ value: t.id, label: `${t.label}${t.stream ? ` · ${t.stream}` : ''}` }))} /> :
                        <span className="text-[12px] text-danger">No Class {grade + 1} section</span> :
                        d.outcome === 'hold' ? <span className="text-[12px] text-muted-foreground">Stays in {sectionLabel(s.sectionId)}</span> : <span className="text-[12px] text-muted-foreground">Leaves school</span>}
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
          {left.length > 0 && <p className="border-t border-border px-4 py-2 text-[11.5px] text-muted-foreground">{left.length} student{left.length > 1 ? 's' : ''} who left this year ({left.map((s) => s.name).join(', ')}) {left.length > 1 ? 'are' : 'is'} excluded.</p>}
        </section>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => store.setStep('prepare')}><ArrowLeft className="size-4" /> Back</Button>
        <Button disabled={done < total} onClick={() => store.setStep('preview')}>{done < total ? `Review ${total - done} more class${total - done > 1 ? 'es' : ''}` : 'Preview capacity'} <ArrowRight className="size-4" /></Button>
      </div>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={`${pending ? OUTCOME_LABEL[pending.outcome] : ''} ${pending?.name}?`}
        description="This changes the suggested outcome. The reason is saved on the student’s year history and the audit log."
        confirmLabel="Change decision"
        reasonLabel="Reason for override"
        onConfirm={(reason) => {if (pending) store.setDecision(pending.id, { outcome: pending.outcome, reason });}} />
      
    </div>);

}
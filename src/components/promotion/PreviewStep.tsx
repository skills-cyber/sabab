import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { Panel } from '../common/Panel';
import { Notice } from '../common/Notice';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/Button';
import { AddSectionDialog } from '../settings/AddSectionDialog';
import type { PromotionStore } from './usePromotion';
import { campuses } from '../../data/school';
import { sectionLabel } from '../../utils/timetable';
import { cn } from '../../utils/cn';

/** Next-year section loads: promoted in + held back + admissions intake against capacity. */
export function PreviewStep({ store }: {store: PromotionStore;}) {
  const [addOpen, setAddOpen] = useState(false);
  const blocked = store.overCapacity.length > 0 || store.missingTargets.length > 0;
  return (
    <div className="space-y-4">
      {store.missingTargets.length > 0 && <Notice kind="error">{store.missingTargets.length} promoted student{store.missingTargets.length > 1 ? 's have' : ' has'} no next-year section ({store.missingTargets.slice(0, 3).map((s) => s.name).join(', ')}). Add a section, then pick it in Review.</Notice>}
      {store.overCapacity.length > 0 && <Notice kind="warning">{store.overCapacity.map((r) => sectionLabel(r.sectionId)).join(', ')} {store.overCapacity.length > 1 ? 'are' : 'is'} over capacity. Move students to another section in Review, or add a section.</Notice>}
      <Panel
        title={`AY ${store.nextYear} sections`}
        description="Admissions intake counts offered and admitted applicants not yet enrolled."
        actions={store.canDecide ? <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add section</Button> : undefined}
        flush>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="bg-muted/60 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-2 font-medium">Section</th><th className="px-3 py-2 font-medium">Campus</th><th className="px-3 py-2 text-right font-medium">Promoted in</th><th className="px-3 py-2 text-right font-medium">Held back</th><th className="px-3 py-2 text-right font-medium">Intake</th><th className="px-3 py-2 text-right font-medium">Total / capacity</th><th className="px-3 py-2 font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {store.preview.map((r) => {
                const over = r.total > r.capacity;
                return (
                  <tr key={r.sectionId} className={cn(over && 'bg-danger-bg/40')}>
                    <td className="px-4 py-2 font-medium">{sectionLabel(r.sectionId)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{campuses.find((c) => c.id === r.campusId)?.short}</td>
                    <td className="px-3 py-2 text-right tabular">{r.promoted}</td>
                    <td className="px-3 py-2 text-right tabular">{r.held}</td>
                    <td className="px-3 py-2 text-right tabular">{r.intake}</td>
                    <td className={cn('px-3 py-2 text-right tabular', over && 'font-semibold text-danger')}>{r.total} / {r.capacity}</td>
                    <td className="px-3 py-2">{over ? <StatusBadge status="overdue" label={`${r.total - r.capacity} over`} /> : <StatusBadge status="on-track" label={`${r.capacity - r.total} seats left`} />}</td>
                  </tr>);

              })}
              {store.preview.length === 0 && <tr><td colSpan={7} className="px-4 py-4 text-center text-xs text-muted-foreground">No sections to preview.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => store.setStep('review')}><ArrowLeft className="size-4" /> Back to review</Button>
        <Button disabled={blocked} onClick={() => store.setStep('confirm')}>Continue to confirm <ArrowRight className="size-4" /></Button>
      </div>
      <AddSectionDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>);

}
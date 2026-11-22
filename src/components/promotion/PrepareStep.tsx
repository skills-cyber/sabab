import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Panel } from '../common/Panel';
import { Notice } from '../common/Notice';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import type { PromotionStore } from './usePromotion';
import { MIN_ATTENDANCE, PASS_PCT } from '../../utils/annualResult';

/** Pre-flight checklist: warns but never blocks. */
export function PrepareStep({ store }: {store: PromotionStore;}) {
  const open = store.checks.filter((c) => !c.ok).length;
  return (
    <div className="space-y-4">
      <Panel title={`Before rolling over to AY ${store.nextYear}`} description="These checks warn but don’t block — fix them where linked." flush>
        <ul className="divide-y divide-border">
          {store.checks.map((c) =>
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              {c.ok ? <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Done" /> : <AlertTriangle className="size-5 shrink-0 text-warning" aria-label="Needs attention" />}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{c.label}</p>
                <p className="text-[12px] text-muted-foreground">{c.detail}</p>
              </div>
              {c.toggle ?
            <label className="flex items-center gap-2 text-[12.5px]">
                  <Checkbox checked={store.attendanceFinal} disabled={!store.canDecide} onCheckedChange={(v) => store.setAttendanceFinal(v === true)} />
                  Mark final
                </label> :
            !c.ok &&
            <Link to={c.href} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline">Fix <ArrowRight className="size-3.5" /></Link>
            }
            </li>
          )}
        </ul>
      </Panel>
      <Notice kind="info">
        Suggestions use the published results: <b>Hold back</b> when 2 or more subjects are below {PASS_PCT}% or attendance is under {MIN_ATTENDANCE}%. Class 10 and 12 <b>Graduate</b>. The principal can change any suggestion with a reason.
      </Notice>
      <div className="flex justify-end">
        <Button onClick={() => store.setStep('review')}>{open ? `Continue with ${open} warning${open > 1 ? 's' : ''}` : 'Start reviewing classes'} <ArrowRight className="size-4" /></Button>
      </div>
    </div>);

}
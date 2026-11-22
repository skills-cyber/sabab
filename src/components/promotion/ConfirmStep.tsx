import React, { useState } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '../common/Panel';
import { Notice } from '../common/Notice';
import { Segmented } from '../common/Segmented';
import { Field } from '../common/Field';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { PromotionStore } from './usePromotion';
import type { RollOrder } from '../../types/promotion';

/** Typed confirmation, roll order, then the rollover itself. */
export function ConfirmStep({ store }: {store: PromotionStore;}) {
  const [typed, setTyped] = useState('');
  const phrase = `ROLLOVER ${store.nextYear}`;
  const ok = typed.trim().toUpperCase() === phrase && store.canDecide;

  const run = () => {
    const s = store.confirm();
    toast.success(`Welcome to AY ${s.toYear}`, { description: `${s.promoted} promoted · ${s.held} held back · ${s.graduated} graduated` });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
        { label: 'Promote', value: store.counts.promote, tone: 'text-success' },
        { label: 'Hold back', value: store.counts.hold, tone: 'text-warning' },
        { label: 'Graduate', value: store.counts.graduate, tone: 'text-primary' }].
        map((c) =>
        <div key={c.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-[12px] text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-semibold tabular ${c.tone}`}>{c.value}</p>
          </div>
        )}
      </div>
      <Panel title="Roll numbers" description="New rolls are assigned in every section that receives or keeps students.">
        <Segmented<RollOrder> ariaLabel="Roll order" value={store.rollOrder} onChange={store.setRollOrder} options={[{ value: 'merit', label: 'By merit (annual result)' }, { value: 'alpha', label: 'Alphabetical' }]} />
      </Panel>
      <Panel title={`Start AY ${store.nextYear}`}>
        <div className="space-y-3">
          <Notice kind="warning">
            This moves students, gives new rolls, marks graduates and archives AY {store.currentYear} as read-only history. Unpaid AY {store.currentYear} invoices stay open as <b>Previous year dues</b>. You can undo until the first AY {store.nextYear} invoice is generated.
          </Notice>
          <Field label={`Type ${phrase} to confirm`} htmlFor="ro-confirm">
            <Input id="ro-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={phrase} autoComplete="off" disabled={!store.canDecide} />
          </Field>
        </div>
      </Panel>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => store.setStep('preview')}><ArrowLeft className="size-4" /> Back</Button>
        <Button disabled={!ok} onClick={run}><RefreshCcw className="size-4" /> Roll over to AY {store.nextYear}</Button>
      </div>
    </div>);

}
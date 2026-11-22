import React, { useMemo, useState } from 'react';
import { Award, CalendarClock, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '../common/Panel';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { campuses } from '../../data/school';
import type { AdmissionsStore } from './useAdmissions';
import { docsComplete } from './useAdmissions';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Props {
  store: AdmissionsStore;
  campusId: string;
  canEdit: boolean;
  canDecide: boolean;
  onOpen: (id: string) => void;
}

/** Test slots → score entry → ranked merit list with one-click offer of top candidates within seats. */
export function TestsTab({ store, campusId, canEdit, canDecide, onOpen }: Props) {
  const slots = store.testSlots.filter((t) => campusId === 'all' || t.campusId === campusId).sort((a, b) => a.date.localeCompare(b.date));
  const [slotId, setSlotId] = useState(slots.find((s) => store.apps.some((a) => a.testSlotId === s.id && a.stage === 'test-scheduled'))?.id ?? slots[0]?.id);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [meritOpen, setMeritOpen] = useState(false);
  const slot = slots.find((s) => s.id === slotId);

  const candidates = useMemo(() => store.apps.filter((a) => a.testSlotId === slotId && a.stage !== 'withdrawn'), [store.apps, slotId]);
  const ranked = [...candidates].filter((a) => a.score != null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const left = slot ? store.seatsLeft(slot.grade, slot.campusId) : 0;
  const eligible = ranked.filter((a) => (a.stage === 'tested' || a.stage === 'waitlisted') && (a.score ?? 0) >= (slot?.passMark ?? 0) && docsComplete(a));
  const toOffer = eligible.slice(0, Math.max(0, left));

  const saveScores = () => {
    let n = 0;
    for (const [id, v] of Object.entries(draft)) {
      const s = Number(v);
      if (v === '' || !Number.isFinite(s) || s < 0 || s > 100) {toast.error('Scores must be 0–100');return;}
      store.recordScore(id, s);
      n++;
    }
    setDraft({});
    toast.success(`${n} score${n === 1 ? '' : 's'} saved`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Panel title="Test slots" description="Session 2027" flush>
        <ul className="divide-y divide-border">
          {slots.map((s) => {
            const n = store.apps.filter((a) => a.testSlotId === s.id && a.stage !== 'withdrawn').length;
            const past = s.date < '2026-11-02';
            return (
              <li key={s.id}>
                <button type="button" onClick={() => {setSlotId(s.id);setDraft({});}} aria-current={s.id === slotId} className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted', s.id === slotId && 'bg-accent hover:bg-accent')}>
                  <CalendarClock className={cn('size-4 shrink-0', past ? 'text-subtle' : 'text-primary')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">Class {s.grade} · {campuses.find((c) => c.id === s.campusId)?.short}</p>
                    <p className="text-[11.5px] text-muted-foreground">{formatDate(s.date, 'EEE d MMM')} · {s.time} · {s.room}</p>
                  </div>
                  <span className="text-[12px] tabular text-muted-foreground">{n}/{s.capacity}</span>
                </button>
              </li>);

          })}
        </ul>
      </Panel>

      {slot ?
      <Panel
        title={`${slot.id} · Class ${slot.grade} merit list`}
        description={`Pass mark ${slot.passMark} · ${left > 0 ? `${left} seat${left > 1 ? 's' : ''} left` : 'no seats left'}`}
        actions={
        <>
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
              {Object.keys(draft).length > 0 && <Button size="sm" onClick={saveScores}>Save {Object.keys(draft).length} score{Object.keys(draft).length > 1 ? 's' : ''}</Button>}
            </>
        }
        flush>
        
          {candidates.length === 0 ?
        <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">No candidates assigned to this slot yet. Assign from an application.</p> :

        <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr><th className="h-9 w-12 px-3 text-right font-medium">Rank</th><th className="px-3 text-left font-medium">Candidate</th><th className="px-3 text-center font-medium">Docs</th><th className="w-28 px-3 text-right font-medium">Score</th><th className="px-3 text-left font-medium">Stage</th></tr>
                </thead>
                <tbody>
                  {[...ranked, ...candidates.filter((a) => a.score == null)].map((a) => {
                const rank = ranked.indexOf(a);
                const editable = canEdit && (a.stage === 'test-scheduled' || a.stage === 'tested');
                const willOffer = toOffer.includes(a);
                return (
                  <tr key={a.id} className={cn('border-t border-border', willOffer && 'bg-success-bg/50')}>
                        <td className="px-3 py-2 text-right tabular text-muted-foreground">{rank >= 0 ? rank + 1 : '—'}</td>
                        <td className="px-3 py-2"><button type="button" className="text-left font-medium hover:text-primary hover:underline" onClick={() => onOpen(a.id)}>{a.applicant}</button><span className="block text-[11px] text-muted-foreground tabular">{a.id}</span></td>
                        <td className="px-3 py-2 text-center">{docsComplete(a) ? <span className="text-[12px] text-success">Complete</span> : <span className="text-[12px] text-warning">Pending</span>}</td>
                        <td className="px-3 py-1.5 text-right">
                          {editable ?
                      <Input aria-label={`Score for ${a.applicant}`} type="number" min={0} max={100} className={cn('ml-auto h-8 w-20 text-right tabular', draft[a.id] !== undefined && 'border-primary')} value={draft[a.id] ?? (a.score != null ? String(a.score) : '')} onChange={(e) => setDraft((d) => ({ ...d, [a.id]: e.target.value }))} placeholder="—" /> :

                      <span className={cn('tabular', a.score != null && a.score < slot.passMark && 'text-danger')}>{a.score ?? '—'}</span>
                      }
                        </td>
                        <td className="px-3 py-2"><StatusBadge status={a.stage} /></td>
                      </tr>);

              })}
                </tbody>
              </table>
            </div>
        }
          {ranked.length > 0 &&
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/40 px-4 py-2.5">
              <p className="text-[12.5px]"><Award className="mr-1 inline size-4 text-primary" /><b className="tabular">{toOffer.length}</b> eligible for offer within seats{eligible.length > toOffer.length && <span className="text-muted-foreground"> · {eligible.length - toOffer.length} will be waitlisted</span>}</p>
              <Button size="sm" disabled={!canDecide || eligible.length === 0} onClick={() => setMeritOpen(true)}>Publish merit list</Button>
            </div>
        }
          {!canDecide && ranked.length > 0 && <Notice kind="locked" className="m-3">Publishing the merit list needs the principal or owner.</Notice>}
        </Panel> :

      <Panel><p className="py-8 text-center text-[13px] text-muted-foreground">No test slots for this campus.</p></Panel>
      }

      <ConfirmDialog
        open={meritOpen}
        onOpenChange={setMeritOpen}
        title="Publish merit list?"
        description={`${toOffer.length} candidate(s) are offered seats and ${eligible.length - toOffer.length} are waitlisted in rank order. Guardians are notified by SMS.`}
        confirmLabel="Publish"
        onConfirm={() => {
          toOffer.forEach((a) => store.decide(a.id, 'offered', 'Merit list'));
          eligible.slice(toOffer.length).filter((a) => a.stage !== 'waitlisted').forEach((a) => store.decide(a.id, 'waitlisted', 'Merit list — seats full'));
          toast.success('Merit list published', { description: `${toOffer.length} offered · ${eligible.length - toOffer.length} waitlisted` });
          setMeritOpen(false);
        }} />
      
    </div>);

}
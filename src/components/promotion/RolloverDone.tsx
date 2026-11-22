import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, CheckCircle2, FileText, MessageSquare, Printer, Receipt, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '../common/Panel';
import { Notice } from '../common/Notice';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '../ui/Button';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import type { RolloverSummary } from '../../hooks/useYearRollover';
import { sectionLabel } from '../../utils/timetable';
import { formatBDT } from '../../utils/format';

/** After rollover: summary, one-click follow-ups and undo (until new-year billing). */
export function RolloverDone({ summary }: {summary: RolloverSummary;}) {
  const admin = useAdmin();
  const { role } = useApp();
  const navigate = useNavigate();
  const [undoOpen, setUndoOpen] = useState(false);
  const [duesOpen, setDuesOpen] = useState(false);
  const canAct = role === 'owner' || role === 'principal';
  const period = `Jan ${summary.toYear}`;

  const moved = useMemo(() => admin.students.filter((s) => summary.movedIds.includes(s.id)), [admin.students, summary.movedIds]);
  const continuing = moved.filter((s) => s.status === 'active');
  const familyIds = new Set(continuing.filter((s) => s.smsOptIn).map((s) => s.familyId ?? s.id));
  const optedIn = continuing.filter((s) => s.smsOptIn).length;
  const sectionIds = [...new Set(admin.students.filter((s) => s.status === 'active').map((s) => s.sectionId))];
  const toBill = admin.students.filter((s) => s.status === 'active' && !admin.invoices.some((i) => i.studentId === s.id && i.period === period));
  const arrears = admin.previousYearDueFor(toBill.map((s) => s.id));
  const billed = admin.invoices.some((i) => i.period === period);
  const bySection = continuing.reduce<Record<string, typeof continuing>>((m, s) => ({ ...m, [s.sectionId]: [...(m[s.sectionId] ?? []), s] }), {});

  const textGuardians = () => {
    admin.queueMessage({ channel: 'SMS', audience: `Promotion results · AY ${summary.toYear}`, recipients: familyIds.size, template: 'Promotion notice', body: `AY ${summary.toYear}: your child's new class and roll are now in the guardian portal.`, credits: familyIds.size });
    toast.success(`SMS queued to ${familyIds.size} families`, { description: `${optedIn - familyIds.size} duplicate texts avoided (siblings share one guardian)` });
  };

  return (
    <div className="space-y-4">
      <Notice kind="success">
        AY {summary.fromYear} closed by {summary.by} · {summary.at}. <b>{summary.promoted}</b> promoted, <b>{summary.held}</b> held back, <b>{summary.graduated}</b> graduated. AY {summary.fromYear} is now read-only history.
      </Notice>
      <Panel title="Next steps" flush>
        <ul className="divide-y divide-border">
          <li className="flex flex-wrap items-center gap-3 px-4 py-3"><MessageSquare className="size-5 text-primary" aria-hidden /><div className="flex-1"><p className="text-[13px] font-medium">Text guardians the new class and roll</p><p className="text-[12px] text-muted-foreground">{familyIds.size} families · once per family, not per child</p></div><Button size="sm" variant="outline" disabled={!canAct} onClick={textGuardians}>Send SMS</Button></li>
          <li className="flex flex-wrap items-center gap-3 px-4 py-3"><Receipt className="size-5 text-primary" aria-hidden /><div className="flex-1"><p className="text-[13px] font-medium">Generate {period} dues</p><p className="text-[12px] text-muted-foreground">{billed ? 'Generated · rollover can no longer be undone' : `${toBill.length} students · ${formatBDT(arrears)} previous-year dues shown as arrears brought forward`}</p></div><Button size="sm" variant="outline" disabled={!canAct && role !== 'accountant'} onClick={() => billed ? navigate('/fees/invoices') : setDuesOpen(true)}>{billed ? 'Open invoices' : 'Generate'}</Button></li>
          <li className="flex flex-wrap items-center gap-3 px-4 py-3"><CalendarRange className="size-5 text-primary" aria-hidden /><div className="flex-1"><p className="text-[13px] font-medium">Rebuild the routine</p><p className="text-[12px] text-muted-foreground">Class sizes and sections changed</p></div><Button size="sm" variant="outline" onClick={() => navigate('/timetable')}>Open routine</Button></li>
          <li className="flex flex-wrap items-center gap-3 px-4 py-3"><Printer className="size-5 text-primary" aria-hidden /><div className="flex-1"><p className="text-[13px] font-medium">Print promotion lists</p><p className="text-[12px] text-muted-foreground">One page per section with new rolls</p></div><Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button></li>
        </ul>
      </Panel>
      <Panel title={`AY ${summary.toYear} promotion lists`} description="New section and roll by merit or alphabetically" flush>
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(bySection).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([sid, list]) =>
          <div key={sid} className="bg-card p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"><FileText className="size-3.5 text-subtle" aria-hidden />{sectionLabel(sid)} <span className="font-normal text-muted-foreground">· {list.length}</span></p>
              <ol className="space-y-0.5 text-[12px]">{[...list].sort((a, b) => a.roll - b.roll).slice(0, 8).map((s) => <li key={s.id} className="flex gap-2"><span className="w-5 text-right tabular text-muted-foreground">{s.roll}</span>{s.name}{s.yearHistory?.at(-1)?.outcome === 'held-back' && <span className="text-warning">· repeat</span>}</li>)}</ol>
              {list.length > 8 && <p className="mt-1 text-[11px] text-muted-foreground">+{list.length - 8} more</p>}
            </div>
          )}
        </div>
      </Panel>
      {admin.canUndoRollover && canAct &&
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[12.5px] text-muted-foreground"><CheckCircle2 className="mr-1 inline size-4 text-success" aria-hidden />Undo is available until the first AY {summary.toYear} invoice is generated.</p>
          <Button size="sm" variant="outline" onClick={() => setUndoOpen(true)}><Undo2 className="size-4" /> Undo rollover</Button>
        </div>
      }
      <ConfirmDialog
        open={undoOpen}
        onOpenChange={setUndoOpen}
        title={`Undo rollover to AY ${summary.toYear}?`}
        description={`All ${summary.movedIds.length} students return to their AY ${summary.fromYear} class and roll. Your review decisions are kept.`}
        confirmLabel="Undo rollover"
        destructive
        onConfirm={() => {admin.undoRollover();toast.success(`Back to AY ${summary.fromYear}`);}} />
      
      <ConfirmDialog
        open={duesOpen}
        onOpenChange={setDuesOpen}
        title={`Generate ${period} dues?`}
        description={`${toBill.length} invoices. ${arrears ? `${formatBDT(arrears)} previous-year dues appear as “Arrears brought forward” but stay on the old invoices, so nothing is counted twice.` : 'No previous-year dues.'} Undo rollover will no longer be possible.`}
        confirmLabel="Generate dues"
        onConfirm={() => {const n = admin.generateInvoices(period, sectionIds);toast.success(`${n} invoices generated for ${period}`);}} />
      
    </div>);

}
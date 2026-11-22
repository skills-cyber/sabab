import React, { useState } from 'react';
import { Lock, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '../common/Panel';
import { StatusBadge } from '../common/StatusBadge';
import { Notice } from '../common/Notice';
import { Field } from '../common/Field';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useAcademic } from '../../contexts/AcademicContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import type { Assessment } from '../../types/academic';
import type { Student } from '../../types/school';
import { gradeFor, markStats } from '../../utils/grades';
import { sectionLabel } from '../../utils/timetable';
import { cn } from '../../utils/cn';

/** Permission-aware marks grid: editable only while marking; locked after verification; audited corrections after publish. */
export function MarksSheet({ assessment }: {assessment: Assessment;}) {
  const { marks, setMark, corrections, requestCorrection } = useAcademic();
  const { students } = useAdmin();
  const { role } = useApp();
  const [corr, setCorr] = useState<Student | null>(null);
  const [corrVal, setCorrVal] = useState('');
  const [corrReason, setCorrReason] = useState('');
  const [corrErr, setCorrErr] = useState<string | null>(null);

  const roster = students.filter((s) => assessment.sectionIds.includes(s.sectionId) && s.status === 'active').sort((a, b) => a.sectionId.localeCompare(b.sectionId) || a.roll - b.roll);
  const sheet = marks[assessment.id] ?? {};
  const editable = assessment.stage === 'marking' && (role === 'teacher' || role === 'principal' || role === 'coordinator');
  const stats = markStats(roster.map((s) => sheet[s.id]), assessment.totalMarks);
  const early = assessment.stage === 'draft' || assessment.stage === 'moderation' || assessment.stage === 'scheduled';

  const onChange = (sid: string, v: string) => {
    if (v === '') return setMark(assessment.id, sid, null);
    const n = Number(v);
    if (Number.isNaN(n)) return;
    setMark(assessment.id, sid, Math.max(0, Math.min(assessment.totalMarks, n)));
  };

  const submitCorrection = () => {
    const n = Number(corrVal);
    if (!corr) return;
    if (Number.isNaN(n) || n < 0 || n > assessment.totalMarks) return setCorrErr(`Enter 0–${assessment.totalMarks}`);
    if (corrReason.trim().length < 5) return setCorrErr('Reason required (min 5 characters).');
    requestCorrection({ assessmentId: assessment.id, studentId: corr.id, from: sheet[corr.id] ?? null, to: n, reason: corrReason.trim() });
    toast.success('Correction request sent', { description: 'Principal approval required. Original mark stays visible until approved.' });
    setCorr(null);
  };

  if (early) return <Panel title="Marks"><Notice kind="info">Mark entry opens after the assessment is held (stage: Marking).</Notice></Panel>;

  return (
    <Panel
      title="Marks sheet"
      description={`${stats.entered}/${roster.length} entered · avg ${stats.avg} · high ${stats.high} · pass ${stats.passRate}%`}
      actions={editable ? <StatusBadge status="marking" label="Editable" /> : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" /> Locked</span>}
      flush>
      
      {!editable && assessment.stage === 'verification' && <Notice kind="locked" className="m-3">Submitted for verification — marks are locked. The verifier can return the sheet for changes.</Notice>}
      {assessment.stage === 'published' && <Notice kind="locked" className="m-3">Published to guardians. Changes need an audited correction request.</Notice>}
      <div className="max-h-[520px] overflow-auto scrollbar-thin">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="h-9 px-3 font-medium">Roll</th>
              <th className="px-3 font-medium">Student</th>
              <th className="px-3 text-right font-medium">Marks /{assessment.totalMarks}</th>
              <th className="px-3 font-medium">Grade</th>
              <th className="w-12 px-2" />
            </tr>
          </thead>
          <tbody>
            {roster.map((s) => {
              const m = sheet[s.id];
              const pending = corrections.find((c) => c.assessmentId === assessment.id && c.studentId === s.id && c.status === 'pending');
              const g = typeof m === 'number' ? gradeFor(m, assessment.totalMarks) : null;
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-1.5 text-muted-foreground tabular">{assessment.sectionIds.length > 1 ? `${sectionLabel(s.sectionId)} · ` : ''}{s.roll}</td>
                  <td className="px-3 py-1.5 font-medium">{s.name}</td>
                  <td className="px-3 py-1.5 text-right">
                    {editable ?
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={assessment.totalMarks}
                      value={m ?? ''}
                      onChange={(e) => onChange(s.id, e.target.value)}
                      aria-label={`Marks for ${s.name}`}
                      className={cn('h-8 w-20 rounded-md border bg-card px-2 text-right tabular outline-none focus:border-primary focus:ring-2 focus:ring-primary/15', m == null ? 'border-warning/50' : 'border-border')} /> :


                    <span className="tabular">{m ?? <span className="text-subtle">—</span>}{pending && <span className="ml-1 text-[11px] text-warning">→ {pending.to}?</span>}</span>
                    }
                  </td>
                  <td className="px-3 py-1.5">{g ? <span className={cn('font-semibold', g.grade === 'F' ? 'text-danger' : g.grade.startsWith('A') ? 'text-success' : '')}>{g.grade}</span> : <span className="text-subtle">—</span>}</td>
                  <td className="px-2 py-1.5 text-right">
                    {assessment.stage === 'published' && !pending &&
                    <button type="button" aria-label={`Request correction for ${s.name}`} title="Request correction" onClick={() => {setCorr(s);setCorrVal(String(m ?? ''));setCorrReason('');setCorrErr(null);}} className="inline-flex size-7 items-center justify-center rounded-md text-subtle hover:bg-muted hover:text-foreground">
                        <PenLine className="size-3.5" />
                      </button>
                    }
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>
      <Dialog open={!!corr} onOpenChange={(o) => !o && setCorr(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request mark correction</DialogTitle>
            <DialogDescription>{corr?.name} · current {corr ? sheet[corr.id] ?? '—' : ''}/{assessment.totalMarks}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Corrected mark" required htmlFor="cr-val"><Input id="cr-val" type="number" value={corrVal} onChange={(e) => setCorrVal(e.target.value)} /></Field>
            <Field label="Reason" required error={corrErr} htmlFor="cr-reason"><Textarea id="cr-reason" rows={2} value={corrReason} onChange={(e) => setCorrReason(e.target.value)} placeholder="e.g. Re-totalling error on Q3" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorr(null)}>Cancel</Button>
            <Button onClick={submitCorrection}>Send for approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>);

}
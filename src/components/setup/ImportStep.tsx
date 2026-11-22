import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Download, FileSpreadsheet, Loader2, RotateCcw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Notice } from '../common/Notice';
import { StatusBadge } from '../common/StatusBadge';
import { Segmented } from '../common/Segmented';
import { sampleImportRows } from '../../data/setupTemplates';
import type { ImportIssue, ImportRow, SetupDraft } from '../../types/setup';
import { downloadCsv, isValidBdPhone } from '../../utils/format';
import { revealVariants } from '../../utils/motion';
import { cn } from '../../utils/cn';

interface Props {
  draft: SetupDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<Pick<SetupDraft, 'importRows' | 'importState' | 'importedCount'>>) => void;
}

const ISSUE: Record<ImportIssue, {label: string;status: string;hint: string;}> = {
  ok: { label: 'Ready', status: 'approved', hint: '' },
  'missing-phone': { label: 'Missing phone', status: 'rejected', hint: 'Guardian phone is required for OTP verification.' },
  'invalid-phone': { label: 'Invalid phone', status: 'rejected', hint: 'Use 11-digit Bangladesh mobile, e.g. 01711-000000.' },
  'duplicate-in-file': { label: 'Duplicate ID', status: 'rejected', hint: 'Student ID appears twice in this file.' },
  'existing-student': { label: 'Already exists', status: 'pending', hint: 'Matches an existing student — merge updates the record.' },
  'unknown-section': { label: 'Unknown section', status: 'pending', hint: 'Section not created in step 3.' }
};

type Filter = 'all' | 'issues' | 'ready';

/** Step 5 — Excel/CSV roster import with validation, per-row fixes, skip/merge decisions and partial success. */
export function ImportStep({ draft, errors, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const rows = draft.importRows;
  const validSections = new Set(draft.grades.filter((g) => g.enabled).flatMap((g) => g.sections.map((s) => `${g.grade}-${s}`)));

  const revalidate = (list: ImportRow[]): ImportRow[] => {
    const seen = new Map<string, number>();
    list.forEach((r) => seen.set(r.studentNo, (seen.get(r.studentNo) ?? 0) + 1));
    return list.map((r) => {
      let issue: ImportIssue = 'ok';
      if (r.issue === 'existing-student') issue = 'existing-student';else
      if (!r.phone.trim()) issue = 'missing-phone';else
      if (!isValidBdPhone(r.phone)) issue = 'invalid-phone';else
      if ((seen.get(r.studentNo) ?? 0) > 1 && list.findIndex((x) => x.studentNo === r.studentNo) !== list.indexOf(r)) issue = 'duplicate-in-file';else
      if (!validSections.has(r.section)) issue = 'unknown-section';
      const decision = issue === 'ok' ? 'import' : issue === 'existing-student' ? r.decision === 'skip' ? 'skip' : 'merge' : 'skip';
      return { ...r, issue, decision };
    });
  };

  const load = (source: string) => {
    setBusy(true);
    window.setTimeout(() => {
      const list = revalidate(sampleImportRows);
      onChange({ importRows: list, importState: 'validated', importedCount: 0 });
      setBusy(false);
      const bad = list.filter((r) => r.issue !== 'ok').length;
      toast.success(`${source} validated`, { description: `${list.length} rows · ${list.length - bad} ready · ${bad} need attention` });
    }, 700);
  };

  const fixPhone = (row: number, phone: string) => onChange({ importRows: revalidate(rows.map((r) => r.row === row ? { ...r, phone } : r)) });
  const setDecision = (row: number, decision: ImportRow['decision']) => onChange({ importRows: rows.map((r) => r.row === row ? { ...r, decision } : r) });

  const toImport = rows.filter((r) => r.decision !== 'skip');
  const blocked = rows.filter((r) => r.decision === 'skip').length;

  const runImport = () => {
    setBusy(true);
    window.setTimeout(() => {
      onChange({ importState: 'imported', importedCount: toImport.length });
      setBusy(false);
      toast.success(`${toImport.length} students imported`, { description: blocked ? `${blocked} rows skipped — download the error report to fix and re-import.` : 'All rows imported.' });
    }, 800);
  };

  const errorReport = () => downloadCsv('import-errors.csv', rows.filter((r) => r.issue !== 'ok').map((r) => ({ Row: r.row, StudentID: r.studentNo, Name: r.name, Section: r.section, Phone: r.phone, Issue: ISSUE[r.issue].label, Fix: ISSUE[r.issue].hint })));
  const template = () => downloadCsv('sabab-student-template.csv', [{ StudentID: '2027-0601', Name: 'Student name', Section: '6-A', DOB: '2014-01-31', Guardian: 'Guardian name', Phone: '01711-000000' }]);

  const shown = rows.filter((r) => filter === 'all' || (filter === 'ready' ? r.issue === 'ok' : r.issue !== 'ok'));

  if (draft.importState === 'imported') {
    return (
      <motion.div variants={revealVariants} initial="hidden" animate="show" className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success-bg p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <div className="text-[13px]">
            <p className="font-semibold text-foreground">{draft.importedCount} students imported{rows.length ? ` · ${rows.length - draft.importedCount} skipped` : ''}</p>
            <p className="text-muted-foreground">{rows.length ? 'Guardians receive an OTP invite after activation. Skipped rows are in the error report.' : 'You skipped the import — add students later from Students › New student or re-run import.'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {rows.some((r) => r.issue !== 'ok') && <Button size="sm" variant="outline" onClick={errorReport}><Download className="size-4" /> Error report</Button>}
          <Button size="sm" variant="ghost" onClick={() => onChange({ importRows: [], importState: 'idle', importedCount: 0 })}><RotateCcw className="size-4" /> Start over</Button>
        </div>
      </motion.div>);

  }

  return (
    <div className="space-y-3">
      {errors.import && <Notice kind="warning">{errors.import}</Notice>}
      <AnimatePresence mode="wait" initial={false}>
        {draft.importState === 'idle' ?
        <motion.div key="drop" variants={revealVariants} initial="hidden" animate="show" exit="exit" className="grid place-items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">{busy ? <Loader2 className="size-5 animate-spin" /> : <FileSpreadsheet className="size-5" />}</span>
            <div>
              <p className="text-[13px] font-medium">{busy ? 'Validating roster…' : 'Upload student roster (.xlsx or .csv)'}</p>
              <p className="text-[11.5px] text-muted-foreground">Columns: Student ID, Name, Section (e.g. 6-A), DOB, Guardian, Phone</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => e.target.files?.[0] && load(e.target.files[0].name)} />
              <Button size="sm" disabled={busy} onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Choose file</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => load('Sample roster')}>Use sample file</Button>
              <Button size="sm" variant="ghost" onClick={template}><Download className="size-4" /> Template</Button>
            </div>
            <button type="button" className="text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline" onClick={() => onChange({ importState: 'imported', importedCount: 0 })}>Skip for now</button>
            <p className="text-[10.5px] text-subtle">Prototype: any chosen file loads the sample rows — parsing runs server-side in production.</p>
          </motion.div> :

        <motion.div key="table" variants={revealVariants} initial="hidden" animate="show" exit="exit" className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Segmented
              ariaLabel="Rows"
              value={filter}
              onChange={setFilter}
              options={[
              { value: 'all', label: 'All', count: rows.length },
              { value: 'issues', label: 'Needs attention', count: rows.filter((r) => r.issue !== 'ok').length },
              { value: 'ready', label: 'Ready', count: rows.filter((r) => r.issue === 'ok').length }]
              } />
            
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={errorReport}><Download className="size-4" /> Error report</Button>
                <Button size="sm" variant="ghost" onClick={() => onChange({ importRows: [], importState: 'idle' })}><RotateCcw className="size-4" /> Replace file</Button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border scrollbar-thin">
              <table className="w-full min-w-[760px] text-[13px]">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr><th className="h-9 w-12 px-3 text-right font-medium">Row</th><th className="px-3 text-left font-medium">Student</th><th className="px-3 text-left font-medium">Section</th><th className="px-3 text-left font-medium">Guardian phone</th><th className="px-3 text-left font-medium">Status</th><th className="px-3 text-left font-medium">Action</th></tr>
                </thead>
                <tbody>
                  {shown.map((r) => {
                  const meta = ISSUE[r.issue];
                  const phoneIssue = r.issue === 'missing-phone' || r.issue === 'invalid-phone';
                  return (
                    <tr key={r.row} className={cn('border-t border-border align-top', r.decision === 'skip' && 'bg-muted/40')}>
                        <td className="px-3 py-2 text-right tabular text-muted-foreground">{r.row}</td>
                        <td className="px-3 py-2"><span className="font-medium">{r.name}</span><span className="block text-[11px] text-muted-foreground tabular">{r.studentNo} · {r.guardian}</span></td>
                        <td className="px-3 py-2 tabular">{r.section}</td>
                        <td className="px-3 py-2">
                          {phoneIssue ?
                        <Input aria-label={`Fix phone for row ${r.row}`} defaultValue={r.phone} placeholder="01711-000000" className="h-8 w-36 border-danger/50 tabular" onBlur={(e) => e.target.value !== r.phone && fixPhone(r.row, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} /> :

                        <span className="tabular">{r.phone}</span>
                        }
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={meta.status} label={meta.label} />
                          {meta.hint && <p className="mt-0.5 max-w-[220px] text-[11px] text-muted-foreground">{meta.hint}</p>}
                        </td>
                        <td className="px-3 py-2">
                          {r.issue === 'ok' ?
                        <span className="text-[12px] text-success">Will import</span> :
                        r.issue === 'existing-student' ?
                        <Segmented size="sm" ariaLabel={`Row ${r.row} action`} value={r.decision === 'skip' ? 'skip' : 'merge'} onChange={(v) => setDecision(r.row, v)} options={[{ value: 'merge', label: 'Merge' }, { value: 'skip', label: 'Skip' }]} /> :

                        <span className="text-[12px] text-muted-foreground">Skipped until fixed</span>
                        }
                        </td>
                      </tr>);

                })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <p className="text-[12.5px]"><b className="tabular">{toImport.length}</b> will import · <b className="tabular">{blocked}</b> skipped <span className="text-muted-foreground">(partial import is allowed — fix and re-import later)</span></p>
              <Button size="sm" disabled={busy || toImport.length === 0} onClick={runImport}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Import {toImport.length} students</Button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
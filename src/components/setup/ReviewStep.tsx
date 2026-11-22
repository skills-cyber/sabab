import React from 'react';
import { CheckCircle2, CircleAlert, PencilLine } from 'lucide-react';
import { Button } from '../ui/Button';
import type { SetupDraft, SetupStepId } from '../../types/setup';
import { SETUP_STEPS } from './useSetupWizard';
import { formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

interface Props {
  draft: SetupDraft;
  completed: SetupStepId[];
  onEdit: (id: SetupStepId) => void;
}

/** Step 6 — checklist summary of every step with jump-to-edit before activation. */
export function ReviewStep({ draft, completed, onEdit }: Props) {
  const enabled = draft.grades.filter((g) => g.enabled);
  const sections = enabled.reduce((s, g) => s + g.sections.length, 0);
  const teachersAssigned = Object.keys(draft.classTeachers).length;
  const summary: Record<Exclude<SetupStepId, 'review'>, string[]> = {
    institution: [draft.institution.name, `EIIN ${draft.institution.eiin || '—'} · ${draft.institution.board}`, draft.institution.email],
    campuses: [draft.campuses.map((c) => c.short || c.name).join(' · '), `AY ${draft.year.label}: ${formatDate(draft.year.start, 'd MMM')} – ${formatDate(draft.year.end, 'd MMM yyyy')}`, `${draft.year.terms.length} terms · weekly holiday ${draft.year.weekend}`],
    classes: [`${enabled.length} classes · ${sections} sections`, `${teachersAssigned}/${sections} class teachers assigned`],
    subjects: [`${draft.subjects.filter((s) => s.enabled).length} subjects`, `${draft.fees.filter((f) => f.enabled).length} fee heads · tuition ${formatBDT(draft.fees.find((f) => f.id === 'TUI')?.amount ?? 0)}/mo`],
    import: [draft.importState === 'imported' ? `${draft.importedCount} students imported` : 'Not imported yet']
  };

  return (
    <ul className="grid gap-2.5 md:grid-cols-2">
      {SETUP_STEPS.filter((s) => s.id !== 'review').map((s, i) => {
        const ok = completed.includes(s.id);
        const warn = s.id === 'classes' && ok && teachersAssigned < sections;
        return (
          <li key={s.id} className={cn('flex items-start gap-3 rounded-lg border p-3', ok ? 'border-border' : 'border-danger/40 bg-danger-bg/40')}>
            {ok ? <CheckCircle2 className={cn('mt-0.5 size-4 shrink-0', warn ? 'text-warning' : 'text-success')} /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" />}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">{i + 1}. {s.label}</p>
              {summary[s.id as Exclude<SetupStepId, 'review'>].map((line) => <p key={line} className="truncate text-[12px] text-muted-foreground">{line}</p>)}
              {warn && <p className="text-[11.5px] text-warning">Some sections have no class teacher — you can assign them later.</p>}
              {!ok && <p className="text-[11.5px] text-danger">Incomplete — required before activation.</p>}
            </div>
            <Button size="xs" variant="ghost" onClick={() => onEdit(s.id)}><PencilLine className="size-3.5" /> Edit</Button>
          </li>);

      })}
    </ul>);

}
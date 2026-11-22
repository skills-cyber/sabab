import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Switch } from '../ui/Switch';
import { SelectField } from '../common/SelectField';
import { teachers } from '../../data/school';
import type { SetupDraft, SetupGrade } from '../../types/setup';
import { cn } from '../../utils/cn';

interface Props {
  draft: SetupDraft;
  errors: Record<string, string>;
  onGrades: (v: SetupGrade[]) => void;
  onTeachers: (v: Record<string, string>) => void;
}

const NEXT_SECTION = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Step 3 — enable grades, set sections per grade, campus placement and class teachers. */
export function ClassesStep({ draft, errors, onGrades, onTeachers }: Props) {
  const { grades, campuses, classTeachers } = draft;
  const setGrade = (g: number, patch: Partial<SetupGrade>) => onGrades(grades.map((x) => x.grade === g ? { ...x, ...patch } : x));
  const enabled = grades.filter((g) => g.enabled);
  const sectionCount = enabled.reduce((s, g) => s + g.sections.length, 0);
  const assigned = enabled.flatMap((g) => g.sections.map((s) => `${g.grade}-${s}`)).filter((k) => classTeachers[k]).length;
  const teacherOpts = [{ value: 'none', label: 'Assign later' }, ...teachers.map((t) => ({ value: t.id, label: t.name }))];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
        <span><b className="font-semibold text-foreground tabular">{enabled.length}</b> classes</span>
        <span><b className="font-semibold text-foreground tabular">{sectionCount}</b> sections</span>
        <span><b className="font-semibold text-foreground tabular">{assigned}</b> class teachers assigned</span>
        {errors.grades && <span className="text-danger">{errors.grades}</span>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border scrollbar-thin">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="h-9 w-12 px-3 text-left font-medium">On</th>
              <th className="px-3 text-left font-medium">Class</th>
              <th className="px-3 text-left font-medium">Campus</th>
              <th className="px-3 text-left font-medium">Sections</th>
              <th className="px-3 text-left font-medium">Class teachers</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) =>
            <tr key={g.grade} className={cn('border-t border-border align-top transition-opacity', !g.enabled && 'opacity-55')}>
                <td className="px-3 py-2.5"><Switch checked={g.enabled} onCheckedChange={(v) => setGrade(g.grade, { enabled: v })} aria-label={`Enable ${g.label}`} /></td>
                <td className="px-3 py-2.5 font-medium">
                  {g.label}
                  {errors[`grade-${g.grade}`] && <p className="text-[11px] font-normal text-danger">{errors[`grade-${g.grade}`]}</p>}
                </td>
                <td className="w-40 px-3 py-2">
                  <SelectField size="sm" ariaLabel={`${g.label} campus`} disabled={!g.enabled} value={g.campusId} onValueChange={(v) => setGrade(g.grade, { campusId: v })} options={campuses.map((c) => ({ value: c.id, label: c.short || c.name }))} />
                </td>
                <td className="px-3 py-2">
                  <div className="inline-flex h-8 items-center rounded-md border border-border">
                    <button type="button" aria-label={`Remove section from ${g.label}`} disabled={!g.enabled || g.sections.length <= 1} onClick={() => setGrade(g.grade, { sections: g.sections.slice(0, -1) })} className="grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-14 border-x border-border px-2 text-center text-[12.5px] tabular">{g.sections.join(' · ')}</span>
                    <button type="button" aria-label={`Add section to ${g.label}`} disabled={!g.enabled || g.sections.length >= NEXT_SECTION.length} onClick={() => setGrade(g.grade, { sections: [...g.sections, NEXT_SECTION.find((s) => !g.sections.includes(s)) ?? 'X'] })} className="grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {g.sections.map((s) => {
                    const key = `${g.grade}-${s}`;
                    return (
                      <div key={key} className="flex items-center gap-1.5">
                          <span className="w-6 shrink-0 text-[11.5px] font-semibold text-muted-foreground">{s}</span>
                          <SelectField size="sm" ariaLabel={`Class teacher ${g.grade}-${s}`} disabled={!g.enabled} value={classTeachers[key] ?? 'none'} onValueChange={(v) => {const n = { ...classTeachers };if (v === 'none') delete n[key];else n[key] = v;onTeachers(n);}} options={teacherOpts} />
                        </div>);

                  })}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11.5px] text-muted-foreground">Class names and grading stay configurable per board and year. Subject teachers are assigned in Routine &amp; Timetable.</p>
    </div>);

}
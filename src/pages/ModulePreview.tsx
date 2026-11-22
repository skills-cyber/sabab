import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Hammer } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { Notice } from '../components/common/Notice';
import { navGroups } from '../data/navigation';

/** Blueprint per module so shells communicate scope instead of faking functionality. */
const BLUEPRINT: Record<string, {scope: string[];related?: {label: string;to: string;};}> = {
  lms: { scope: ['Assignments with attachments and due dates', 'Student submissions, late flags and feedback', 'Auto-graded MCQ quizzes from the question bank', 'Learning materials per syllabus topic'], related: { label: 'Homework is already captured from My Teaching Day', to: '/teaching' } },
  accounts: { scope: ['Daybook with income/expense categories', 'Cash & bank registers, transfers', 'Fee ledger posting from receipts (immutable)', 'Monthly reconciliation and exports'], related: { label: 'Fee daily close is live', to: '/fees/close' } },
  reports: { scope: ['Academic coverage by class/subject/teacher', 'Attendance trends and chronic absence', 'Fee collection vs dues by month', 'Campus comparison and printable A4 reports'], related: { label: 'Coverage matrix in the Planner', to: '/planner/syllabus' } },
  onboarding: { scope: ['Institution → campuses → academic year', 'Grades, sections, subject and fee templates', 'Excel roster import with duplicate & error mapping', 'Guardian mapping and resumable drafts'] },
  settings: { scope: ['School profile, campuses and academic years', 'Grading rules per board and year', 'Approval workflows (plans, makeups, papers, results)', 'Roles & permissions, language and notification settings'] },
  admissions: { scope: ['Online enquiry and application', 'Admission test and merit list', 'Document verification and acceptance'] },
  library: { scope: ['Catalogue, issue/return, fines'] },
  transport: { scope: ['Routes, stops, vehicles, rider list, transport fee link'] },
  hostel: { scope: ['Rooms, allocation, meal and attendance'] },
  payroll: { scope: ['Salary structure, attendance-linked payroll, payslips'] },
  inventory: { scope: ['Stock items, requisitions, issue and audit'] }
};

export function ModulePreview({ moduleId }: {moduleId?: string;}) {
  const params = useParams();
  const id = moduleId ?? params.moduleId ?? '';
  const item = navGroups.flatMap((g) => g.items).find((i) => i.id === id);
  const planned = item?.phase === 'planned';
  const bp = BLUEPRINT[id];

  return (
    <div className="space-y-4">
      <PageHeader
        title={item?.label ?? 'Module'}
        bn={item?.bn}
        description={planned ? 'Phase 2 module — architecture reserved, not built.' : 'Designed and scoped — next build step.'}
        meta={<StatusBadge status={planned ? 'planned' : 'draft'} label={planned ? 'Planned · Phase 2' : 'Designed · not interactive'} />} />
      
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Planned scope">
          {bp ?
          <ul className="space-y-2 text-[13px]">
              {bp.scope.map((s) => <li key={s} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-subtle" />{s}</li>)}
            </ul> :
          <p className="text-[13px] text-muted-foreground">Scope to be defined.</p>}
          {bp?.related && <Link to={bp.related.to} className="mt-4 inline-block text-xs font-medium text-primary hover:underline">{bp.related.label} →</Link>}
        </Panel>
        <Panel>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-subtle"><Hammer className="size-4" /></span>
            <p className="text-[13px] text-muted-foreground">Will reuse the same DataTable, inline editing, ⋯ actions, approval dialog and status tokens as the live modules — no new visual language.</p>
          </div>
        </Panel>
      </div>
      <Notice kind="preview">No data, backend or integration exists for this module in the prototype.</Notice>
    </div>);

}
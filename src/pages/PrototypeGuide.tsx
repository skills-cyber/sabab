import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Server } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { useApp } from '../contexts/AppContext';
import { navForRole } from '../data/navigation';
import { roles } from '../data/school';
import type { RoleId } from '../types/school';

const IMPLEMENTED = [
'Year-end promotion: readiness checklist, class-by-class review with result/attendance suggestions and reasoned overrides, capacity preview, typed-confirmation rollover with merit rolls, undo until new-year billing, previous-year dues carried as arrears',
'Families: one guardian record per household (grouped by phone), link/unlink/merge children, simulated OTP verification, portal access, combined printable family statement, one SMS per family',
'Transport: live trip board (depart/delay/cancel + guardian SMS, boarding check), routes & stops, riders with capacity check, fleet compliance & maintenance',
'Admissions: enquiries → application → documents → test → merit list → offer → fee → student record; seat plan',
'School Setup: 6-step resumable wizard, validation, roster import with fix/merge/skip, activation',
'Role-aware shell: 8 roles, campus/year context, search (Ctrl+K), notifications, quick actions, Bangla menu, offline toggle',
'Principal overview with a working approval queue (plans, makeups, papers, results, corrections, leave)',
'Teacher day: bulk attendance, lesson outcome, diary, homework, absentee SMS, offline draft & sync state',
'Academic Planner: year calendar, coverage matrix with inline targets, weekly plan, versioned approval',
'Timetable: class/teacher/room views, live clash detection, slot editor, substitutes, suggested fix',
'Cancelled & makeup lifecycle with clash-checked proposals and syllabus gap resolution',
'Exams: syllabus-scoped paper builder, question bank, moderation → publish, locked marks & audited corrections',
'Students, Attendance, Staff, Communication with filters, inline edits, ⋯ actions, bulk SMS, CSV export',
'Fees: collection (cash/bank/MFS), bilingual receipt, reversal, concessions, dues generation, daily close',
'Parent portal: multi-child, published results only, homework, attendance calendar, fees & receipts',
'Homework & LMS: assignments, submission tracking (submitted/late/missing), feedback, reminders, learning materials',
'Accounts & Finance: add/edit/archive cash, bank and bKash/Nagad accounts; transfers with fees; income & expense with parties and categories; budgets; approval limit (Settings); returns & reversals; manual reconciliation; account statements; CSV export',
'Reports: teaching coverage, attendance, fees & dues, assessment performance — print and CSV',
'Settings: school profile, sections, grading scale, approval workflows, role-permission matrix with SoD guardrails',
'Universal ⋯ action menu: viewport-aware, never clipped by tables, keyboard navigable',
'SaaS Control Center: tenants, plan change with over-limit handling, feature gates, SMS credits, audit, support'];

const DESIGNED = ['Roster file parsing (setup import uses sample rows)', 'Report-card PDF generation', 'Student self-service submission uploads', 'Online public admission form & payment gateway', 'Live bus GPS map & driver app', 'Direct bank/bKash API disbursement (salary file is downloaded for manual upload)', 'Fixed-asset register (balance sheet covers cash, dues and payables only)', 'One family payment split across several children (collect per child for now)', 'Phase 2: library, hostel, inventory'];
const BACKEND = ['Persistence, auth, OTP and tenant isolation', 'SMS/WhatsApp providers and delivery callbacks', 'bKash, Nagad, SSLCOMMERZ payments', 'Offline sync replay & conflict resolution', 'Timetable auto-scheduling solver', 'PDF generation for papers, receipts and report cards'];
const ASSUMPTIONS = [
'All school, student and guardian data is fictional sample data for one two-campus Dhaka school.',
'School week is Sun–Thu; Friday/Saturday weekends and holidays are configurable per year.',
'Grading scale (A+ … F, GP 5.0) is a sample and is configured per board and year.',
'Topic-level tracking is seeded for Mathematics; other subjects show period-level coverage.',
'Teacher persona is Farhana Rahman; guardian persona is Shahidul Islam (family FAM record, 2 linked children).',
'Promotion suggests Hold back for 2+ subjects below 33% or attendance under 75%; Class 10 and 12 graduate. Only published assessments count toward the annual result.',
'All changes live in memory and reset on reload — no backend is connected.',
'HisabIQ_UI tokens (teal primary, neutral greys, Geist, 36px controls, rounded-md) form the base design system.'];


export function PrototypeGuide() {
  const { setRole } = useApp();

  return (
    <div className="space-y-4">
      <PageHeader title="Prototype guide" bn="নির্দেশিকা" description="Sitemap by role, scope boundaries, design foundation and assumptions" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Implemented in prototype" actions={<CheckCircle2 className="size-4 text-success" />}>
          <ul className="space-y-1.5 text-[12.5px]">{IMPLEMENTED.map((i) => <li key={i} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />{i}</li>)}</ul>
        </Panel>
        <Panel title="Designed, not interactive" actions={<CircleDashed className="size-4 text-warning" />}>
          <ul className="space-y-1.5 text-[12.5px]">{DESIGNED.map((i) => <li key={i} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />{i}</li>)}</ul>
        </Panel>
        <Panel title="Requires backend" actions={<Server className="size-4 text-info" />}>
          <ul className="space-y-1.5 text-[12.5px]">{BACKEND.map((i) => <li key={i} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-info" />{i}</li>)}</ul>
        </Panel>
      </div>

      <Panel title="Sitemap by role" description="Each role gets its own home page and menu. Tap “Switch” to try it." flush>
        <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {roles.map((r) =>
          <div key={r.id} className="space-y-2 border-border p-4 xl:[&:nth-child(n+5)]:border-t">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold">{r.label}</p>
                <Link to={r.home} onClick={() => setRole(r.id as RoleId)} className="inline-flex h-7 items-center rounded-md border border-border px-2 text-xs font-medium hover:border-primary/40 hover:text-primary">
                  Switch
                </Link>
              </div>
              <p className="text-[11px] text-muted-foreground">{r.user} · home {r.home}</p>
              <ul className="space-y-0.5 text-[12px]">
                {navForRole(r.id).flatMap((g) => g.items).filter((i) => i.id !== 'guide').map((i) =>
              <li key={i.id} className="flex items-center gap-1.5"><i.icon className="size-3.5 text-subtle" />{i.label}{i.phase && <span className="text-[10.5px] text-subtle">({i.phase})</span>}</li>
              )}
              </ul>
            </div>
          )}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Design foundation">
          <div className="space-y-3 text-[12.5px]">
            <div className="flex flex-wrap gap-2">
              {['bg-primary', 'bg-accent', 'bg-muted', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info'].map((c) =>
              <span key={c} className="flex items-center gap-1.5"><span className={`size-5 rounded-md border border-border ${c}`} />{c.replace('bg-', '')}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">{['draft', 'submitted', 'approved', 'published', 'returned', 'needs-review', 'pending-sync', 'gap-open', 'overdue', 'cancelled', 'on-track', 'behind'].map((k) => <StatusBadge key={k} status={k} />)}</div>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              <li>Reusable: DataTable (search, sort, columns, density, bulk, inline edit with locked cells), RowActions ⋯, Panel, KpiStrip, UnderlineTabs, Segmented, Field, SelectField, Notice, StatusBadge, Stepper, ApprovalDialog, ApprovalTimeline, ConfirmDialog (with audited reason), Sheet previews.</li>
              <li>Controls are 36px with rounded-md; panels rounded-xl with a single hairline border; text 12–14px.</li>
              <li>Status always pairs colour with a text label; Bangla helper labels use Hind Siliguri.</li>
            </ul>
          </div>
        </Panel>
        <Panel title="Assumptions & limitations">
          <ol className="list-decimal space-y-1.5 pl-4 text-[12.5px]">{ASSUMPTIONS.map((a) => <li key={a}>{a}</li>)}</ol>
          <p className="mt-3 text-[11.5px] text-muted-foreground">Suggested next screens: LMS submissions, report-card builder, guardian OTP onboarding, RBAC settings, finance ledger.</p>
        </Panel>
      </div>
    </div>);

}
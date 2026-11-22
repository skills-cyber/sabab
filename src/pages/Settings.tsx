import React, { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Lock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { Panel } from '../components/common/Panel';
import { DataTable, type Column } from '../components/common/DataTable/DataTable';
import { Notice } from '../components/common/Notice';
import { Field } from '../components/common/Field';
import { SelectField } from '../components/common/SelectField';
import { Switch } from '../components/ui/Switch';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAdmin } from '../contexts/AdminContext';
import { useApp } from '../contexts/AppContext';
import { useAccounts } from '../contexts/AccountsContext';
import { formatBDT } from '../utils/format';
import { campuses, roles, school } from '../data/school';
import { gradeScale } from '../utils/grades';
import { cn } from '../utils/cn';
import { ClassesTab } from '../components/settings/ClassesTab';
import { SubjectsTab } from '../components/settings/SubjectsTab';

const TABS = ['school', 'classes', 'subjects', 'grading', 'workflows', 'roles'];

interface GradeRow {id: string;min: number;grade: string;gp: number;}
interface Workflow {id: string;label: string;detail: string;approver: string;enabled: boolean;locked?: boolean;}

const PERMS = ['View students', 'Edit students', 'Take attendance', 'Enter marks', 'Publish results', 'Collect fees', 'Reverse receipts', 'Approve plans', 'Send SMS', 'Manage settings'];
const MATRIX: Record<string, string[]> = {
  owner: ['View students', 'Approve plans', 'Publish results', 'Manage settings', 'Reverse receipts'],
  principal: ['View students', 'Edit students', 'Take attendance', 'Publish results', 'Approve plans', 'Send SMS', 'Manage settings', 'Reverse receipts'],
  coordinator: ['View students', 'Take attendance', 'Enter marks', 'Send SMS'],
  teacher: ['View students', 'Take attendance', 'Enter marks', 'Send SMS'],
  accountant: ['View students', 'Collect fees', 'Reverse receipts', 'Send SMS'],
  office: ['View students', 'Edit students', 'Take attendance', 'Send SMS']
};
/** Guardrails: these combinations can never be granted (segregation of duties). */
const FORBIDDEN: Record<string, string[]> = { teacher: ['Publish results', 'Reverse receipts', 'Manage settings'], accountant: ['Enter marks', 'Publish results'], office: ['Collect fees', 'Publish results'] };

export function Settings() {
  const { tab } = useParams();
  const fin = useAccounts();
  const { addAudit } = useAdmin();
  const { role } = useApp();
  const canEdit = role === 'owner' || role === 'principal';
  const [profile, setProfile] = useState({ name: school.name, bn: school.bn, eiin: school.eiin, address: school.address, phone: '02-9001234', email: 'office@shapla.sample', weekend: 'Fri-Sat', language: 'en', bnDigits: false });
  const [dirty, setDirty] = useState(false);
  const [grades, setGrades] = useState<GradeRow[]>(gradeScale.map((g) => ({ id: g.grade, ...g })));
  const [workflows, setWorkflows] = useState<Workflow[]>([
  { id: 'plan', label: 'Academic plan revisions', detail: 'Coordinator submits → principal approves → locked version', approver: 'Principal', enabled: true, locked: true },
  { id: 'makeup', label: 'Makeup classes', detail: 'Teacher proposes slot → clash check → approval', approver: 'Coordinator', enabled: true },
  { id: 'paper', label: 'Question paper moderation', detail: 'Author → moderator → exam controller', approver: 'Exam controller', enabled: true },
  { id: 'result', label: 'Result publication', detail: 'Marks verified by a second teacher before publish', approver: 'Principal', enabled: true, locked: true },
  { id: 'correction', label: 'Post-publication mark corrections', detail: 'Reason + approval + guardian notified', approver: 'Principal', enabled: true, locked: true },
  { id: 'expense', label: 'Expenses ≥ ৳5,000', detail: 'Accountant posts → governing body approves', approver: 'Owner', enabled: true },
  { id: 'concession', label: 'Fee concessions & waivers', detail: 'Concessions above ৳2,000/month need principal approval', approver: 'Principal', enabled: true, locked: true },
  { id: 'leave', label: 'Staff leave', detail: 'Leave request → principal approval → substitute assignment', approver: 'Principal', enabled: true, locked: true },
  { id: 'payroll', label: 'Monthly salary sheets', detail: 'Accountant prepares → owner/principal approves → paid from Accounts', approver: 'Owner / Principal', enabled: true, locked: true }]
  );
  const [matrix, setMatrix] = useState(MATRIX);

  if (!TABS.includes(tab ?? '')) return <Navigate to="/settings/school" replace />;

  const setP = <K extends keyof typeof profile,>(k: K, v: (typeof profile)[K]) => {setProfile((p) => ({ ...p, [k]: v }));setDirty(true);};

  const gradeCols: Column<GradeRow>[] = [
  { id: 'grade', header: 'Letter grade', cell: (g) => <b>{g.grade}</b> },
  { id: 'min', header: 'Minimum %', align: 'right', cell: (g) => <span className="tabular">{g.min}%</span>, edit: { value: (g) => String(g.min), type: 'number', lockedReason: (g) => !canEdit ? 'Only the principal can change grading.' : g.min === 0 ? 'Lowest band always starts at 0%.' : null, onSave: (g, v) => {const n = Number(v);if (!Number.isInteger(n) || n < 1 || n > 99) return '1–99';setGrades((l) => l.map((x) => x.id === g.id ? { ...x, min: n } : x).sort((a, b) => b.min - a.min));addAudit('Settings', 'Grade threshold changed', `${g.grade} → ${n}%`, 'warning');} } },
  { id: 'gp', header: 'Grade point', align: 'right', cell: (g) => <span className="tabular">{g.gp.toFixed(2)}</span>, edit: { value: (g) => String(g.gp), type: 'number', lockedReason: () => canEdit ? null : 'Only the principal can change grading.', onSave: (g, v) => {const n = Number(v);if (!Number.isFinite(n) || n < 0 || n > 5) return '0–5';setGrades((l) => l.map((x) => x.id === g.id ? { ...x, gp: n } : x));} } }];


  return (
    <div className="space-y-4">
      <PageHeader title="Settings" bn="সেটিংস" description="Institution-wide configuration · changes are audited" />
      <UnderlineTabs
        layoutId="set-tabs"
        tabs={[
        { id: 'school', label: 'School profile', to: '/settings/school' },
        { id: 'classes', label: 'Classes & sections', to: '/settings/classes' },
        { id: 'subjects', label: 'Subjects', to: '/settings/subjects' },
        { id: 'grading', label: 'Grading rules', to: '/settings/grading' },
        { id: 'workflows', label: 'Approval workflows', to: '/settings/workflows' },
        { id: 'roles', label: 'Roles & permissions', to: '/settings/roles' }]
        } />
      
      {!canEdit && <Notice kind="locked">You can view settings. Only the principal or school owner can change them.</Notice>}

      {tab === 'school' &&
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Panel title="Institution" actions={<Button size="sm" disabled={!dirty || !canEdit} onClick={() => {setDirty(false);addAudit('Settings', 'School profile updated', profile.name);toast.success('Profile saved');}}><Save className="size-4" /> Save</Button>}>
            <fieldset disabled={!canEdit} className="grid gap-3 sm:grid-cols-2">
              <Field label="Name (English)" required htmlFor="sp-name"><Input id="sp-name" value={profile.name} onChange={(e) => setP('name', e.target.value)} /></Field>
              <Field label="Name (Bangla)" htmlFor="sp-bn"><Input id="sp-bn" lang="bn" className="font-bn" value={profile.bn} onChange={(e) => setP('bn', e.target.value)} /></Field>
              <Field label="EIIN" htmlFor="sp-eiin"><Input id="sp-eiin" value={profile.eiin} onChange={(e) => setP('eiin', e.target.value)} /></Field>
              <Field label="Phone" htmlFor="sp-phone"><Input id="sp-phone" value={profile.phone} onChange={(e) => setP('phone', e.target.value)} /></Field>
              <Field label="Address" htmlFor="sp-addr" className="sm:col-span-2"><Input id="sp-addr" value={profile.address} onChange={(e) => setP('address', e.target.value)} /></Field>
              <Field label="Office email" htmlFor="sp-email"><Input id="sp-email" type="email" value={profile.email} onChange={(e) => setP('email', e.target.value)} /></Field>
              <Field label="Weekly holidays" htmlFor="sp-wk"><SelectField id="sp-wk" disabled={!canEdit} value={profile.weekend} onValueChange={(v) => setP('weekend', v)} options={[{ value: 'Fri-Sat', label: 'Friday & Saturday' }, { value: 'Fri', label: 'Friday only' }, { value: 'Sat-Sun', label: 'Saturday & Sunday' }]} /></Field>
            </fieldset>
            {dirty && <p className="mt-3 text-xs text-warning">Unsaved changes</p>}
          </Panel>
          <div className="space-y-4">
            <Panel title="Language & format">
              <div className="space-y-3 text-[13px]">
                <Field label="Default interface language" htmlFor="sp-lang"><SelectField id="sp-lang" disabled={!canEdit} value={profile.language} onValueChange={(v) => setP('language', v)} options={[{ value: 'en', label: 'English (Bangla helpers)' }, { value: 'bn', label: 'বাংলা' }]} /></Field>
                <label className="flex items-center justify-between gap-2"><span>Bangla digits in print (১২৩)</span><Switch disabled={!canEdit} checked={profile.bnDigits} onCheckedChange={(v) => setP('bnDigits', v)} /></label>
              </div>
            </Panel>
            <Panel title="Academic context">
              <dl className="space-y-1.5 text-[13px]">
                <div className="flex justify-between"><dt className="text-muted-foreground">Board</dt><dd>{school.board}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Curriculum</dt><dd className="text-right">{school.curriculum}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Campuses</dt><dd>{campuses.map((c) => c.short).join(', ')}</dd></div>
              </dl>
            </Panel>
          </div>
        </div>
      }

      {tab === 'classes' && <ClassesTab />}
      {tab === 'subjects' && <SubjectsTab />}

      {tab === 'grading' &&
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <DataTable ariaLabel="Grade scale" rows={grades} columns={gradeCols} getRowId={(g) => g.id} footerNote="Versioned per board & academic year" />
          <Panel title="Applies to">
            <div className="space-y-2 text-[13px]">
              <p>AY 2026 · Dhaka Board · Classes 6–10</p>
              <Notice kind="warning">Changing thresholds recalculates <b>unpublished</b> results only. Published results keep the scale they were released with.</Notice>
            </div>
          </Panel>
        </div>
      }

      {tab === 'workflows' &&
      <Panel title="Approval workflows" description="Locked workflows protect academic and financial integrity" flush>
          <ul className="divide-y divide-border">
            {workflows.map((w) =>
          <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium">{w.label}{w.locked && <Lock className="size-3 text-subtle" aria-label="Required" />}</p>
                  <p className="text-[11.5px] text-muted-foreground">{w.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-muted-foreground">Approver: <b className="font-medium text-foreground">{w.approver}</b></span>
                  <Switch
                checked={w.enabled}
                disabled={!canEdit || w.locked}
                aria-label={w.label}
                onCheckedChange={(v) => {setWorkflows((l) => l.map((x) => x.id === w.id ? { ...x, enabled: v } : x));addAudit('Settings', `Workflow ${v ? 'enabled' : 'disabled'}`, w.label, 'warning');toast.success(`${w.label}: ${v ? 'approval required' : 'no approval'}`);}} />
              
                </div>
              </li>
          )}
            <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-medium">Accounts entries & transfers <Lock className="size-3 text-subtle" aria-label="Required" /></p>
                <p className="text-[11.5px] text-muted-foreground">Income, expenses and transfers at or above this amount wait for approval. Reconciliation adjustments always do. Nobody approves their own entry.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-muted-foreground">Approver: <b className="font-medium text-foreground">Owner / Principal</b></span>
                <div className="relative w-[128px]">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12.5px] text-muted-foreground">৳</span>
                  <Input
                  key={fin.approvalLimit}
                  aria-label="Accounts approval limit"
                  type="number"
                  min={500}
                  step={500}
                  disabled={!canEdit}
                  defaultValue={fin.approvalLimit}
                  className="h-8 pl-6 tabular"
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (n === fin.approvalLimit) return;
                    if (!Number.isFinite(n) || n < 500) {toast.error('Limit must be at least ৳500');e.target.value = String(fin.approvalLimit);return;}
                    fin.setApprovalLimit(n);
                    toast.success(`Approval limit set to ${formatBDT(n)}`, { description: 'Applies to new entries only.' });
                  }}
                  onKeyDown={(e) => {if (e.key === 'Enter') (e.target as HTMLInputElement).blur();}} />
                
                </div>
              </div>
            </li>
          </ul>
        </Panel>
      }

      {tab === 'roles' &&
      <Panel title="Role permissions" description="School roles only · platform staff are managed separately" flush>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-[12.5px]">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="sticky left-0 h-9 bg-muted px-4 text-left font-medium">Permission</th>
                  {roles.filter((r) => MATRIX[r.id]).map((r) => <th key={r.id} className="px-2 text-center font-medium">{r.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERMS.map((p) =>
              <tr key={p} className="border-t border-border">
                    <td className="sticky left-0 bg-card px-4 py-2 font-medium">{p}</td>
                    {roles.filter((r) => MATRIX[r.id]).map((r) => {
                  const forbidden = FORBIDDEN[r.id]?.includes(p);
                  const on = matrix[r.id].includes(p);
                  return (
                    <td key={r.id} className="px-2 py-2 text-center">
                          <input
                        type="checkbox"
                        checked={on}
                        disabled={!canEdit || forbidden}
                        title={forbidden ? 'Not allowed — segregation of duties' : undefined}
                        aria-label={`${p} for ${r.label}`}
                        onChange={() => {setMatrix((m) => ({ ...m, [r.id]: on ? m[r.id].filter((x) => x !== p) : [...m[r.id], p] }));addAudit('Settings', `Permission ${on ? 'revoked' : 'granted'}`, `${r.label} · ${p}`, 'critical');}}
                        className={cn('size-4 accent-[var(--primary)]', forbidden && 'cursor-not-allowed opacity-40')} />
                      
                        </td>);

                })}
                  </tr>
              )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Faded boxes are blocked by segregation-of-duties rules. Every change is logged as a critical audit event; enforcement is server-side.</p>
        </Panel>
      }
    </div>);

}
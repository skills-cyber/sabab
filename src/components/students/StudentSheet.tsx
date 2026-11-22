import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, CreditCard, Home, MessageSquare, Phone, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { UnderlineTabs } from '../common/UnderlineTabs';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar } from '../common/PersonCell';
import { useAdmin } from '../../contexts/AdminContext';
import { useAcademic } from '../../contexts/AcademicContext';
import { useApp } from '../../contexts/AppContext';
import type { Student } from '../../types/school';
import { invoiceBalance, invoiceStatus, invoiceTotal } from '../../utils/fees';
import { gradeFor } from '../../utils/grades';
import { sectionLabel } from '../../utils/timetable';
import { formatBDT, formatDate } from '../../utils/format';
import { campuses } from '../../data/school';
import { isPreviousYear } from '../../utils/family';

const Row = ({ k, v }: {k: string;v: React.ReactNode;}) =>
<div className="flex justify-between gap-3 border-b border-border py-1.5 text-[13px] last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;


/** Quick student preview with related records (guardian, fees, results, history). */
export function StudentSheet({ student, onOpenChange }: {student: Student | null;onOpenChange: (o: boolean) => void;}) {
  const { invoices, students, updateStudent, queueMessage, families, familyStore, currentYear } = useAdmin();
  const { assessments, marks } = useAcademic();
  const { role } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const s = student;
  const inv = s ? invoices.filter((i) => i.studentId === s.id) : [];
  const results = s ? assessments.filter((a) => a.stage === 'published' && a.sectionIds.includes(s.sectionId) && typeof marks[a.id]?.[s.id] === 'number') : [];
  const canSeeFees = role !== 'teacher';
  const family = s?.familyId ? families.find((f) => f.id === s.familyId) : undefined;
  const prevInv = inv.filter((i) => isPreviousYear(i, currentYear) && invoiceBalance(i) > 0);
  const curInv = inv.filter((i) => !isPreviousYear(i, currentYear));
  const history = [...(s?.yearHistory ?? [])].reverse();

  return (
    <Sheet open={!!s} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        {s &&
        <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar name={s.name} size="md" />
                <div className="min-w-0">
                  <SheetTitle className="truncate">{s.name} <span lang="bn" className="font-bn text-sm font-normal text-muted-foreground">{s.nameBn}</span></SheetTitle>
                  <SheetDescription>{s.studentNo} · {sectionLabel(s.sectionId)} · Roll {s.roll || '—'}</SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1"><StatusBadge status={s.status} />{!s.guardianVerified && <StatusBadge status="needs-review" label="Guardian unverified" />}{s.attendancePct > 0 && s.attendancePct < 80 && <StatusBadge status="behind" label="Low attendance" />}</div>
            </SheetHeader>
            <div className="px-4 pt-2">
              <UnderlineTabs layoutId="stu-tabs" value={tab} onChange={setTab} tabs={[{ id: 'profile', label: 'Profile' }, { id: 'guardian', label: 'Family' }, { id: 'academic', label: 'Results', count: results.length }, { id: 'years', label: 'Year history', count: history.length || undefined }, ...(canSeeFees ? [{ id: 'fees', label: 'Fees' }] : [])]} />
            </div>
            <div className="space-y-4 p-4">
              {tab === 'profile' &&
            <dl>
                  <Row k="Campus" v={campuses.find((c) => c.id === s.campusId)?.name} />
                  <Row k="Gender" v={s.gender === 'M' ? 'Male' : 'Female'} />
                  <Row k="Date of birth" v={formatDate(s.dob)} />
                  <Row k="Admitted" v={formatDate(s.admittedOn)} />
                  <Row k="Attendance (AY)" v={s.attendancePct ? `${s.attendancePct}%` : '—'} />
                  <Row k="Transport" v={s.transport ? 'Uses school bus' : 'No'} />
                  <Row k="Siblings" v={s.siblingIds.length ? s.siblingIds.map((id) => students.find((x) => x.id === id)?.name).join(', ') : '—'} />
                  <Row k="Remarks" v={s.remarks || '—'} />
                </dl>
            }
              {tab === 'guardian' &&
            <div className="space-y-3">
                  {family &&
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-[12.5px]">
                      <span><b>{family.id}</b> · {students.filter((x) => x.familyId === family.id).length} child{students.filter((x) => x.familyId === family.id).length > 1 ? 'ren' : ''}{family.secondary ? ` · 2nd contact ${family.secondary.name}` : ''}</span>
                      {role !== 'teacher' && <Button size="xs" variant="outline" onClick={() => navigate(`/students/families?id=${family.id}`)}><Home className="size-3.5" /> Open family</Button>}
                    </div>
              }
                  <dl>
                    <Row k="Name" v={s.guardianName} />
                    <Row k="Relation" v={s.guardianRelation} />
                    <Row k="Phone" v={<span className="tabular">{s.guardianPhone}</span>} />
                    <Row k="Verified" v={s.guardianVerified ? <span className="inline-flex items-center gap-1 text-success"><BadgeCheck className="size-3.5" /> OTP verified</span> : <span className="inline-flex items-center gap-1 text-warning"><ShieldAlert className="size-3.5" /> Not verified</span>} />
                    <Row k="SMS opt-in" v={s.smsOptIn ? 'Yes' : 'No'} />
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    {!s.guardianVerified && role !== 'teacher' && <Button size="sm" onClick={() => {if (s.familyId) familyStore.verifyFamily(s.familyId);else updateStudent(s.id, { guardianVerified: true }, 'Guardian verified via OTP');toast.success('Guardian verified', { description: 'Applies to every child in the family · OTP simulated.' });}}><BadgeCheck className="size-4" /> Verify by OTP</Button>}
                    <Button size="sm" variant="outline" disabled={!s.smsOptIn} onClick={() => {queueMessage({ channel: 'SMS', audience: `Guardian of ${s.name}`, recipients: 1, template: 'Custom', body: 'Message from school office', credits: 1 });toast.success('SMS queued');}}><MessageSquare className="size-4" /> SMS</Button>
                    <a href={`tel:${s.guardianPhone.replace(/-/g, '')}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] hover:bg-muted"><Phone className="size-4" /> Call</a>
                  </div>
                </div>
            }
              {tab === 'academic' && (
            results.length ?
            <ul className="divide-y divide-border rounded-lg border border-border">
                    {results.map((a) => {const m = marks[a.id][s.id] as number;return (
                  <li key={a.id} className="flex items-center justify-between px-3 py-2 text-[13px]"><span>{a.title}<span className="block text-[11px] text-muted-foreground">{formatDate(a.date, 'd MMM')}</span></span><span className="text-right tabular"><b>{m}</b>/{a.totalMarks}<span className="block text-[11px] text-muted-foreground">{gradeFor(m, a.totalMarks).grade}</span></span></li>);
              })}
                  </ul> :
            <p className="text-xs text-muted-foreground">No published results.</p>)
            }
              {tab === 'years' && (
            history.length ?
            <ul className="divide-y divide-border rounded-lg border border-border">
                    {history.map((y) =>
              <li key={y.year} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                        <span><b>AY {y.year}</b> · {sectionLabel(y.sectionId)} · Roll {y.roll}<span className="block text-[11px] text-muted-foreground">{y.resultPct !== undefined ? `${y.grade} · ${y.resultPct}%` : 'No result'} · attendance {y.attendancePct}%{y.reason ? ` · ${y.reason}` : ''}</span></span>
                        <StatusBadge status={y.outcome === 'promoted' ? 'promote' : y.outcome === 'held-back' ? 'hold' : 'graduated'} label={y.outcome === 'promoted' ? 'Promoted' : y.outcome === 'held-back' ? 'Held back' : 'Graduated'} />
                      </li>
              )}
                  </ul> :
            <p className="text-xs text-muted-foreground">First year at school — history appears after the year-end rollover.</p>)
            }
              {tab === 'fees' && canSeeFees &&
            <div className="space-y-3">
                  {prevInv.length > 0 &&
              <div className="rounded-lg border border-warning/40 bg-warning-bg/60 p-3">
                      <p className="text-[12.5px] font-semibold text-warning">Previous year dues · {formatBDT(prevInv.reduce((t, i) => t + invoiceBalance(i), 0))}</p>
                      <ul className="mt-1 space-y-0.5 text-[12px]">{prevInv.map((i) => <li key={i.id} className="flex justify-between"><span>{i.period} · {i.id}</span><span className="tabular">{formatBDT(invoiceBalance(i))}</span></li>)}</ul>
                      <p className="mt-1 text-[11px] text-muted-foreground">Payments clear the oldest dues first.</p>
                    </div>
              }
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {curInv.length === 0 && <li className="px-3 py-3 text-xs text-muted-foreground">No invoices in AY {currentYear}.</li>}
                    {curInv.map((i) =>
                <li key={i.id} className="flex items-center justify-between px-3 py-2 text-[13px]"><span>{i.period}<span className="block text-[11px] text-muted-foreground">{i.id}</span></span><span className="text-right"><span className="block tabular">{formatBDT(invoiceTotal(i))}</span><StatusBadge status={invoiceStatus(i)} /></span></li>
                )}
                  </ul>
                  {inv.some((i) => invoiceBalance(i) > 0) && (role === 'accountant' || role === 'principal' || role === 'owner') &&
              <Button size="sm" onClick={() => navigate(`/fees/collection?collect=${s.id}`)}><CreditCard className="size-4" /> Collect {formatBDT(inv.reduce((t, i) => t + invoiceBalance(i), 0))}</Button>
              }
                </div>
            }
            </div>
          </>
        }
      </SheetContent>
    </Sheet>);

}
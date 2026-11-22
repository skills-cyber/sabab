import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Megaphone, Wallet } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { KpiStrip } from '../components/common/KpiStrip';
import { Panel } from '../components/common/Panel';
import { SubjectChip } from '../components/common/SubjectChip';
import { Avatar } from '../components/common/PersonCell';
import { ParentHomework } from '../components/parent/ParentHomework';
import { ParentResults } from '../components/parent/ParentResults';
import { ParentAttendance } from '../components/parent/ParentAttendance';
import { ParentFees } from '../components/parent/ParentFees';
import { useAdmin } from '../contexts/AdminContext';
import { useAcademic } from '../contexts/AcademicContext';
import { campuses, periodSlots, teachers } from '../data/school';
import { invoiceBalance } from '../utils/fees';
import { sectionLabel } from '../utils/timetable';
import { formatBDT, formatDate, relativeDay, TODAY } from '../utils/format';
import { cn } from '../utils/cn';
import { EmptyState } from '../components/common/EmptyState';
import { PORTAL_GUARDIAN_PHONE } from '../data/families';

const TABS = ['overview', 'homework', 'results', 'attendance', 'fees'];

export function ParentPortal() {
  const { tab } = useParams();
  const { students, invoices, messages, familyStore, previousYearDueFor } = useAdmin();
  const { timetable, assessments, events } = useAcademic();
  /** The signed-in guardian's family. Other students are never queried. */
  const family = familyStore.familyByPhone(PORTAL_GUARDIAN_PHONE);
  const children = students.filter((s) => family && s.familyId === family.id && (s.status === 'active' || s.status === 'graduated'));
  const [childId, setChildId] = useState('');
  if (!TABS.includes(tab ?? '')) return <Navigate to="/parent/overview" replace />;
  if (!family || children.length === 0) return <div className="p-6"><EmptyState title="No linked children" hint="Ask the school office to link your children to your verified phone number." /></div>;
  const child = children.find((c) => c.id === childId) ?? children[0];
  const due = (id: string) => invoices.filter((i) => i.studentId === id).reduce((s, i) => s + invoiceBalance(i), 0);
  const familyDue = children.reduce((t, c) => t + due(c.id), 0);
  const familyPrev = previousYearDueFor(children.map((c) => c.id));
  const todayClasses = timetable.filter((c) => c.sectionId === child.sectionId && c.day === 'Mon').sort((a, b) => a.period - b.period);
  const upcoming = assessments.filter((a) => a.sectionIds.includes(child.sectionId) && a.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const notices = messages.filter((m) => m.channel === 'App' && (m.audience.includes('All guardians') || m.audience.includes(sectionLabel(child.sectionId)))).slice(0, 3);

  return (
    <div className="space-y-4">
      <PageHeader title="My Children" bn="আমার সন্তান" description={`${family.guardianName} · ${family.verified ? 'verified guardian' : 'verification pending'} · ${family.phone}`} />
      {children.length > 1 &&
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[13px] shadow-card">
          <span className="flex items-center gap-2"><Wallet className="size-4 text-primary" aria-hidden /> Family dues for {children.length} children</span>
          <span className="tabular">
            <b className={familyDue ? 'text-warning' : 'text-success'}>{familyDue ? formatBDT(familyDue) : 'All paid'}</b>
            {familyPrev > 0 && <span className="ml-2 text-[11.5px] text-muted-foreground">incl. {formatBDT(familyPrev)} previous year</span>}
          </span>
        </div>
      }

      <div role="tablist" aria-label="Choose child" className="grid gap-2 sm:grid-cols-2">
        {children.map((c) =>
        <button
          key={c.id}
          type="button"
          role="tab"
          aria-selected={c.id === child.id}
          onClick={() => setChildId(c.id)}
          className={cn('flex items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-card transition-colors', c.id === child.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40')}>
          
            <Avatar name={c.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold">{c.name} <span lang="bn" className="font-bn text-xs font-normal text-muted-foreground">{c.nameBn}</span></p>
              <p className="truncate text-[11.5px] text-muted-foreground">{sectionLabel(c.sectionId)} · Roll {c.roll} · {campuses.find((x) => x.id === c.campusId)?.short}</p>
            </div>
            <div className="text-right text-[11.5px]">
              <p className="tabular"><b>{c.attendancePct}%</b> <span className="text-muted-foreground">att.</span></p>
              <p className={cn('tabular', due(c.id) ? 'text-warning' : 'text-success')}>{due(c.id) ? `${formatBDT(due(c.id))} due` : 'Paid'}</p>
            </div>
          </button>
        )}
      </div>

      <UnderlineTabs
        layoutId="parent-tabs"
        tabs={[
        { id: 'overview', label: 'Overview', to: '/parent/overview' },
        { id: 'homework', label: 'Homework', to: '/parent/homework' },
        { id: 'results', label: 'Results', to: '/parent/results' },
        { id: 'attendance', label: 'Attendance', to: '/parent/attendance' },
        { id: 'fees', label: 'Fees', to: '/parent/fees', count: due(child.id) ? 1 : undefined }]
        } />
      

      {tab === 'overview' &&
      <>
          <KpiStrip
          items={[
          { label: 'Attendance', value: `${child.attendancePct}%`, sub: 'This academic year', icon: CalendarDays, tone: child.attendancePct < 85 ? 'warning' : 'success' },
          { label: 'Next assessment', value: upcoming[0] ? relativeDay(upcoming[0].date) : '—', sub: upcoming[0]?.title ?? 'Nothing scheduled', icon: ClipboardCheck, tone: 'info' },
          { label: 'Fees due', value: formatBDT(due(child.id)), sub: due(child.id) ? 'Due 10 Nov' : 'All clear', icon: Wallet, tone: due(child.id) ? 'warning' : 'success' },
          { label: 'School notices', value: notices.length, sub: 'Last 30 days', icon: Megaphone, tone: 'primary' }]
          } />
        
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Today's classes" description={formatDate(TODAY, 'EEEE d MMM')} flush>
              <ul className="divide-y divide-border">
                {todayClasses.map((c) => {
                const slot = periodSlots.find((p) => p.n === c.period);
                return (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                      <span className="w-12 text-[11.5px] text-muted-foreground tabular">{slot?.start}</span>
                      <SubjectChip id={c.subjectId} full />
                      <span className="ml-auto truncate text-[11.5px] text-muted-foreground">{teachers.find((t) => t.id === c.teacherId)?.name}</span>
                    </li>);

              })}
                {todayClasses.length === 0 && <li className="px-4 py-3 text-xs text-muted-foreground">No routine published for this class.</li>}
              </ul>
            </Panel>
            <div className="space-y-4">
              <Panel title="Coming up" flush>
                <ul className="divide-y divide-border">
                  {upcoming.map((a) => <li key={a.id} className="flex items-center justify-between px-4 py-2 text-[13px]"><span>{a.title}</span><span className="text-[11.5px] text-muted-foreground tabular">{formatDate(a.date, 'EEE d MMM')}</span></li>)}
                  {events.filter((e) => e.start >= TODAY).slice(0, 2).map((e) => <li key={e.id} className="flex items-center justify-between px-4 py-2 text-[13px]"><span>{e.title}</span><span className="text-[11.5px] text-muted-foreground tabular">{formatDate(e.start, 'EEE d MMM')}</span></li>)}
                </ul>
              </Panel>
              <Panel title="School notices" flush>
                <ul className="divide-y divide-border">
                  {notices.map((m) => <li key={m.id} className="px-4 py-2 text-[13px]"><p>{m.body}</p><p className="text-[11px] text-muted-foreground">{m.sentAt} · {m.sentBy}</p></li>)}
                  {notices.length === 0 && <li className="px-4 py-3 text-xs text-muted-foreground">No notices.</li>}
                </ul>
              </Panel>
            </div>
            <ParentHomework child={child} limit={3} />
            <ParentResults child={child} compact />
          </div>
          <p className="text-center text-[11px] text-muted-foreground">Language & SMS preferences: <Link to="/parent/fees" className="text-primary hover:underline">contact the school office</Link> (self-service settings designed).</p>
        </>
      }
      {tab === 'homework' && <ParentHomework child={child} />}
      {tab === 'results' && <ParentResults child={child} />}
      {tab === 'attendance' && <ParentAttendance child={child} />}
      {tab === 'fees' && <ParentFees child={child} />}
    </div>);

}
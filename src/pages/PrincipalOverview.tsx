import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpenCheck, ClipboardCheck, ShieldCheck, UserCheck, Wallet, Users } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { KpiStrip } from '../components/common/KpiStrip';
import { Panel } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { CoverageBar } from '../components/common/CoverageBar';
import { SubjectChip } from '../components/common/SubjectChip';
import { Button } from '../components/ui/Button';
import { ActionQueue } from '../components/overview/ActionQueue';
import { LiveRoutine } from '../components/overview/LiveRoutine';
import { useAcademic } from '../contexts/AcademicContext';
import { useAdmin } from '../contexts/AdminContext';
import { useApp } from '../contexts/AppContext';
import { useNavBadges } from '../hooks/useNavBadges';
import { courses } from '../data/academic';
import { computeCoverage } from '../utils/coverage';
import { detectClashes, sectionLabel, DAY_LABEL } from '../utils/timetable';
import { formatBDT, formatDate, pct, relativeDay, TODAY } from '../utils/format';
import { invoiceStatus, invoiceTotal } from '../utils/fees';
import { teachers, rooms } from '../data/school';

const ATTENDANCE_TODAY = [
{ section: '4-B', present: 37, total: 38 },
{ section: '7-A', present: 40, total: 42 },
{ section: '8-A', present: 19, total: 20 },
{ section: '8-B', present: 39, total: 41 },
{ section: '9-A', present: 41, total: 44 }];


export function PrincipalOverview() {
  const { topics, progress, timetable, assessments, events, periods } = useAcademic();
  const { invoices, payments } = useAdmin();
  const { roleInfo, role } = useApp();
  const badges = useNavBadges();
  const navigate = useNavigate();

  const coverage = useMemo(() => courses.map((c) => computeCoverage(c, topics, progress)), [topics, progress]);
  const onTrack = coverage.filter((c) => c.status === 'on-track').length;
  const bySection = ['7A', '8A', '8B', '9A'].map((sid) => {
    const list = coverage.filter((c) => c.sectionId === sid);
    const delivered = list.reduce((s, c) => s + c.pct, 0) / list.length;
    const worst = [...list].sort((a, b) => a.pct - b.pct)[0];
    return { sid, avg: Math.round(delivered), worst, behind: list.filter((c) => c.status === 'behind').length, list };
  });
  const clashes = detectClashes(timetable);
  const nov = invoices.filter((i) => i.period === 'Nov 2026');
  const novBilled = nov.reduce((s, i) => s + invoiceTotal(i), 0);
  const novPaid = nov.reduce((s, i) => s + i.paid, 0);
  const overdue = invoices.filter((i) => invoiceStatus(i) === 'overdue');
  const todayCollected = payments.filter((p) => p.date === TODAY && p.status === 'posted').reduce((s, p) => s + p.amount, 0);
  const upcoming = [...assessments.filter((a) => a.date >= TODAY).map((a) => ({ id: a.id, title: `${a.title} · ${a.sectionIds.map(sectionLabel).join(', ')}`, date: a.date, stage: a.stage, href: `/exams/a/${a.id}` })),
  ...events.filter((e) => e.start >= TODAY && (e.type === 'exam' || e.type === 'ct' || e.type === 'event')).map((e) => ({ id: e.id, title: e.title, date: e.start, stage: e.type === 'exam' ? 'scheduled' : 'upcoming', href: '/planner/calendar' }))].
  sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const unlogged = periods.filter((p) => p.status === 'upcoming').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title={role === 'owner' ? 'Institution Overview' : 'Academic Command Center'}
        bn={role === 'owner' ? 'প্রতিষ্ঠান সারসংক্ষেপ' : 'একাডেমিক কমান্ড সেন্টার'}
        description={`Good morning, ${roleInfo.user.split(' ').slice(-1)[0]} · ${formatDate(TODAY, 'EEEE, d MMMM')} · Term 2, week 44 · Annual exam in ${20} days`}
        actions={
        <>
            <Button variant="outline" size="sm" onClick={() => navigate('/planner/syllabus')}><BookOpenCheck className="size-4" /> Coverage</Button>
            <Button size="sm" onClick={() => document.getElementById('queue')?.scrollIntoView({ behavior: 'smooth' })}><ShieldCheck className="size-4" /> {badges.approvals} approvals</Button>
          </>
        } />
      

      <KpiStrip
        items={[
        { label: 'Students present', value: '94.2%', sub: '1,743 of 1,850 · both campuses', icon: UserCheck, tone: 'success', onClick: () => navigate('/attendance') },
        { label: 'Teachers present', value: '46/48', sub: '1 on leave · 1 late', icon: Users, tone: 'warning', onClick: () => navigate('/staff') },
        { label: 'Courses on track', value: `${onTrack}/${coverage.length}`, sub: `${coverage.filter((c) => c.status === 'behind').length} behind plan`, icon: BookOpenCheck, tone: coverage.some((c) => c.status === 'behind') ? 'warning' : 'success', onClick: () => navigate('/planner/syllabus') },
        { label: 'Timetable clashes', value: clashes.length, sub: clashes.length ? 'Needs resolution' : 'Clean', icon: AlertTriangle, tone: clashes.length ? 'danger' : 'success', onClick: () => navigate('/timetable') },
        { label: 'Nov fees collected', value: `${pct(novPaid, novBilled)}%`, sub: `${formatBDT(novPaid)} of ${formatBDT(novBilled)} · today ${formatBDT(todayCollected)}`, icon: Wallet, tone: 'primary', onClick: () => navigate('/fees/collection') },
        { label: 'Pending approvals', value: badges.approvals, sub: `${unlogged} lessons still to log today`, icon: ClipboardCheck, tone: badges.approvals ? 'warning' : 'success', onClick: () => document.getElementById('queue')?.scrollIntoView({ behavior: 'smooth' }) }]
        } />
      

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div id="queue" className="min-w-0 space-y-4">
          <ActionQueue />
          <LiveRoutine />
        </div>
        <div className="min-w-0 space-y-4">
          <Panel title="Academic progress by section" description="Delivered vs planned to date" actions={<Link to="/planner/syllabus" className="text-xs font-medium text-primary hover:underline">Details</Link>} flush>
            <ul className="divide-y divide-border">
              {bySection.map((s) =>
              <li key={s.sid} className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-[13px] font-semibold">{sectionLabel(s.sid)}</span>
                    <div className="flex-1"><CoverageBar delivered={s.avg} plannedToDate={100} plannedYear={112} /></div>
                    <span className="w-10 text-right text-[13px] font-semibold tabular">{s.avg}%</span>
                  </div>
                  <p className="mt-0.5 pl-[52px] text-[11.5px] text-muted-foreground">
                    Lowest: <SubjectChip id={s.worst.subjectId} className="text-[11.5px]" /> {s.worst.pct}% ({s.worst.gap} periods gap){s.behind ? ` · ${s.behind} behind` : ''}
                  </p>
                </li>
              )}
            </ul>
          </Panel>

          <Panel title="Timetable clashes" actions={<Link to="/timetable" className="text-xs font-medium text-primary hover:underline">Resolve</Link>} flush>
            {clashes.length === 0 ?
            <p className="px-4 py-3 text-xs text-muted-foreground">No clashes in the published routine.</p> :

            <ul className="divide-y divide-border">
                {clashes.map((c) =>
              <li key={c.id} className="flex items-center gap-2 px-4 py-2 text-[12.5px]">
                    <StatusBadge status="behind" label={c.kind === 'teacher' ? 'Teacher' : 'Room'} />
                    <span className="min-w-0 flex-1 truncate">
                      {c.kind === 'teacher' ? teachers.find((t) => t.id === c.resourceId)?.name : rooms.find((r) => r.id === c.resourceId)?.label} double-booked · {DAY_LABEL[c.day]} P{c.period}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{c.cellIds.map((id) => sectionLabel(id.split('-')[0])).join(' & ')}</span>
                  </li>
              )}
              </ul>
            }
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Panel title="Attendance today" flush>
              <ul className="divide-y divide-border">
                {ATTENDANCE_TODAY.map((a) =>
                <li key={a.section} className="flex items-center gap-2 px-4 py-1.5 text-[12.5px]">
                    <span className="w-10 font-medium">{a.section}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-success" style={{ width: `${pct(a.present, a.total)}%` }} /></span>
                    <span className="w-16 text-right text-muted-foreground tabular">{a.present}/{a.total}</span>
                  </li>
                )}
              </ul>
            </Panel>
            <Panel title="Coming up" flush>
              <ul className="divide-y divide-border">
                {upcoming.map((u) =>
                <li key={u.id}>
                    <Link to={u.href} className="flex items-center gap-2 px-4 py-1.5 text-[12.5px] hover:bg-muted/50">
                      <span className="w-14 shrink-0 text-[11px] text-muted-foreground tabular">{formatDate(u.date, 'd MMM')}</span>
                      <span className="min-w-0 flex-1 truncate">{u.title}</span>
                      <span className="shrink-0 text-[10.5px] text-subtle">{relativeDay(u.date)}</span>
                    </Link>
                  </li>
                )}
              </ul>
            </Panel>
          </div>

          <Panel title="Fees snapshot" actions={<Link to="/fees/invoices" className="text-xs font-medium text-primary hover:underline">Dues</Link>}>
            <dl className="grid grid-cols-3 gap-3 text-[13px]">
              <div><dt className="text-xs text-muted-foreground">Billed (Nov)</dt><dd className="font-semibold tabular">{formatBDT(novBilled)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Collected</dt><dd className="font-semibold text-success tabular">{formatBDT(novPaid)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Overdue invoices</dt><dd className="font-semibold text-danger tabular">{overdue.length}</dd></div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>);

}
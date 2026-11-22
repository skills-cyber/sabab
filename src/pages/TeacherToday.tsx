import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, CalendarClock, ClipboardList, NotebookPen, UserX } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { KpiStrip } from '../components/common/KpiStrip';
import { Panel } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SubjectChip } from '../components/common/SubjectChip';
import { Notice } from '../components/common/Notice';
import { PeriodList } from '../components/teaching/PeriodList';
import { LessonWorkspace } from '../components/teaching/LessonWorkspace';
import { CarryForwardPanel } from '../components/teaching/CarryForwardPanel';
import { useAcademic } from '../contexts/AcademicContext';
import { useApp } from '../contexts/AppContext';
import { periodEnd } from '../hooks/useNavBadges';
import { NOW_TIME, formatDate, relativeDay } from '../utils/format';
import { sectionLabel } from '../utils/timetable';

export function TeacherToday() {
  const { periods, assessments, homework } = useAcademic();
  const { online } = useApp();
  const firstPending = periods.find((p) => p.status === 'upcoming' && periodEnd(p.period) <= NOW_TIME) ?? periods.find((p) => p.status === 'upcoming') ?? periods[0];
  const [selected, setSelected] = useState(firstPending.id);
  const period = periods.find((p) => p.id === selected) ?? periods[0];

  const logged = periods.filter((p) => p.status === 'submitted').length;
  const pending = periods.filter((p) => p.status === 'upcoming' && periodEnd(p.period) <= NOW_TIME).length;
  const pendingSync = periods.filter((p) => p.sync === 'pending-sync').length;
  const absent8A = Object.values(periods.find((p) => p.id === 'tp1')?.attendance ?? {}).filter((v) => v === 'A').length;
  const myTests = assessments.filter((a) => a.teacherId === 'T01' && a.stage !== 'published').sort((a, b) => a.date.localeCompare(b.date));
  const myHomework = homework.filter((h) => h.teacherId === 'T01');

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Teaching Day"
        bn="আজকের ক্লাস"
        description={`Monday, ${formatDate('2026-11-02', 'd MMMM yyyy')} · Mirpur Campus · Class teacher of 8-A`}
        meta={
        <>
            <StatusBadge status={online ? 'synced' : 'pending-sync'} label={online ? 'Online · all synced' : 'Offline mode'} />
            {pendingSync > 0 && <StatusBadge status="pending-sync" label={`${pendingSync} pending sync`} />}
          </>
        } />
      

      {!online && <Notice kind="offline">You're offline (simulated). Attendance and lesson logs save on this device with a <b>Pending sync</b> state and replay when you reconnect. Fee or marks publication is never done offline.</Notice>}

      <KpiStrip
        items={[
        { label: 'Classes today', value: `${logged}/${periods.length} logged`, sub: 'P1, P2, P4, P5', icon: BookOpenCheck, tone: 'primary' },
        { label: 'Needs logging', value: pending, sub: pending ? 'Past periods not submitted' : 'All caught up', icon: NotebookPen, tone: pending ? 'warning' : 'success' },
        { label: '8-A absent today', value: absent8A, sub: 'Guardian SMS sent', icon: UserX, tone: absent8A ? 'danger' : 'success' },
        { label: 'My assessments', value: myTests.length, sub: myTests[0] ? `${myTests[0].title} · ${relativeDay(myTests[0].date)}` : '—', icon: ClipboardList, tone: 'info' },
        { label: 'Homework set', value: myHomework.length, sub: 'Visible to guardians', icon: CalendarClock, tone: 'neutral' }]
        } />
      

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Panel title="Today" description={`Now ${NOW_TIME} · break`} bodyClassName="p-2">
          <PeriodList periods={periods} selectedId={period.id} onSelect={setSelected} />
        </Panel>
        <div className="min-w-0">
          <LessonWorkspace key={period.id + period.status} period={period} />
        </div>
        <div className="space-y-4 lg:col-span-2 xl:col-span-1">
          <CarryForwardPanel teacherId="T01" />
          <Panel title="Upcoming assessments" actions={<Link to="/exams/assessments" className="text-xs font-medium text-primary hover:underline">All</Link>} flush>
            <ul className="divide-y divide-border">
              {myTests.map((a) =>
              <li key={a.id}>
                  <Link to={`/exams/a/${a.id}`} className="flex items-center gap-2 px-4 py-2 text-[12.5px] hover:bg-muted/50">
                    <SubjectChip id={a.subjectId} />
                    <span className="min-w-0 flex-1 truncate font-medium">{a.title} · {a.sectionIds.map(sectionLabel).join(', ')}</span>
                    <StatusBadge status={a.stage} />
                  </Link>
                </li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>);

}
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { StatusBadge } from '../components/common/StatusBadge';
import { YearCalendar } from '../components/planner/YearCalendar';
import { SyllabusCoverage } from '../components/planner/SyllabusCoverage';
import { WeeklyPlan } from '../components/planner/WeeklyPlan';
import { PlanVersions } from '../components/planner/PlanVersions';
import { useAcademic } from '../contexts/AcademicContext';
import { school } from '../data/school';

const TABS = ['calendar', 'syllabus', 'weekly', 'versions'] as const;

export function AcademicPlanner() {
  const { tab } = useParams();
  const { plans } = useAcademic();
  if (!TABS.includes(tab as (typeof TABS)[number])) return <Navigate to="/planner/calendar" replace />;
  const published = plans.find((p) => p.status === 'published');
  const pending = plans.filter((p) => p.status === 'submitted');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Academic Planner"
        bn="একাডেমিক পরিকল্পনা"
        description={`AY 2026 · ${school.curriculum}`}
        meta={
        <>
            {published && <StatusBadge status="published" label={`Plan ${published.version} published`} />}
            {pending.map((p) => <StatusBadge key={p.id} status="submitted" label={`${p.version} awaiting approval`} />)}
          </>
        } />
      
      <UnderlineTabs
        layoutId="planner-tabs"
        tabs={[
        { id: 'calendar', label: 'Year calendar', to: '/planner/calendar' },
        { id: 'syllabus', label: 'Syllabus coverage', to: '/planner/syllabus' },
        { id: 'weekly', label: 'Weekly plan', to: '/planner/weekly' },
        { id: 'versions', label: 'Versions & approval', to: '/planner/versions', count: pending.length || undefined }]
        } />
      
      {tab === 'calendar' && <YearCalendar />}
      {tab === 'syllabus' && <SyllabusCoverage />}
      {tab === 'weekly' && <WeeklyPlan />}
      {tab === 'versions' && <PlanVersions />}
    </div>);

}
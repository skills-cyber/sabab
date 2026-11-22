import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { AssessmentsTab } from '../components/exams/AssessmentsTab';
import { QuestionBankTab } from '../components/exams/QuestionBankTab';
import { ResultsTab } from '../components/exams/ResultsTab';
import { useAcademic } from '../contexts/AcademicContext';

const TABS = ['assessments', 'questions', 'results'];

export function Exams() {
  const { tab } = useParams();
  const { assessments, questions } = useAcademic();
  if (!TABS.includes(tab ?? '')) return <Navigate to="/exams/assessments" replace />;
  return (
    <div className="space-y-4">
      <PageHeader title="Exams & Class Tests" bn="পরীক্ষা ও শ্রেণি পরীক্ষা" description="Syllabus-linked assessments · draft → moderation → scheduled → marking → verification → published" />
      <UnderlineTabs
        layoutId="exam-tabs"
        tabs={[
        { id: 'assessments', label: 'Assessments', to: '/exams/assessments', count: assessments.filter((a) => a.stage !== 'published').length },
        { id: 'questions', label: 'Question bank', to: '/exams/questions', count: questions.filter((q) => q.status !== 'approved').length || undefined },
        { id: 'results', label: 'Results', to: '/exams/results' }]
        } />
      
      {tab === 'assessments' && <AssessmentsTab />}
      {tab === 'questions' && <QuestionBankTab />}
      {tab === 'results' && <ResultsTab />}
    </div>);

}
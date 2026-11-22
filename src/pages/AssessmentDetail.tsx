import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Printer, Send } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { Panel } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { Stepper } from '../components/common/Stepper';
import { ApprovalTimeline } from '../components/common/ApprovalTimeline';
import { ApprovalDialog } from '../components/common/ApprovalDialog';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { subjectName } from '../components/common/SubjectChip';
import { Button } from '../components/ui/Button';
import { PaperBuilder } from '../components/exams/PaperBuilder';
import { MarksSheet } from '../components/exams/MarksSheet';
import { useAcademic } from '../contexts/AcademicContext';
import { useAdmin } from '../contexts/AdminContext';
import { useApp } from '../contexts/AppContext';
import { rooms, teachers } from '../data/school';
import { sectionLabel } from '../utils/timetable';
import { formatDate } from '../utils/format';

const STEPS = [
{ id: 'draft', label: 'Draft' },
{ id: 'moderation', label: 'Moderation' },
{ id: 'scheduled', label: 'Scheduled' },
{ id: 'marking', label: 'Marking' },
{ id: 'verification', label: 'Verification' },
{ id: 'published', label: 'Published' }];


export function AssessmentDetail() {
  const { id } = useParams();
  const { assessments, moveStage, marks, questions } = useAcademic();
  const { students, queueMessage } = useAdmin();
  const { role, canApprove } = useApp();
  const [tab, setTab] = useState('paper');
  const [moderate, setModerate] = useState(false);
  const [publish, setPublish] = useState(false);
  const a = assessments.find((x) => x.id === id);

  if (!a) {
    return <Panel><EmptyState title="Assessment not found" action={<Link to="/exams/assessments" className="text-xs font-medium text-primary hover:underline">Back to assessments</Link>} /></Panel>;
  }

  const roster = students.filter((s) => a.sectionIds.includes(s.sectionId) && s.status === 'active');
  const entered = roster.filter((s) => typeof marks[a.id]?.[s.id] === 'number').length;
  const paperMarks = questions.filter((q) => a.questionIds.includes(q.id)).reduce((s, q) => s + q.marks, 0);
  const isAuthor = role === 'teacher' || role === 'coordinator';
  const isMath = a.subjectId === 'MATH' || a.subjectId === 'HMATH';

  const submitModeration = () => {
    if (isMath && (!a.topicIds.length || !a.questionIds.length)) return toast.error('Select scope topics and add questions first.');
    if (isMath && paperMarks !== a.totalMarks) return toast.error(`Paper totals ${paperMarks} marks; it must equal ${a.totalMarks}.`);
    moveStage(a.id, 'moderation', 'Paper submitted for moderation');
    toast.success('Sent to moderator', { description: `${teachers.find((t) => t.id === a.moderatorId)?.name} will review the paper.` });
  };

  const action = (() => {
    if (a.stage === 'draft' && isAuthor) return <Button size="sm" onClick={submitModeration}><Send className="size-4" /> Submit for moderation</Button>;
    if (a.stage === 'moderation') return <Button size="sm" onClick={() => setModerate(true)}>{canApprove ? 'Moderate paper' : 'View moderation'}</Button>;
    if (a.stage === 'scheduled') return <Button size="sm" onClick={() => {moveStage(a.id, 'marking', 'Exam held · marking opened');setTab('marks');toast.success('Marking opened');}}>Exam held · open marking</Button>;
    if (a.stage === 'marking') return <Button size="sm" disabled={entered < roster.length} onClick={() => {moveStage(a.id, 'verification', 'Marks submitted for verification');toast.success('Submitted for verification');}}><Send className="size-4" /> Submit marks ({entered}/{roster.length})</Button>;
    if (a.stage === 'verification' && canApprove) return <Button size="sm" onClick={() => setPublish(true)}><CheckCircle2 className="size-4" /> Verify & publish</Button>;
    return null;
  })();

  return (
    <div className="space-y-4">
      <Link to="/exams/assessments" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Assessments</Link>
      <PageHeader
        title={a.title}
        description={`${a.id} · ${subjectName(a.subjectId)} · ${a.sectionIds.map(sectionLabel).join(', ')} · ${formatDate(a.date, 'EEE d MMM')} ${a.startTime} · ${a.durationMin} min · ${a.totalMarks} marks`}
        meta={<StatusBadge status={a.stage} />}
        actions={<><Button size="sm" variant="outline" onClick={() => window.print()} disabled={!a.questionIds.length}><Printer className="size-4" /> Print paper</Button>{action}</>} />
      
      <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card"><Stepper steps={STEPS} current={a.stage} /></div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-3">
          <UnderlineTabs layoutId="as-tabs" value={tab} onChange={setTab} tabs={[{ id: 'paper', label: 'Scope & paper' }, { id: 'marks', label: 'Marks', count: entered }]} />
          {tab === 'paper' ? <PaperBuilder assessment={a} /> : <MarksSheet assessment={a} />}
        </div>
        <div className="space-y-4">
          <Panel title="Details">
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-xs text-muted-foreground">Setter</dt><dd>{teachers.find((t) => t.id === a.teacherId)?.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Moderator</dt><dd>{teachers.find((t) => t.id === a.moderatorId)?.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Room</dt><dd>{rooms.find((r) => r.id === a.roomId)?.label}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Weight</dt><dd className="tabular">{a.weight}%</dd></div>
              <div className="col-span-2"><dt className="text-xs text-muted-foreground">Guardian visibility</dt><dd>{a.stage === 'published' ? 'Visible to linked guardians & students' : 'Hidden until published'}</dd></div>
            </dl>
          </Panel>
          <Panel title="History"><ApprovalTimeline entries={a.history} /></Panel>
        </div>
      </div>

      <ApprovalDialog
        open={moderate}
        onOpenChange={setModerate}
        title={`Moderate ${a.title}`}
        description={`${a.questionIds.length} questions · ${paperMarks}/${a.totalMarks} marks`}
        history={a.history}
        approveLabel="Approve & schedule"
        readOnly={!canApprove && role !== 'teacher'}
        onDecision={(ok, n) => {moveStage(a.id, ok ? 'scheduled' : 'draft', ok ? 'Paper approved & scheduled' : 'Paper returned for revision', n, ok ? 'success' : 'warning');toast.success(ok ? 'Paper approved — questions locked' : 'Returned to setter');}}>
        
        <p className="text-[13px]">Check coverage, difficulty balance and wording. Approval locks the question versions used.</p>
      </ApprovalDialog>
      <ConfirmDialog
        open={publish}
        onOpenChange={setPublish}
        title="Verify and publish results?"
        description={`${roster.length} students · guardians of ${a.sectionIds.map(sectionLabel).join(', ')} will see marks in the portal and get a notification.`}
        confirmLabel="Publish"
        onConfirm={() => {
          moveStage(a.id, 'published', 'Verified & published to guardians', undefined, 'success');
          queueMessage({ channel: 'App', audience: `${a.sectionIds.map(sectionLabel).join(', ')} guardians`, recipients: roster.length, template: 'Result published', body: `${a.title} result is now available.`, credits: 0 });
          toast.success('Results published', { description: 'Portal notification queued.' });
        }} />
      
    </div>);

}
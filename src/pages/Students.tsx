import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, Award, BadgeCheck, Download, Eye, FileX2, GraduationCap, Home, MessageSquare, Plus, ShieldAlert, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { KpiStrip } from '../components/common/KpiStrip';
import { DataTable, type Column } from '../components/common/DataTable/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { PersonCell } from '../components/common/PersonCell';
import { Segmented } from '../components/common/Segmented';
import { SelectField } from '../components/common/SelectField';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { StudentSheet } from '../components/students/StudentSheet';
import { AddStudentDialog } from '../components/students/AddStudentDialog';
import { StudentsNav } from '../components/students/StudentsNav';
import { useAdmin } from '../contexts/AdminContext';
import { useApp } from '../contexts/AppContext';
import { sections } from '../data/school';
import type { Student } from '../types/school';
import { invoiceBalance } from '../utils/fees';
import { sectionLabel } from '../utils/timetable';
import { downloadCsv, formatBDT } from '../utils/format';
import { cn } from '../utils/cn';

type StatusFilter = 'active' | 'admission-pending' | 'left' | 'graduated' | 'all';
const TEACHER_SECTIONS = ['8A', '8B', '7A', '9A'];

export function Students() {
  const { students, invoices, updateStudent, queueMessage, families, currentYear } = useAdmin();
  const { role, campusId } = useApp();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<StatusFilter>('active');
  const [section, setSection] = useState('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [transfer, setTransfer] = useState<Student | null>(null);
  const [transferTo, setTransferTo] = useState('8B');
  const [tc, setTc] = useState<Student | null>(null);

  useEffect(() => {
    const id = params.get('id');
    if (id) setViewId(id);
    if (params.get('new') === '1') setAddOpen(true);
    if (id || params.get('new')) {
      params.delete('id');
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const canEdit = role === 'office' || role === 'principal' || role === 'owner' || role === 'coordinator';
  const scoped = useMemo(() => students.filter((s) => (role === 'teacher' ? TEACHER_SECTIONS.includes(s.sectionId) : true) && (campusId === 'all' || s.campusId === campusId)), [students, role, campusId]);
  const rows = useMemo(() => scoped.filter((s) => (section === 'all' || s.sectionId === section) && (status === 'all' || (status === 'left' ? s.status === 'transferred' || s.status === 'withdrawn' : s.status === status))), [scoped, section, status]);
  const due = (s: Student) => invoices.filter((i) => i.studentId === s.id).reduce((t, i) => t + invoiceBalance(i), 0);
  const viewing = students.find((s) => s.id === viewId) ?? null;

  const columns: Column<Student>[] = [
  { id: 'name', header: 'Student', sortValue: (s) => s.name, cell: (s) => <PersonCell name={s.name} bn={s.nameBn} sub={s.studentNo} /> },
  { id: 'class', header: 'Class', sortValue: (s) => s.sectionId, cell: (s) => <span className="whitespace-nowrap">{sectionLabel(s.sectionId)}</span> },
  {
    id: 'roll', header: 'Roll', align: 'right', sortValue: (s) => s.roll, cell: (s) => <span className="tabular">{s.roll || '—'}</span>,
    edit: {
      value: (s) => String(s.roll), type: 'number',
      lockedReason: (s) => !canEdit ? 'Only office staff can change rolls.' : s.status !== 'active' ? 'Roll is assigned after enrolment.' : null,
      onSave: (s, v) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 99) return '1–99';
        const clash = students.find((x) => x.sectionId === s.sectionId && x.roll === n && x.id !== s.id && x.status === 'active');
        if (clash) return `Roll ${n} belongs to ${clash.name}`;
        updateStudent(s.id, { roll: n }, `Roll changed to ${n}`);
      }
    }
  },
  { id: 'guardian', header: 'Guardian', mobileHidden: true, cell: (s) => <div className="min-w-[150px]"><p className="flex items-center gap-1 font-medium">{s.guardianName}{s.guardianVerified ? <BadgeCheck className="size-3.5 text-success" aria-label="Verified" /> : <ShieldAlert className="size-3.5 text-warning" aria-label="Unverified" />}</p><p className="text-[11px] text-muted-foreground tabular">{s.guardianRelation} · {s.guardianPhone}</p></div> },
  { id: 'att', header: 'Attendance', align: 'right', sortValue: (s) => s.attendancePct, cell: (s) => <span className={cn('tabular', s.attendancePct && s.attendancePct < 80 && 'font-semibold text-danger')}>{s.attendancePct ? `${s.attendancePct}%` : '—'}</span> },
  ...(role !== 'teacher' ? [{ id: 'due', header: 'Dues', align: 'right' as const, sortValue: (s: Student) => due(s), cell: (s: Student) => {const d = due(s);return <span className={cn('tabular', d > 0 ? 'font-medium' : 'text-subtle')}>{d > 0 ? formatBDT(d) : '—'}</span>;} }] : []),
  { id: 'status', header: 'Status', cell: (s) => <StatusBadge status={s.status} /> },
  {
    id: 'remarks', header: 'Remarks', hideable: true, mobileHidden: true, cell: (s) => <span className="line-clamp-1 max-w-[180px] text-[12px] text-muted-foreground">{s.remarks || '—'}</span>,
    edit: {
      value: (s) => s.remarks,
      lockedReason: () => role === 'accountant' ? 'Read-only for finance roles.' : null,
      onSave: (s, v) => {if (v.length > 120) return 'Max 120 characters';updateStudent(s.id, { remarks: v }, 'Remarks updated');}
    }
  }];


  const exportRows = (list: Student[]) => downloadCsv('students.csv', list.map((s) => ({ ID: s.studentNo, Name: s.name, 'Name (BN)': s.nameBn, Class: sectionLabel(s.sectionId), Roll: s.roll, Guardian: s.guardianName, Phone: s.guardianPhone, Status: s.status })));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        bn="শিক্ষার্থী"
        description={role === 'teacher' ? 'Your sections · read-only except remarks' : `AY ${currentYear} · enrolment, guardians, transfers and records · sample subset of 1,850`}
        actions={
        <>
            <Button size="sm" variant="outline" onClick={() => exportRows(rows)}><Download className="size-4" /> Export</Button>
            {canEdit && <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add student</Button>}
          </>
        } />
      
      <StudentsNav />
      <KpiStrip
        items={[
        { label: 'Active', value: scoped.filter((s) => s.status === 'active').length, sub: 'In this scope', icon: GraduationCap, tone: 'primary', onClick: () => setStatus('active') },
        { label: 'Admission pending', value: scoped.filter((s) => s.status === 'admission-pending').length, sub: 'Documents / OTP', icon: UserCheck, tone: 'info', onClick: () => setStatus('admission-pending') },
        { label: 'Guardian unverified', value: scoped.filter((s) => !s.guardianVerified).length, sub: 'No portal access yet', icon: ShieldAlert, tone: 'warning' },
        { label: 'Attendance < 80%', value: scoped.filter((s) => s.status === 'active' && s.attendancePct > 0 && s.attendancePct < 80).length, sub: 'Needs follow-up', icon: UserX, tone: 'danger' },
        ...(role !== 'teacher' ? [
        { label: 'Families', value: new Set(scoped.map((s) => s.familyId)).size, sub: `${families.length} households in total`, icon: Home, tone: 'neutral' as const },
        { label: 'Graduated', value: scoped.filter((s) => s.status === 'graduated').length, sub: 'Completed Class 10 / 12', icon: Award, tone: 'success' as const, onClick: () => setStatus('graduated') }] :
        [])]
        } />
      
      <DataTable
        ariaLabel="Students"
        rows={rows}
        columns={columns}
        getRowId={(s) => s.id}
        onRowClick={(s) => setViewId(s.id)}
        searchText={(s) => `${s.name} ${s.nameBn} ${s.studentNo} ${s.guardianName} ${s.guardianPhone}`}
        searchPlaceholder="Name, ID, guardian or phone…"
        toolbar={
        <>
            <SelectField size="sm" className="w-36" ariaLabel="Class" value={section} onValueChange={setSection} options={[{ value: 'all', label: 'All classes' }, ...sections.filter((s) => role !== 'teacher' || TEACHER_SECTIONS.includes(s.id)).map((s) => ({ value: s.id, label: s.label }))]} />
            <Segmented ariaLabel="Status" value={status} onChange={setStatus} options={[{ value: 'active', label: 'Active' }, { value: 'admission-pending', label: 'Pending' }, { value: 'left', label: 'Left' }, { value: 'graduated', label: 'Graduated' }, { value: 'all', label: 'All' }]} />
          </>
        }
        rowActions={(s) => [
        { label: 'View profile', icon: Eye, onSelect: () => setViewId(s.id) },
        { label: 'Message guardian', icon: MessageSquare, disabled: !s.smsOptIn, onSelect: () => {queueMessage({ channel: 'SMS', audience: `Guardian of ${s.name}`, recipients: 1, template: 'Custom', body: 'Message from school', credits: 1 });toast.success('SMS queued');} },
        { label: 'Transfer section', icon: ArrowRightLeft, disabled: !canEdit || s.status !== 'active', onSelect: () => {setTransfer(s);setTransferTo(sections.find((x) => x.grade === sections.find((y) => y.id === s.sectionId)?.grade && x.id !== s.sectionId)?.id ?? s.sectionId);} },
        { label: s.status === 'admission-pending' ? 'Confirm enrolment' : 'Issue transfer certificate', icon: s.status === 'admission-pending' ? UserCheck : FileX2, destructive: s.status === 'active', disabled: !canEdit || s.status !== 'active' && s.status !== 'admission-pending', separatorBefore: true, onSelect: () => s.status === 'admission-pending' ? (updateStudent(s.id, { status: 'active', roll: students.filter((x) => x.sectionId === s.sectionId && x.status === 'active').length + 1 }, 'Enrolment confirmed'), toast.success(`${s.name} enrolled`)) : setTc(s) }]
        }
        bulkActions={(ids, clear) =>
        <>
            <Button size="xs" variant="outline" onClick={() => {const list = students.filter((s) => ids.includes(s.id) && s.smsOptIn);const fams = new Set(list.map((s) => s.familyId ?? s.id)).size;queueMessage({ channel: 'SMS', audience: `${fams} selected families`, recipients: fams, template: 'Custom', body: 'School notice', credits: fams });toast.success(`SMS queued to ${fams} families`, { description: `${list.length - fams} duplicate texts avoided · ${ids.length - list.length} skipped (no opt-in)` });clear();}}><MessageSquare className="size-3.5" /> SMS guardians</Button>
            <Button size="xs" variant="outline" onClick={() => exportRows(students.filter((s) => ids.includes(s.id)))}><Download className="size-3.5" /> Export</Button>
          </>
        }
        emptyTitle="No students match these filters"
        footerNote="Fictional sample records" />
      
      <StudentSheet student={viewing} onOpenChange={(o) => !o && setViewId(null)} />
      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
      <ConfirmDialog
        open={!!transfer}
        onOpenChange={(o) => !o && setTransfer(null)}
        title={`Transfer ${transfer?.name}`}
        description="History stays in the original section; attendance and marks move from today."
        confirmLabel="Transfer"
        reasonLabel="Reason"
        onConfirm={(r) => {if (transfer) {updateStudent(transfer.id, { sectionId: transferTo }, `Section transfer → ${transferTo}: ${r}`);toast.success(`Moved to ${sectionLabel(transferTo)}`);}}}>
        
        <SelectField ariaLabel="New section" value={transferTo} onValueChange={setTransferTo} options={sections.filter((s) => s.id !== transfer?.sectionId).map((s) => ({ value: s.id, label: s.label }))} />
      </ConfirmDialog>
      <ConfirmDialog
        open={!!tc}
        onOpenChange={(o) => !o && setTc(null)}
        title={`Issue transfer certificate for ${tc?.name}?`}
        description="The student becomes read-only history. Outstanding dues must be cleared or waived first in production."
        confirmLabel="Issue TC"
        destructive
        reasonLabel="Reason for leaving"
        onConfirm={(r) => {if (tc) {updateStudent(tc.id, { status: 'transferred', remarks: `TC issued 02 Nov 2026 — ${r}` }, 'Transfer certificate issued');toast.success('TC issued', { description: 'Printable certificate is designed (A4, bilingual).' });}}} />
      
    </div>);

}
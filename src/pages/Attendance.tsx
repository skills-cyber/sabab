import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, History, Lock, MessageSquare, UserX, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { KpiStrip } from '../components/common/KpiStrip';
import { Panel } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { Notice } from '../components/common/Notice';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PersonCell } from '../components/common/PersonCell';
import { Checkbox } from '../components/ui/Checkbox';
import { Button } from '../components/ui/Button';
import { AttendanceGrid } from '../components/teaching/AttendanceGrid';
import { useAdmin } from '../contexts/AdminContext';
import { useApp } from '../contexts/AppContext';
import { sections, teachers } from '../data/school';
import type { AttendanceMark } from '../types/academic';
import { sectionLabel } from '../utils/timetable';
import { TODAY, formatDate } from '../utils/format';
import { cn } from '../utils/cn';

interface DayRecord {
  marks: Record<string, AttendanceMark>;
  confirmed: boolean;
  by?: string;
  at?: string;
  corrections: Array<{at: string;by: string;reason: string;}>;
}

const MIRPUR = sections.filter((s) => s.campusId === 'mirpur');

/** Seed: 8-A confirmed by the class teacher this morning; others pending. */
function seed(students: ReturnType<typeof useAdmin>['students']): Record<string, DayRecord> {
  const rec: Record<string, DayRecord> = {};
  MIRPUR.forEach((sec) => {
    const list = students.filter((s) => s.sectionId === sec.id && s.status === 'active');
    if (sec.id === '8A' || sec.id === '4B') {
      rec[sec.id] = {
        confirmed: true, by: sec.id === '8A' ? 'Farhana Rahman' : 'Rumana Afroz', at: '08:41', corrections: [],
        marks: Object.fromEntries(list.map((s, i) => [s.id, s.attendancePct < 80 && i % 2 === 0 ? 'A' : i === 3 ? 'L' : 'P'])) as Record<string, AttendanceMark>
      };
    } else rec[sec.id] = { marks: {}, confirmed: false, corrections: [] };
  });
  return rec;
}

export function Attendance() {
  const { students, queueMessage, addAudit } = useAdmin();
  const { role, roleInfo, online } = useApp();
  const [records, setRecords] = useState<Record<string, DayRecord>>(() => seed(students));
  const [sectionId, setSectionId] = useState(role === 'teacher' ? '8A' : '8B');
  const [notify, setNotify] = useState(true);
  const [correct, setCorrect] = useState(false);
  const [editing, setEditing] = useState(false);

  const visible = role === 'teacher' ? MIRPUR.filter((s) => s.classTeacherId === 'T01') : MIRPUR;
  const roster = (sid: string) => students.filter((s) => s.sectionId === sid && s.status === 'active').sort((a, b) => a.roll - b.roll);
  const rec = records[sectionId];
  const list = roster(sectionId);
  const count = (r: DayRecord | undefined, m: AttendanceMark) => Object.values(r?.marks ?? {}).filter((x) => x === m).length;
  const absentees = list.filter((s) => rec.marks[s.id] === 'A');
  const locked = rec.confirmed && !editing;

  const totals = useMemo(() => {
    const confirmed = MIRPUR.filter((s) => records[s.id]?.confirmed);
    const present = confirmed.reduce((t, s) => t + count(records[s.id], 'P') + count(records[s.id], 'L'), 0);
    const marked = confirmed.reduce((t, s) => t + Object.keys(records[s.id].marks).length, 0);
    return { confirmed: confirmed.length, present, marked, absent: confirmed.reduce((t, s) => t + count(records[s.id], 'A'), 0), late: confirmed.reduce((t, s) => t + count(records[s.id], 'L'), 0) };
  }, [records]);

  const chronic = students.filter((s) => s.status === 'active' && s.attendancePct > 0 && s.attendancePct < 80 && visible.some((v) => v.id === s.sectionId));

  const confirm = (reason?: string) => {
    if (Object.keys(rec.marks).length < list.length) return toast.error(`${list.length - Object.keys(rec.marks).length} students not marked yet.`);
    setRecords((r) => ({ ...r, [sectionId]: { ...rec, confirmed: true, by: roleInfo.user, at: '10:05', corrections: reason ? [...rec.corrections, { at: '10:05', by: roleInfo.user, reason }] : rec.corrections } }));
    setEditing(false);
    addAudit('Attendance', reason ? 'Attendance corrected' : 'Daily attendance confirmed', `${sectionLabel(sectionId)} · ${count(rec, 'P')} P / ${count(rec, 'A')} A${reason ? ` · ${reason}` : ''}`, reason ? 'warning' : 'info');
    const optedIn = absentees.filter((s) => s.smsOptIn);
    if (notify && optedIn.length && !reason) {
      queueMessage({ channel: 'SMS', audience: `${sectionLabel(sectionId)} guardians · absentees`, recipients: optedIn.length, template: 'Absence alert', body: `আজ ${formatDate(TODAY)} তারিখে আপনার সন্তান অনুপস্থিত।`, credits: optedIn.length * 2 });
    }
    toast.success(reason ? 'Correction saved' : 'Attendance confirmed', { description: notify && optedIn.length && !reason ? `Absence SMS queued to ${optedIn.length} guardian(s)` : online ? 'Synced' : 'Saved offline — will sync when connected' });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Attendance" bn="উপস্থিতি" description={`Daily student attendance · ${formatDate(TODAY, 'EEEE d MMM yyyy')} · Mirpur campus`} />
      <KpiStrip
        items={[
        { label: 'Sections confirmed', value: `${totals.confirmed}/${MIRPUR.length}`, sub: 'Daily roll call', icon: CheckCircle2, tone: totals.confirmed === MIRPUR.length ? 'success' : 'warning' },
        { label: 'Present rate', value: totals.marked ? `${Math.round(totals.present / totals.marked * 100)}%` : '—', sub: 'Confirmed sections', icon: Users, tone: 'primary' },
        { label: 'Absent today', value: totals.absent, sub: 'Guardian alerts on confirm', icon: UserX, tone: 'danger' },
        { label: 'Late arrivals', value: totals.late, sub: 'After 08:10', icon: Clock, tone: 'info' }]
        } />
      
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Panel title="Sections" flush>
          <ul className="divide-y divide-border">
            {visible.map((s) => {
              const r = records[s.id];
              const n = roster(s.id).length;
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => {setSectionId(s.id);setEditing(false);}} aria-current={sectionId === s.id} className={cn('flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[13px] transition-colors hover:bg-muted/50', sectionId === s.id && 'bg-accent/60')}>
                    <span><b className="font-semibold">{s.label}</b><span className="block text-[11px] text-muted-foreground">{teachers.find((t) => t.id === s.classTeacherId)?.name} · {n} students</span></span>
                    {r.confirmed ? <StatusBadge status="approved" label={`${count(r, 'A')} absent`} /> : <StatusBadge status="pending" />}
                  </button>
                </li>);

            })}
          </ul>
        </Panel>

        <Panel
          title={`${sectionLabel(sectionId)} · roll call`}
          description={rec.confirmed ? `Confirmed by ${rec.by} at ${rec.at}${rec.corrections.length ? ` · ${rec.corrections.length} correction(s)` : ''}` : 'Mark everyone present, then tap exceptions'}
          actions={rec.confirmed && !editing ? <Button size="sm" variant="outline" onClick={() => setCorrect(true)}><History className="size-4" /> Correct</Button> : undefined}>
          
          <div className="space-y-3">
            {locked && <Notice kind="locked">Confirmed attendance is locked. Corrections need a reason and are logged with who/when.</Notice>}
            {!online && <Notice kind="offline">Offline — marks are saved on this device and sync automatically (shown as Pending sync).</Notice>}
            <AttendanceGrid students={list} value={rec.marks} onChange={(m) => setRecords((r) => ({ ...r, [sectionId]: { ...rec, marks: m } }))} disabled={locked} />
            {!locked &&
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <label className="flex items-center gap-2 text-[13px]">
                  <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />
                  SMS opted-in guardians of absentees ({absentees.filter((s) => s.smsOptIn).length})
                </label>
                <div className="flex gap-2">
                  {editing && <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>}
                  <Button size="sm" onClick={() => editing ? setCorrect(true) : confirm()}><Lock className="size-4" /> {editing ? 'Save correction' : 'Confirm attendance'}</Button>
                </div>
              </div>
            }
          </div>
        </Panel>
      </div>

      <Panel title="Needs attention" description="AY attendance below 80% · pattern detection" flush actions={<AlertTriangle className="size-4 text-warning" />}>
        {chronic.length === 0 ? <p className="px-4 py-3 text-xs text-muted-foreground">No students below threshold.</p> :
        <ul className="divide-y divide-border">
            {chronic.map((s) =>
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[13px]">
                <PersonCell name={s.name} sub={`${sectionLabel(s.sectionId)} · Roll ${s.roll} · guardian ${s.guardianPhone}`} />
                <span className="flex items-center gap-2">
                  <b className="text-danger tabular">{s.attendancePct}%</b>
                  <Button size="xs" variant="outline" disabled={!s.smsOptIn} onClick={() => {queueMessage({ channel: 'SMS', audience: `Guardian of ${s.name}`, recipients: 1, template: 'Custom', body: 'Attendance concern — please contact the class teacher.', credits: 1 });toast.success('Guardian notified');}}><MessageSquare className="size-3.5" /> Notify</Button>
                </span>
              </li>
          )}
          </ul>
        }
      </Panel>

      <ConfirmDialog
        open={correct}
        onOpenChange={setCorrect}
        title={editing ? 'Save attendance correction' : 'Correct confirmed attendance?'}
        description={editing ? 'The original marks stay in history.' : 'You can change marks, then save with a reason.'}
        confirmLabel={editing ? 'Save correction' : 'Start correction'}
        reasonLabel={editing ? 'Reason for correction' : undefined}
        onConfirm={(reason) => editing ? confirm(reason) : setEditing(true)} />
      
    </div>);

}
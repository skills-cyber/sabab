import { useCallback, useMemo, useState } from 'react';
import { applications as seedApps, enquiries as seedEnq, seatPlans as seedSeats, testSlots, docTemplate, ADMISSION_FEE } from '../../data/admissions';
import { sections } from '../../data/school';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import type { AdmissionDoc, AdmissionStage, Application, Enquiry, SeatPlan } from '../../types/admissions';
import type { TimelineEntry } from '../../types/academic';
import { TODAY, formatBDT, nowStamp } from '../../utils/format';

export type NewApplication = Pick<Application, 'applicant' | 'applicantBn' | 'gender' | 'dob' | 'grade' | 'campusId' | 'previousSchool' | 'guardianName' | 'guardianRelation' | 'guardianPhone' | 'source' | 'note'> & {formFeePaid: boolean;};

/** Is every required document verified? */
export const docsComplete = (a: Application) => a.docs.filter((d) => d.required).every((d) => d.status === 'verified');

export const seatKey = (grade: number, campusId: string) => `${grade}-${campusId}`;

/**
 * Local-state admissions store (frontend contract for a future /admissions API).
 * Every write appends to the application history and the platform audit log.
 */
export function useAdmissions() {
  const { addStudent, students, addAudit, queueMessage } = useAdmin();
  const { roleInfo } = useApp();
  const [apps, setApps] = useState<Application[]>(seedApps);
  const [enquiries, setEnquiries] = useState<Enquiry[]>(seedEnq);
  const [seats, setSeats] = useState<SeatPlan[]>(seedSeats);
  const actor = roleInfo.user;

  const log = useCallback((id: string, action: string, tone?: TimelineEntry['tone'], note?: string, patch: Partial<Application> = {}) => {
    setApps((list) => list.map((a) => a.id === id ? { ...a, ...patch, history: [...a.history, { at: nowStamp(), actor, action, tone, note }] } : a));
    addAudit('Admissions', action, id, tone === 'danger' || tone === 'warning' ? 'warning' : 'info');
  }, [actor, addAudit]);

  const seatStats = useMemo(() => {
    const m: Record<string, {seats: number;applied: number;offered: number;admitted: number;waitlisted: number;}> = {};
    seats.forEach((s) => m[seatKey(s.grade, s.campusId)] = { seats: s.seats, applied: 0, offered: 0, admitted: 0, waitlisted: 0 });
    apps.forEach((a) => {
      const k = seatKey(a.grade, a.campusId);
      if (!m[k]) m[k] = { seats: 0, applied: 0, offered: 0, admitted: 0, waitlisted: 0 };
      if (a.stage !== 'withdrawn') m[k].applied += 1;
      if (a.stage === 'offered') m[k].offered += 1;
      if (a.stage === 'admitted') m[k].admitted += 1;
      if (a.stage === 'waitlisted') m[k].waitlisted += 1;
    });
    return m;
  }, [apps, seats]);

  const seatsLeft = (grade: number, campusId: string) => {
    const s = seatStats[seatKey(grade, campusId)];
    return s ? s.seats - s.offered - s.admitted : 0;
  };

  const addApplication = (f: NewApplication) => {
    const id = `APP-2027-${String(43 + apps.length - seedApps.length).padStart(3, '0')}`;
    const sib = students.find((s) => s.guardianPhone.replace(/\D/g, '') === f.guardianPhone.replace(/\D/g, ''));
    const app: Application = {
      ...f, id, appliedOn: TODAY, stage: 'applied', docs: docTemplate(), admissionFeePaid: false,
      siblingOf: sib ? `${sib.name}` : undefined,
      history: [{ at: nowStamp(), actor, action: f.formFeePaid ? 'Application received · form fee paid' : 'Application received · form fee pending', tone: f.formFeePaid ? undefined : 'warning' }]
    };
    setApps((l) => [app, ...l]);
    addAudit('Admissions', 'Application created', `${id} ${f.applicant}`);
    return id;
  };

  const setDoc = (id: string, key: AdmissionDoc['key'], status: AdmissionDoc['status']) => {
    const a = apps.find((x) => x.id === id);
    if (!a) return;
    const label = a.docs.find((d) => d.key === key)?.label ?? key;
    log(id, `Document ${status}: ${label}`, status === 'verified' ? 'success' : undefined, undefined, { docs: a.docs.map((d) => d.key === key ? { ...d, status } : d) });
  };

  const payFormFee = (id: string) => log(id, 'Form fee ৳500 received', 'success', undefined, { formFeePaid: true });

  const assignTest = (id: string, slotId: string) => {
    const slot = testSlots.find((t) => t.id === slotId);
    const a = apps.find((x) => x.id === id);
    log(id, `Test slot ${slotId} assigned · admit card SMS sent`, 'info', undefined, { testSlotId: slotId, stage: 'test-scheduled' });
    if (a && slot) queueMessage({ channel: 'SMS', audience: `Guardian of ${a.applicant}`, recipients: 1, template: 'Admission test admit card', body: `Admission test for ${a.applicant}: ${slot.date} ${slot.time}, ${slot.room}. Bring admit card.`, credits: 1 });
  };

  const recordScore = (id: string, score: number) => log(id, `Admission test score recorded · ${score}/100`, 'info', undefined, { score, stage: 'tested' });

  const decide = (id: string, stage: Extract<AdmissionStage, 'offered' | 'waitlisted' | 'rejected'>, note: string) => {
    const a = apps.find((x) => x.id === id);
    const label = stage === 'offered' ? 'Offer approved · SMS sent to guardian' : stage === 'waitlisted' ? 'Waitlisted' : 'Not offered';
    log(id, label, stage === 'offered' ? 'success' : stage === 'waitlisted' ? 'warning' : 'danger', note || undefined, { stage });
    if (a && stage === 'offered') queueMessage({ channel: 'SMS', audience: `Guardian of ${a.applicant}`, recipients: 1, template: 'Admission offer', body: `${a.applicant} is offered admission to Class ${a.grade}. Pay admission fee ${formatBDT(ADMISSION_FEE)} within 7 days.`, credits: 1 });
  };

  const payAdmissionFee = (id: string, method: string) => log(id, `Admission fee ${formatBDT(ADMISSION_FEE)} received · ${method}`, 'success', undefined, { admissionFeePaid: true });

  /** Creates the student record. Returns the placement label for feedback. */
  const admit = (id: string, sectionId?: string) => {
    const a = apps.find((x) => x.id === id);
    if (!a) return null;
    const sec = sections.find((s) => s.id === sectionId) ?? sections.find((s) => s.grade === a.grade && s.campusId === a.campusId);
    const n = students.length + 1;
    const studentId = `SN-ADM-${id.slice(-3)}`;
    addStudent({
      id: studentId, studentNo: `2027-${String(n).padStart(4, '0')}`, name: a.applicant, nameBn: a.applicantBn, roll: sec ? students.filter((s) => s.sectionId === sec.id && s.status === 'active').length + 1 : 0,
      sectionId: sec?.id ?? '6A', campusId: a.campusId, gender: a.gender, dob: a.dob, guardianName: a.guardianName, guardianRelation: a.guardianRelation, guardianPhone: a.guardianPhone,
      guardianVerified: false, smsOptIn: true, attendancePct: 0, status: sec ? 'active' : 'admission-pending', siblingIds: [], remarks: `Admitted via ${a.id}${a.siblingOf ? ` · sibling of ${a.siblingOf}` : ''}`, admittedOn: '2026-11-02', transport: false
    });
    log(id, `Admitted · student record ${studentId} created${sec ? ` in ${sec.label}` : ' (section to be assigned)'}`, 'success', undefined, { stage: 'admitted', studentId });
    return sec?.label ?? null;
  };

  const withdraw = (id: string, reason: string) => log(id, 'Withdrawn', 'warning', reason, { stage: 'withdrawn' });
  const reopen = (id: string) => log(id, 'Re-opened for review', 'info', undefined, { stage: 'applied' });
  const updateNote = (id: string, note: string) => setApps((l) => l.map((a) => a.id === id ? { ...a, note } : a));

  const addEnquiry = (e: Omit<Enquiry, 'id' | 'status'>) => {
    const id = `ENQ-${119 + enquiries.length - seedEnq.length}`;
    setEnquiries((l) => [{ ...e, id, status: 'new' }, ...l]);
    addAudit('Admissions', 'Enquiry logged', `${id} ${e.name}`);
    return id;
  };
  const updateEnquiry = (id: string, patch: Partial<Enquiry>) => setEnquiries((l) => l.map((e) => e.id === id ? { ...e, ...patch } : e));

  const setSeatCount = (grade: number, campusId: string, n: number) => {
    setSeats((l) => l.some((s) => s.grade === grade && s.campusId === campusId) ? l.map((s) => s.grade === grade && s.campusId === campusId ? { ...s, seats: n } : s) : [...l, { grade, campusId, seats: n }]);
    addAudit('Admissions', 'Seat plan changed', `Class ${grade} · ${campusId} → ${n}`, 'warning');
  };

  return {
    apps, enquiries, seats, seatStats, seatsLeft, testSlots,
    addApplication, setDoc, payFormFee, assignTest, recordScore, decide, payAdmissionFee, admit, withdraw, reopen, updateNote,
    addEnquiry, updateEnquiry, setSeatCount
  };
}

export type AdmissionsStore = ReturnType<typeof useAdmissions>;
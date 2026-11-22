import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, CalendarClock, CheckCircle2, Clock3, FileCheck2, FileWarning, GraduationCap, Printer, Receipt, Undo2, UserX, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { UnderlineTabs } from '../common/UnderlineTabs';
import { StatusBadge } from '../common/StatusBadge';
import { Stepper } from '../common/Stepper';
import { Notice } from '../common/Notice';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { ApprovalTimeline } from '../common/ApprovalTimeline';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Avatar } from '../common/PersonCell';
import { campuses, sections } from '../../data/school';
import { ADMISSION_FEE } from '../../data/admissions';
import type { AdmissionDoc, Application } from '../../types/admissions';
import { docsComplete, type AdmissionsStore } from './useAdmissions';
import { formatBDT, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

const FLOW = [
{ id: 'applied', label: 'Applied' },
{ id: 'test-scheduled', label: 'Test' },
{ id: 'tested', label: 'Scored' },
{ id: 'offered', label: 'Offered' },
{ id: 'admitted', label: 'Admitted' }];


const Row = ({ k, v }: {k: string;v: React.ReactNode;}) =>
<div className="flex justify-between gap-3 border-b border-border py-1.5 text-[13px] last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;


interface Props {
  app: Application | null;
  store: AdmissionsStore;
  canEdit: boolean;
  canDecide: boolean;
  onOpenChange: (o: boolean) => void;
}

/** Application drawer: lifecycle stepper, documents, test, fees, decision and full history. */
export function ApplicationSheet({ app, store, canEdit, canDecide, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [slot, setSlot] = useState('');
  const [score, setScore] = useState('');
  const [method, setMethod] = useState<'Cash' | 'bKash' | 'Bank'>('Cash');
  const [section, setSection] = useState('');
  const [confirm, setConfirm] = useState<null | 'offered' | 'waitlisted' | 'rejected' | 'withdraw'>(null);

  useEffect(() => {
    if (!app) return;
    setTab('overview');
    setScore(app.score != null ? String(app.score) : '');
    const slots = store.testSlots.filter((t) => t.grade === app.grade && t.campusId === app.campusId && t.date >= '2026-11-02');
    setSlot(slots[0]?.id ?? '');
    setSection(sections.find((s) => s.grade === app.grade && s.campusId === app.campusId)?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.id]);

  const a = app;
  const docsOk = a ? docsComplete(a) : false;
  const slotInfo = a?.testSlotId ? store.testSlots.find((t) => t.id === a.testSlotId) : undefined;
  const open = a ? !['admitted', 'rejected', 'withdrawn'].includes(a.stage) : false;
  const seatsLeft = a ? store.seatsLeft(a.grade, a.campusId) : 0;
  const slotOptions = a ? store.testSlots.filter((t) => t.grade === a.grade && t.campusId === a.campusId && t.date >= '2026-11-02').map((t) => ({ value: t.id, label: `${t.id} · ${formatDate(t.date, 'd MMM')} ${t.time} · ${t.room}` })) : [];
  const sectionOptions = a ? sections.filter((s) => s.grade === a.grade && s.campusId === a.campusId).map((s) => ({ value: s.id, label: s.label })) : [];
  const missingDocs = a ? a.docs.filter((d) => d.required && d.status !== 'verified').length : 0;
  const passMark = slotInfo?.passMark ?? 50;
  const noTest = a?.grade === 1;

  const saveScore = () => {
    const n = Number(score);
    if (!a || !Number.isFinite(n) || n < 0 || n > 100 || score === '') return toast.error('Score must be 0–100');
    store.recordScore(a.id, n);
    toast.success(`Score ${n} recorded`, { description: n >= passMark ? 'Above pass mark — ready for decision.' : `Below pass mark (${passMark}).` });
  };

  const stepCurrent = a ? a.stage === 'waitlisted' ? 'tested' : ['rejected', 'withdrawn'].includes(a.stage) ? a.score != null ? 'tested' : 'applied' : a.stage : 'applied';

  return (
    <>
      <Sheet open={!!a} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {a &&
          <>
              <SheetHeader className="border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar name={a.applicant} size="md" />
                  <div className="min-w-0">
                    <SheetTitle className="truncate">{a.applicant} <span lang="bn" className="font-bn text-sm font-normal text-muted-foreground">{a.applicantBn}</span></SheetTitle>
                    <SheetDescription>{a.id} · Class {a.grade} · {campuses.find((c) => c.id === a.campusId)?.short} · applied {formatDate(a.appliedOn, 'd MMM')}</SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <StatusBadge status={a.stage} />
                  {a.siblingOf && <StatusBadge status="info" label="Sibling" />}
                  {!a.formFeePaid && <StatusBadge status="unpaid" label="Form fee due" />}
                  {missingDocs > 0 && open && <StatusBadge status="needs-review" label={`${missingDocs} doc${missingDocs > 1 ? 's' : ''} pending`} />}
                </div>
                <Stepper steps={FLOW} current={stepCurrent} className="pt-2" />
              </SheetHeader>

              <div className="px-4 pt-2">
                <UnderlineTabs layoutId="app-sheet-tabs" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'docs', label: 'Documents', count: missingDocs || undefined }, { id: 'history', label: 'History', count: a.history.length }]} />
              </div>

              <div className="flex-1 space-y-4 p-4">
                {tab === 'overview' &&
              <>
                    {a.stage === 'rejected' && <Notice kind="error">Not offered. Guardian was informed by SMS.</Notice>}
                    {a.stage === 'withdrawn' && <Notice kind="info">Withdrawn by guardian{a.history.at(-1)?.note ? ` — “${a.history.at(-1)?.note}”` : ''}.</Notice>}
                    {a.stage === 'admitted' &&
                <Notice kind="success" action={<Button size="xs" variant="outline" onClick={() => navigate(`/students?id=${a.studentId}`)}><GraduationCap className="size-3.5" /> Open student</Button>}>Admitted — student record {a.studentId} created.</Notice>
                }

                    {/* Next action card — one clear primary step per stage */}
                    {open && canEdit &&
                <section className="rounded-lg border border-primary/30 bg-accent/40 p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-accent-foreground"><Clock3 className="size-3.5" /> Next step</p>
                        {!a.formFeePaid ?
                  <div className="flex items-center justify-between gap-2 text-[13px]"><span>Collect form fee ৳500 before processing.</span><Button size="sm" onClick={() => {store.payFormFee(a.id);toast.success('Form fee received');}}><Receipt className="size-4" /> Mark paid</Button></div> :
                  a.stage === 'applied' && !noTest ?
                  <div className="space-y-2">
                            <p className="text-[13px]">Assign an admission test slot — the guardian gets an admit-card SMS.</p>
                            {slotOptions.length ?
                    <div className="flex gap-2"><SelectField size="sm" className="flex-1" ariaLabel="Test slot" value={slot} onValueChange={setSlot} options={slotOptions} /><Button size="sm" disabled={!slot} onClick={() => {store.assignTest(a.id, slot);toast.success(`Test ${slot} assigned`, { description: 'Admit card SMS queued.' });}}><CalendarClock className="size-4" /> Assign</Button></div> :

                    <p className="text-[12px] text-warning">No upcoming test slot for this class — create one in the Admission tests tab.</p>
                    }
                          </div> :
                  a.stage === 'test-scheduled' ?
                  <div className="space-y-2">
                            <p className="text-[13px]">Enter the test score out of 100 (pass mark {passMark}).</p>
                            <div className="flex gap-2"><Input aria-label="Test score" type="number" min={0} max={100} className="h-8 w-24 text-right tabular" value={score} onChange={(e) => setScore(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveScore()} /><Button size="sm" onClick={saveScore}>Save score</Button></div>
                          </div> :
                  a.stage === 'tested' || a.stage === 'waitlisted' || a.stage === 'applied' && noTest ?
                  <div className="space-y-2">
                            <p className="text-[13px]">{a.score != null ? <>Scored <b className="tabular">{a.score}</b> · pass mark {passMark}. </> : 'Lottery / interview admission. '}<span className={seatsLeft > 0 ? 'text-success' : 'text-danger'}>{seatsLeft > 0 ? `${seatsLeft} seat${seatsLeft > 1 ? 's' : ''} left` : 'No seats left'}</span></p>
                            {!canDecide && <p className="text-[12px] text-muted-foreground">Offer decisions need the principal or owner.</p>}
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" disabled={!canDecide || seatsLeft <= 0 || !docsOk} onClick={() => setConfirm('offered')}><CheckCircle2 className="size-4" /> Offer seat</Button>
                              {a.stage !== 'waitlisted' && <Button size="sm" variant="outline" disabled={!canDecide} onClick={() => setConfirm('waitlisted')}>Waitlist</Button>}
                              <Button size="sm" variant="ghost" className="text-danger hover:text-danger" disabled={!canDecide} onClick={() => setConfirm('rejected')}>Not offer</Button>
                            </div>
                            {!docsOk && <p className="text-[11.5px] text-warning">Verify all required documents before offering a seat.</p>}
                          </div> :
                  a.stage === 'offered' ?
                  <div className="space-y-2.5">
                            {!a.admissionFeePaid ?
                    <>
                                <p className="text-[13px]">Collect admission fee <b>{formatBDT(ADMISSION_FEE)}</b>{a.siblingOf ? ' (sibling discount applies to tuition, not admission fee)' : ''}.</p>
                                <div className="flex flex-wrap items-center gap-2"><Segmented size="sm" ariaLabel="Payment method" value={method} onChange={setMethod} options={[{ value: 'Cash', label: 'Cash' }, { value: 'bKash', label: 'bKash' }, { value: 'Bank', label: 'Bank' }]} /><Button size="sm" onClick={() => {store.payAdmissionFee(a.id, method);toast.success('Admission fee received', { description: `${formatBDT(ADMISSION_FEE)} · ${method} · receipt queued` });}}><Receipt className="size-4" /> Record payment</Button></div>
                              </> :

                    <>
                                <p className="text-[13px]">Fee received. Choose a section and confirm admission — this creates the student record.</p>
                                <div className="flex gap-2">
                                  {sectionOptions.length ? <SelectField size="sm" className="flex-1" ariaLabel="Section" value={section} onValueChange={setSection} options={sectionOptions} /> : <span className="flex-1 self-center text-[12px] text-muted-foreground">No section yet — placed as “admission pending”.</span>}
                                  <Button size="sm" onClick={() => {const placed = store.admit(a.id, section);toast.success(`${a.applicant} admitted`, { description: placed ? `Placed in ${placed}. Guardian OTP invite queued.` : 'Assign a section from Students.' });}}><BadgeCheck className="size-4" /> Confirm admission</Button>
                                </div>
                              </>
                    }
                          </div> :
                  null}
                      </section>
                }

                    <dl>
                      <Row k="Date of birth" v={formatDate(a.dob)} />
                      <Row k="Gender" v={a.gender === 'F' ? 'Female' : 'Male'} />
                      <Row k="Previous school" v={a.previousSchool || '—'} />
                      <Row k="Guardian" v={`${a.guardianName} (${a.guardianRelation})`} />
                      <Row k="Mobile" v={<span className="tabular">{a.guardianPhone}</span>} />
                      <Row k="Source" v={a.source} />
                      {a.siblingOf && <Row k="Sibling" v={<span className="inline-flex items-center gap-1"><Users className="size-3.5 text-primary" /> {a.siblingOf}</span>} />}
                      <Row k="Admission test" v={slotInfo ? `${slotInfo.id} · ${formatDate(slotInfo.date, 'd MMM')} ${slotInfo.time}` : noTest ? 'Lottery (Class 1)' : 'Not assigned'} />
                      <Row k="Score" v={a.score != null ? <span className={cn('tabular', a.score < passMark && 'text-danger')}>{a.score}/100</span> : '—'} />
                      <Row k="Form fee" v={a.formFeePaid ? <span className="text-success">Paid</span> : <span className="text-warning">Due</span>} />
                      <Row k="Admission fee" v={a.admissionFeePaid ? <span className="text-success">Paid</span> : '—'} />
                    </dl>
                    <div>
                      <label htmlFor="app-note" className="text-[12px] font-medium text-muted-foreground">Office note</label>
                      <Input id="app-note" disabled={!canEdit} defaultValue={a.note} key={a.id} onBlur={(e) => e.target.value !== a.note && (store.updateNote(a.id, e.target.value), toast.success('Note saved'))} className="mt-1" placeholder="Add a note…" />
                    </div>
                  </>
              }

                {tab === 'docs' &&
              <ul className="divide-y divide-border rounded-lg border border-border">
                    {a.docs.map((d) =>
                <li key={d.key} className="flex items-center gap-3 px-3 py-2.5">
                        {d.status === 'verified' ? <FileCheck2 className="size-4 shrink-0 text-success" /> : <FileWarning className={cn('size-4 shrink-0', d.required ? 'text-warning' : 'text-subtle')} />}
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium">{d.label}</p>
                          <p className="text-[11px] text-muted-foreground">{d.required ? 'Required' : 'Optional'}</p>
                        </div>
                        <Segmented<AdmissionDoc['status']>
                    size="sm"
                    ariaLabel={`${d.label} status`}
                    value={d.status}
                    onChange={(v) => {if (!canEdit || !open) return;store.setDoc(a.id, d.key, v);}}
                    options={[{ value: 'missing', label: 'Missing' }, { value: 'received', label: 'Received' }, { value: 'verified', label: 'Verified' }]} />
                  
                      </li>
                )}
                  </ul>
              }

                {tab === 'history' && <ApprovalTimeline entries={[...a.history].reverse()} />}
              </div>

              <SheetFooter className="flex-row flex-wrap justify-between gap-2">
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="size-4" /> {a.testSlotId && a.stage === 'test-scheduled' ? 'Admit card' : 'Print form'}</Button>
                <div className="flex gap-2">
                  {(a.stage === 'rejected' || a.stage === 'withdrawn') && canDecide && <Button size="sm" variant="outline" onClick={() => {store.reopen(a.id);toast.success('Re-opened');}}><Undo2 className="size-4" /> Re-open</Button>}
                  {open && canEdit && <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => setConfirm('withdraw')}><UserX className="size-4" /> Withdraw</Button>}
                </div>
              </SheetFooter>
            </>
          }
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirm && !!a}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm === 'offered' ? `Offer a seat to ${a?.applicant}?` : confirm === 'waitlisted' ? `Waitlist ${a?.applicant}?` : confirm === 'rejected' ? `Not offer ${a?.applicant}?` : `Withdraw ${a?.applicant}'s application?`}
        description={confirm === 'offered' ? `Uses 1 of ${seatsLeft} remaining seats. Guardian gets an SMS to pay ${formatBDT(ADMISSION_FEE)} within 7 days.` : confirm === 'waitlisted' ? 'The applicant is offered automatically-ranked waitlist position; you can offer later if a seat frees up.' : confirm === 'rejected' ? 'Guardian is informed by SMS. You can re-open later if needed.' : 'The application closes. Fees already paid are refunded per school policy (handled in Fees).'}
        confirmLabel={confirm === 'offered' ? 'Offer seat' : confirm === 'waitlisted' ? 'Waitlist' : confirm === 'rejected' ? 'Not offer' : 'Withdraw'}
        destructive={confirm === 'rejected' || confirm === 'withdraw'}
        reasonLabel={confirm === 'offered' ? undefined : 'Reason'}
        onConfirm={(r) => {
          if (!a || !confirm) return;
          if (confirm === 'withdraw') {store.withdraw(a.id, r);toast.success('Application withdrawn');} else
          {store.decide(a.id, confirm, r);toast.success(confirm === 'offered' ? 'Seat offered · SMS queued' : confirm === 'waitlisted' ? 'Added to waitlist' : 'Decision recorded');}
          setConfirm(null);
        }} />
      
    </>);

}
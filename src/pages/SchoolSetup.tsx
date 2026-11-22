import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CloudCheck, Loader2, Rocket, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Notice } from '../components/common/Notice';
import { Button } from '../components/ui/Button';
import { SETUP_STEPS, useSetupWizard } from '../components/setup/useSetupWizard';
import { InstitutionStep } from '../components/setup/InstitutionStep';
import { CampusYearStep } from '../components/setup/CampusYearStep';
import { ClassesStep } from '../components/setup/ClassesStep';
import { SubjectsFeesStep } from '../components/setup/SubjectsFeesStep';
import { ImportStep } from '../components/setup/ImportStep';
import { ReviewStep } from '../components/setup/ReviewStep';
import { useApp } from '../contexts/AppContext';
import { cn } from '../utils/cn';

const stepMotion = {
  enter: (d: number) => ({ opacity: 0, x: d * 16 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit: (d: number) => ({ opacity: 0, x: d * -16, transition: { duration: 0.14, ease: 'easeIn' } })
};

/** School Setup — resumable 6-step onboarding wizard (Workflow 1). */
export function SchoolSetup() {
  const w = useSetupWizard();
  const { draft, update } = w;
  const { role } = useApp();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const [activating, setActivating] = useState(false);
  const canEdit = role === 'owner' || role === 'principal';
  const step = SETUP_STEPS[w.index];
  const allDone = SETUP_STEPS.filter((s) => s.id !== 'review').every((s) => w.completed.includes(s.id));
  const pct = Math.round(w.completed.length / (SETUP_STEPS.length - 1) * 100);

  const activate = () => {
    setActivating(true);
    window.setTimeout(() => {
      setActivating(false);
      update('activated', true);
      toast.success('School activated', { description: 'Dashboards, guardian OTP invites and the academic year are now live (prototype).' });
    }, 900);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="School Setup"
        bn="স্কুল সেটআপ"
        description="Create the institution, campuses, academic year, classes, subjects, fees and roster — saved as a resumable draft."
        actions={
        <>
            <span className="hidden items-center gap-1.5 text-[11.5px] text-muted-foreground sm:inline-flex" aria-live="polite">
              <CloudCheck className="size-3.5" /> {draft.savedAt ? `Draft saved ${draft.savedAt}` : 'Not saved yet'}
            </span>
            <Button size="sm" variant="ghost" disabled={!canEdit} onClick={() => setConfirmReset(true)}><Trash2 className="size-4" /> Discard draft</Button>
          </>
        } />
      

      {!canEdit && <Notice kind="warning">Read-only — only the owner or principal can change school setup.</Notice>}

      {draft.activated ?
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-bg text-success"><Check className="size-6" /></span>
          <h2 className="mt-3 text-base font-semibold">{draft.institution.name} is live</h2>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">Academic year {draft.year.label} is active. Next: build the routine and publish the annual plan.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => navigate('/timetable')}>Open timetable</Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/planner/calendar')}>Academic planner</Button>
            <Button size="sm" variant="ghost" onClick={() => update('activated', false)}>Back to setup</Button>
          </div>
        </motion.section> :

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Setup steps" className="rounded-xl border border-border bg-card p-2 lg:self-start">
            <div className="px-2 pb-2 pt-1">
              <div className="flex items-center justify-between text-[11.5px] text-muted-foreground"><span>Progress</span><span className="tabular">{pct}%</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} />
              </div>
            </div>
            <ol className="flex gap-1 overflow-x-auto scrollbar-thin lg:flex-col">
              {SETUP_STEPS.map((s, i) => {
              const done = w.completed.includes(s.id);
              const current = s.id === draft.step;
              return (
                <li key={s.id} className="shrink-0">
                    <button type="button" onClick={() => w.goTo(s.id)} aria-current={current ? 'step' : undefined} className={cn('flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors', current ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                      <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border text-[10.5px] font-semibold tabular transition-colors', done ? 'border-success bg-success text-white' : current ? 'border-primary text-primary' : 'border-border')}>{done ? <Check className="size-3" /> : i + 1}</span>
                      <span className="whitespace-nowrap">{s.label}</span>
                    </button>
                  </li>);

            })}
            </ol>
          </nav>

          <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">Step {w.index + 1} of {SETUP_STEPS.length}</p>
                <h2 className="text-[15px] font-semibold">{step.label} <span lang="bn" className="font-bn text-[12px] font-normal text-muted-foreground">{step.bn}</span></h2>
              </div>
            </header>
            <fieldset disabled={!canEdit} className="min-w-0">
              <AnimatePresence mode="wait" custom={w.dir} initial={false}>
                <motion.div key={draft.step} custom={w.dir} variants={stepMotion} initial="enter" animate="center" exit="exit" className="p-4">
                  {draft.step === 'institution' && <InstitutionStep draft={draft} errors={w.errors} onChange={(v) => update('institution', v)} />}
                  {draft.step === 'campuses' && <CampusYearStep draft={draft} errors={w.errors} onCampuses={(v) => update('campuses', v)} onYear={(v) => update('year', v)} />}
                  {draft.step === 'classes' && <ClassesStep draft={draft} errors={w.errors} onGrades={(v) => update('grades', v)} onTeachers={(v) => update('classTeachers', v)} />}
                  {draft.step === 'subjects' && <SubjectsFeesStep draft={draft} errors={w.errors} onSubjects={(v) => update('subjects', v)} onFees={(v) => update('fees', v)} />}
                  {draft.step === 'import' && <ImportStep draft={draft} errors={w.errors} onChange={(p) => w.setDraft((d) => ({ ...d, ...p }))} />}
                  {draft.step === 'review' && <ReviewStep draft={draft} completed={w.completed} onEdit={w.goTo} />}
                </motion.div>
              </AnimatePresence>
            </fieldset>
            <footer className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-4 py-3">
              <Button size="sm" variant="outline" disabled={w.index === 0} onClick={w.back}><ArrowLeft className="size-4" /> Back</Button>
              {draft.step === 'review' ?
            <Button size="sm" disabled={!allDone || activating || !canEdit} onClick={activate}>
                  {activating ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />} Activate school
                </Button> :

            <Button size="sm" onClick={w.next}>Continue <ArrowRight className="size-4" /></Button>
            }
            </footer>
          </section>
        </div>
      }

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Discard setup draft?"
        description="All entered setup details and the validated roster will be cleared. This cannot be undone."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          w.reset();
          setConfirmReset(false);
        }} />
      
    </div>);

}
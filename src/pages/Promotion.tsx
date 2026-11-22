import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Stepper } from '../components/common/Stepper';
import { StudentsNav } from '../components/students/StudentsNav';
import { usePromotion, STEPS } from '../components/promotion/usePromotion';
import { PrepareStep } from '../components/promotion/PrepareStep';
import { ReviewStep } from '../components/promotion/ReviewStep';
import { PreviewStep } from '../components/promotion/PreviewStep';
import { ConfirmStep } from '../components/promotion/ConfirmStep';
import { RolloverDone } from '../components/promotion/RolloverDone';
import { useAdmin } from '../contexts/AdminContext';

/** Students › Promotion — year-end review and academic-year rollover. */
export function Promotion() {
  const { lastRollover } = useAdmin();
  const store = usePromotion();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        bn="শিক্ষার্থী"
        description={lastRollover ? `AY ${lastRollover.toYear} started · promotion complete` : `Year-end promotion · AY ${store.currentYear} → ${store.nextYear}`} />
      
      <StudentsNav />
      {lastRollover ? <RolloverDone summary={lastRollover} /> :
      <>
          <Stepper steps={STEPS} current={store.step} />
          {store.step === 'prepare' && <PrepareStep store={store} />}
          {store.step === 'review' && <ReviewStep store={store} />}
          {store.step === 'preview' && <PreviewStep store={store} />}
          {store.step === 'confirm' && <ConfirmStep store={store} />}
        </>
      }
    </div>);

}
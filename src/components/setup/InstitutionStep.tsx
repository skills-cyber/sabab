import React from 'react';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { Input } from '../ui/Input';
import { boardOptions } from '../../data/setupTemplates';
import type { SetupDraft, SetupInstitution } from '../../types/setup';

interface Props {
  draft: SetupDraft;
  errors: Record<string, string>;
  onChange: (v: SetupInstitution) => void;
}

/** Step 1 — institution identity, board and contact. */
export function InstitutionStep({ draft, errors, onChange }: Props) {
  const i = draft.institution;
  const set = <K extends keyof SetupInstitution,>(k: K, v: SetupInstitution[K]) => onChange({ ...i, [k]: v });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Institution name" bn="প্রতিষ্ঠানের নাম" required error={errors.name} htmlFor="su-name" className="sm:col-span-2">
        <Input id="su-name" value={i.name} onChange={(e) => set('name', e.target.value)} />
      </Field>
      <Field label="Name in Bangla" htmlFor="su-bn" className="sm:col-span-2">
        <Input id="su-bn" lang="bn" className="font-bn" value={i.bn} onChange={(e) => set('bn', e.target.value)} />
      </Field>
      <Field label="Institution type" className="sm:col-span-2">
        <Segmented
          ariaLabel="Institution type"
          value={i.type}
          onChange={(v) => set('type', v)}
          className="max-w-full overflow-x-auto"
          options={[
          { value: 'school', label: 'School' },
          { value: 'school-college', label: 'School & College' },
          { value: 'madrasa', label: 'Madrasa' },
          { value: 'english-medium', label: 'English medium' }]
          } />
        
      </Field>
      <Field label="EIIN" required error={errors.eiin} hint="6-digit Educational Institution ID" htmlFor="su-eiin">
        <Input id="su-eiin" inputMode="numeric" maxLength={6} value={i.eiin} onChange={(e) => set('eiin', e.target.value.replace(/\D/g, ''))} placeholder="123456" className="tabular" />
      </Field>
      <Field label="Education board" htmlFor="su-board">
        <SelectField id="su-board" value={i.board} onValueChange={(v) => set('board', v)} options={boardOptions.map((b) => ({ value: b, label: b }))} />
      </Field>
      <Field label="Office phone" htmlFor="su-phone">
        <Input id="su-phone" value={i.phone} onChange={(e) => set('phone', e.target.value)} />
      </Field>
      <Field label="Office email" required error={errors.email} htmlFor="su-email">
        <Input id="su-email" type="email" value={i.email} onChange={(e) => set('email', e.target.value)} />
      </Field>
      <Field label="Address" htmlFor="su-addr" className="sm:col-span-2">
        <Input id="su-addr" value={i.address} onChange={(e) => set('address', e.target.value)} />
      </Field>
    </div>);

}
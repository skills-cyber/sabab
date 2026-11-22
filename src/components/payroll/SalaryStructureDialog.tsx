import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { useStaff } from '../../contexts/StaffContext';
import type { PayLine, StaffMember } from '../../types/staff';
import { CURRENT_MONTH } from '../accounts/useAccounts';
import { formatBDT } from '../../utils/format';
import { nextMonth } from '../../utils/payroll';

type Line = PayLine & {raw: string;};

/** Effective-dated salary change: basic + allowance and deduction lines. Never touches approved sheets. */
export function SalaryStructureDialog({ person, onOpenChange }: {person: StaffMember | null;onOpenChange: (o: boolean) => void;}) {
  const { changeSalary } = useStaff();
  const [basic, setBasic] = useState('');
  const [allow, setAllow] = useState<Line[]>([]);
  const [ded, setDed] = useState<Line[]>([]);
  const [from, setFrom] = useState(nextMonth(CURRENT_MONTH));
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!person) return;
    setBasic(String(person.salary.basic));
    setAllow(person.salary.allowances.map((l) => ({ ...l, raw: String(l.amount) })));
    setDed(person.salary.deductions.map((l) => ({ ...l, raw: String(l.amount) })));
    setFrom(CURRENT_MONTH);
    setNote('');
    setErr(null);
  }, [person]);

  const sum = (l: Line[]) => l.reduce((s, x) => s + (Number(x.raw) || 0), 0);
  const gross = (Number(basic) || 0) + sum(allow);
  const net = gross - sum(ded);

  const lineEditor = (list: Line[], setList: (l: Line[]) => void, kind: string) =>
  <div className="space-y-2">
      {list.map((l, i) =>
    <div key={l.id} className="flex items-center gap-2">
          <Input aria-label={`${kind} label`} value={l.label} onChange={(e) => setList(list.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="h-8 flex-1" />
          <Input aria-label={`${kind} amount`} type="number" min={0} value={l.raw} onChange={(e) => setList(list.map((x, j) => j === i ? { ...x, raw: e.target.value } : x))} className="h-8 w-28 tabular" />
          <Button size="icon-sm" variant="ghost" aria-label={`Remove ${l.label}`} onClick={() => setList(list.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button>
        </div>
    )}
      <Button size="xs" variant="outline" onClick={() => setList([...list, { id: `${kind}-${Date.now().toString(36)}`, label: '', amount: 0, raw: '' }])}><Plus className="size-3.5" /> Add {kind}</Button>
    </div>;


  const save = () => {
    if (!person) return;
    if (!(Number(basic) > 0)) return setErr('Basic salary must be more than ৳0.');
    if ([...allow, ...ded].some((l) => !l.label.trim() || !(Number(l.raw) >= 0))) return setErr('Every line needs a label and an amount.');
    if (net < 0) return setErr('Deductions cannot exceed gross pay.');
    if (from < CURRENT_MONTH) return setErr('Changes cannot be backdated before the current month.');
    if (note.trim().length < 4) return setErr('Give a reason (e.g. “Annual increment 2027”).');
    const clean = (l: Line[]) => l.map(({ raw, ...x }) => ({ ...x, label: x.label.trim(), amount: Number(raw) || 0 }));
    changeSalary(person.id, { basic: Number(basic), allowances: clean(allow), deductions: clean(ded), effectiveFrom: from }, note.trim());
    toast.success(`Salary updated for ${person.name}`, { description: `Gross ${formatBDT(gross)} from ${from}. Approved sheets are unchanged.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={!!person} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Salary structure · {person?.name}</DialogTitle>
          <DialogDescription>{person?.designation} · current gross {person ? formatBDT(person.salary.basic + person.salary.allowances.reduce((s, l) => s + l.amount, 0)) : ''}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Basic (৳)" required htmlFor="ss-basic"><Input id="ss-basic" data-autofocus type="number" min={0} className="tabular" value={basic} onChange={(e) => setBasic(e.target.value)} /></Field>
            <Field label="Effective from" htmlFor="ss-from" hint="Applies to sheets from this month"><Input id="ss-from" type="month" min={CURRENT_MONTH} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          </div>
          <div><p className="mb-1.5 text-[12.5px] font-medium">Allowances</p>{lineEditor(allow, setAllow, 'allowance')}</div>
          <div><p className="mb-1.5 text-[12.5px] font-medium">Deductions</p>{lineEditor(ded, setDed, 'deduction')}</div>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border text-[12.5px]">
            <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Gross</dt><dd className="font-semibold tabular">{formatBDT(gross)}</dd></div>
            <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Deductions</dt><dd className="font-semibold tabular">−{formatBDT(sum(ded))}</dd></div>
            <div className="bg-card px-3 py-2"><dt className="text-muted-foreground">Net before leave/advance</dt><dd className="font-semibold tabular">{formatBDT(net)}</dd></div>
          </dl>
          <Field label="Reason" required htmlFor="ss-note"><Input id="ss-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annual increment, promotion…" /></Field>
          <Notice kind="info">Sheets already approved keep the old amounts. Draft sheets pick up the change only if regenerated.</Notice>
          {err && <p className="text-[11.5px] text-danger" role="alert">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save structure</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
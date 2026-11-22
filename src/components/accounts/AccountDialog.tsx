import React, { useEffect, useState } from 'react';
import { Banknote, Landmark, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Segmented } from '../common/Segmented';
import { useAccounts } from '../../contexts/AccountsContext';
import { campuses } from '../../data/school';
import type { AccountType, FinAccount } from '../../types/accounts';
import { TODAY } from '../../utils/format';
import { maskNumber } from './useAccounts';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Edit mode when set. Opening balance is locked once entries exist. */
  account?: FinAccount | null;
  onCreated?: (id: string) => void;
}

const blank = { type: 'bank' as AccountType, name: '', bank: '', branch: '', number: '', provider: 'bKash' as 'bKash' | 'Nagad', campusId: 'mirpur', opening: '0', openingDate: TODAY };

/** Add or edit a cash drawer, bank account or mobile wallet. */
export function AccountDialog({ open, onOpenChange, account, onCreated }: Props) {
  const store = useAccounts();
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  const editing = !!account;
  const hasEntries = account ? store.lines.some((l) => l.accountId === account.id || l.toAccountId === account.id) : false;

  useEffect(() => {
    if (!open) return;
    setErr({});
    setF(account ? { type: account.type, name: account.name, bank: account.bank ?? '', branch: account.branch ?? '', number: '', provider: account.provider ?? 'bKash', campusId: account.campusId, opening: String(account.opening), openingDate: account.openingDate } : blank);
  }, [open, account]);

  const set = <K extends keyof typeof f,>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = () => {
    const e: Record<string, string> = {};
    const name = f.name.trim();
    const opening = Number(f.opening);
    if (name.length < 3) e.name = 'Give the account a name (min 3 characters).';else
    if (store.accounts.some((a) => a.id !== account?.id && a.name.toLowerCase() === name.toLowerCase())) e.name = 'Another account already uses this name.';
    if (!Number.isFinite(opening) || opening < 0) e.opening = 'Opening balance cannot be negative.';
    if (f.type === 'bank' && f.bank.trim().length < 2) e.bank = 'Bank name is required.';
    const digits = f.number.replace(/\D/g, '');
    if (!editing || f.number) {
      if (f.type === 'bank' && digits.length < 8) e.number = 'Enter the full account number (8+ digits).';
      if (f.type === 'wallet' && !/^01[3-9]\d{8}$/.test(digits)) e.number = 'Enter the 11-digit wallet number.';
    }
    setErr(e);
    if (Object.keys(e).length) return;
    const payload = {
      name, type: f.type, campusId: f.campusId, opening, openingDate: f.openingDate,
      bank: f.type === 'bank' ? f.bank.trim() : undefined, branch: f.type === 'bank' ? f.branch.trim() || undefined : undefined,
      provider: f.type === 'wallet' ? f.provider : undefined,
      number: f.type === 'cash' ? undefined : f.number ? f.number.trim() : account?.number
    };
    if (account) {
      store.updateAccount(account.id, payload);
      toast.success('Account updated');
    } else {
      const id = store.addAccount(payload);
      toast.success(`${name} added`, { description: 'You can now record entries and transfers against it.' });
      onCreated?.(id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${account?.name}` : 'Add account'}</DialogTitle>
          <DialogDescription>Cash drawers, bank accounts and bKash/Nagad wallets. Account numbers are always shown masked.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Type">
            <Segmented
              ariaLabel="Account type"
              value={f.type}
              onChange={(v) => !editing && set('type', v)}
              options={[
              { value: 'cash', label: <span className="inline-flex items-center gap-1.5"><Banknote className="size-3.5" /> Cash</span> },
              { value: 'bank', label: <span className="inline-flex items-center gap-1.5"><Landmark className="size-3.5" /> Bank</span> },
              { value: 'wallet', label: <span className="inline-flex items-center gap-1.5"><Smartphone className="size-3.5" /> Mobile wallet</span> }]
              } />
            
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Account name" required error={err.name} htmlFor="ac-name" className="sm:col-span-2">
              <Input id="ac-name" data-autofocus value={f.name} onChange={(e) => set('name', e.target.value)} placeholder={f.type === 'bank' ? 'DBBL Current – Mirpur' : f.type === 'wallet' ? 'bKash merchant – Uttara' : 'Petty cash – Uttara'} />
            </Field>
            {f.type === 'bank' &&
            <>
                <Field label="Bank" required error={err.bank} htmlFor="ac-bank"><Input id="ac-bank" value={f.bank} onChange={(e) => set('bank', e.target.value)} placeholder="Dutch-Bangla Bank" /></Field>
                <Field label="Branch" htmlFor="ac-branch"><Input id="ac-branch" value={f.branch} onChange={(e) => set('branch', e.target.value)} placeholder="Mirpur 10" /></Field>
              </>
            }
            {f.type === 'wallet' &&
            <Field label="Provider" htmlFor="ac-prov"><SelectField id="ac-prov" value={f.provider} onValueChange={(v) => set('provider', v as 'bKash' | 'Nagad')} options={[{ value: 'bKash', label: 'bKash' }, { value: 'Nagad', label: 'Nagad' }]} /></Field>
            }
            {f.type !== 'cash' &&
            <Field
              label={f.type === 'bank' ? 'Account number' : 'Wallet number'}
              required={!editing}
              error={err.number}
              htmlFor="ac-num"
              hint={editing && account?.number ? `Current ${maskNumber(account.number)} · leave blank to keep` : 'Stored securely; shown as ••••1234'}>
              
                <Input id="ac-num" inputMode="numeric" autoComplete="off" className="tabular" value={f.number} onChange={(e) => set('number', e.target.value)} placeholder={f.type === 'bank' ? '1071100044471' : '01711-556677'} />
              </Field>
            }
            <Field label="Campus" htmlFor="ac-camp"><SelectField id="ac-camp" value={f.campusId} onValueChange={(v) => set('campusId', v)} options={campuses.map((c) => ({ value: c.id, label: c.short }))} /></Field>
            <Field label="Opening balance (৳)" required error={err.opening} htmlFor="ac-open" hint={hasEntries ? 'Locked — entries already exist. Use reconciliation to correct.' : undefined}>
              <Input id="ac-open" type="number" min={0} inputMode="numeric" className="tabular" disabled={hasEntries} value={f.opening} onChange={(e) => set('opening', e.target.value)} />
            </Field>
            <Field label="As of" htmlFor="ac-date"><Input id="ac-date" type="date" max={TODAY} disabled={hasEntries} value={f.openingDate} onChange={(e) => set('openingDate', e.target.value)} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? 'Save changes' : 'Add account'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
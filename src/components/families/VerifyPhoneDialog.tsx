import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { useAdmin } from '../../contexts/AdminContext';
import type { Family } from '../../types/family';

const SAMPLE_CODE = '246810';

/** Simulated 6-digit SMS code verification for the primary guardian phone. */
export function VerifyPhoneDialog({ family, open, onOpenChange }: {family: Family;open: boolean;onOpenChange: (o: boolean) => void;}) {
  const { familyStore, queueMessage } = useAdmin();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {if (open) {setSent(false);setCode('');setErr('');}}, [open]);

  const send = () => {
    queueMessage({ channel: 'SMS', audience: `Guardian ${family.id}`, recipients: 1, template: 'OTP', body: 'Your Sabab verification code', credits: 1 });
    setSent(true);
  };
  const verify = () => {
    if (!/^\d{6}$/.test(code)) return setErr('Enter the 6-digit code.');
    if (code !== SAMPLE_CODE) return setErr('Code doesn’t match. Check the SMS or resend.');
    familyStore.verifyFamily(family.id);
    toast.success('Phone verified', { description: `${family.guardianName} can now use the guardian portal.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Verify {family.phone}</DialogTitle>
          <DialogDescription>A one-time code is sent by SMS to the primary guardian.</DialogDescription>
        </DialogHeader>
        {!sent ?
        <Notice kind="info">Ask {family.guardianName} to keep the phone nearby, then send the code.</Notice> :

        <div className="space-y-3">
            <Field label="6-digit code" error={err} htmlFor="otp"><Input id="otp" inputMode="numeric" maxLength={6} autoFocus value={code} onChange={(e) => {setCode(e.target.value.replace(/\D/g, ''));setErr('');}} className="tabular tracking-[0.3em]" /></Field>
            <p className="text-[11.5px] text-muted-foreground">Sample code: <b className="tabular">{SAMPLE_CODE}</b> · real SMS needs the backend.</p>
          </div>
        }
        <DialogFooter>
          <Button variant="outline" onClick={() => sent ? send() : onOpenChange(false)}>{sent ? 'Resend' : 'Cancel'}</Button>
          {sent ? <Button onClick={verify}>Verify</Button> : <Button onClick={send}>Send code</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
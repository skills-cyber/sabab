import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Field } from './Field';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  /** When set, a reason is mandatory and recorded in the audit trail. */
  reasonLabel?: string;
  children?: React.ReactNode;
  onConfirm: (reason: string) => void;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', destructive, reasonLabel, children, onConfirm }: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const submit = () => {
    if (reasonLabel && reason.trim().length < 5) {
      setError('Please give a reason (at least 5 characters) — it is stored in the audit log.');
      return;
    }
    onConfirm(reason.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {reasonLabel &&
        <Field label={reasonLabel} required error={error} htmlFor="confirm-reason">
            <Textarea id="confirm-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Visible to approvers and auditors" />
          </Field>
        }
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={submit}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
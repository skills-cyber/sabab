import React, { useEffect, useState } from 'react';
import { Check, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Field } from './Field';
import { ApprovalTimeline } from './ApprovalTimeline';
import type { TimelineEntry } from '../../types/academic';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  history?: TimelineEntry[];
  approveLabel?: string;
  returnLabel?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  onDecision: (approve: boolean, note: string) => void;
}

/** Focused approve / return dialog with context and audit timeline. Returning requires a note. */
export function ApprovalDialog({ open, onOpenChange, title, description, children, history, approveLabel = 'Approve', returnLabel = 'Return', readOnly, readOnlyReason, onDecision }: ApprovalDialogProps) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNote('');
      setError(null);
    }
  }, [open]);

  const decide = (approve: boolean) => {
    if (!approve && note.trim().length < 5) {
      setError('Explain what needs to change (min 5 characters).');
      return;
    }
    onDecision(approve, note.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="min-w-0 space-y-3">
            {children}
            {!readOnly &&
            <Field label="Decision note" hint="Optional when approving; required when returning." error={error} htmlFor="approval-note">
                <Textarea id="approval-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Shared with the submitter and stored in the audit trail" />
              </Field>
            }
          </div>
          {history && history.length > 0 &&
          <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">History</p>
              <ApprovalTimeline entries={history} />
            </div>
          }
        </div>
        <DialogFooter>
          {readOnly ?
          <>
              <p className="mr-auto self-center text-xs text-muted-foreground">{readOnlyReason ?? 'You can view but not decide on this item.'}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </> :

          <>
              <Button variant="outline" onClick={() => decide(false)}><Undo2 className="size-4" /> {returnLabel}</Button>
              <Button onClick={() => decide(true)}><Check className="size-4" /> {approveLabel}</Button>
            </>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
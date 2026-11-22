import React, { useEffect, useRef, useState } from 'react';
import { Check, Lock, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { cn } from '../../utils/cn';

interface InlineEditCellProps {
  display: React.ReactNode;
  value: string;
  onSave: (v: string) => string | void;
  type?: 'text' | 'number';
  label: string;
  lockedReason?: string | null;
  align?: 'left' | 'right' | 'center';
  inputClassName?: string;
}

/**
 * Global risk-aware inline edit: affordance appears on hover / keyboard focus (and faintly on touch),
 * Enter saves, Esc cancels, validation errors stay inline. Protected cells show a lock with the reason.
 */
export function InlineEditCell({ display, value, onSave, type = 'text', label, lockedReason, align = 'left', inputClassName }: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-between';

  if (lockedReason) {
    return (
      <div className={cn('group/cell flex items-center gap-1.5', justify)}>
        <span className="min-w-0">{display}</span>
        <Tooltip>
          <TooltipTrigger
            aria-label={`${label} locked: ${lockedReason}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded text-subtle opacity-0 transition-opacity focus-visible:opacity-100 group-hover/cell:opacity-100 [@media(hover:none)]:opacity-60">
            
            <Lock className="size-3" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{lockedReason}</TooltipContent>
        </Tooltip>
      </div>);

  }

  const commit = () => {
    const v = draft.trim();
    if (v === value) {
      setEditing(false);
      return;
    }
    const res = onSave(v);
    if (typeof res === 'string') {
      setError(res);
      return;
    }
    setError(null);
    setEditing(false);
    toast.success(`${label} updated`, { description: `Saved “${v}” · recorded in audit log` });
  };

  const cancel = () => {
    setDraft(value);
    setError(null);
    setEditing(false);
  };

  if (editing) {
    return (
      <div onClick={(e) => e.stopPropagation()} className="min-w-[120px]">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type={type}
            value={draft}
            aria-label={label}
            aria-invalid={!!error}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') cancel();
            }}
            className={cn(
              'h-7 w-full min-w-0 rounded-md border bg-card px-2 text-[13px] text-foreground outline-none',
              error ? 'border-danger ring-2 ring-danger/15' : 'border-primary ring-2 ring-primary/15',
              align === 'right' && 'text-right tabular',
              inputClassName
            )} />
          
          <button type="button" onClick={commit} aria-label="Save" className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary-hover">
            <Check className="size-3.5" />
          </button>
          <button type="button" onClick={cancel} aria-label="Cancel" className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
            <X className="size-3.5" />
          </button>
        </div>
        {error && <p className="mt-1 text-[11px] text-danger" role="alert">{error}</p>}
      </div>);

  }

  return (
    <div className={cn('group/cell flex items-center gap-1.5', justify)}>
      <span className="min-w-0">{display}</span>
      <button
        type="button"
        aria-label={`Edit ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded text-subtle opacity-0 transition-opacity hover:bg-muted hover:text-primary focus-visible:opacity-100 group-hover/cell:opacity-100 [@media(hover:none)]:opacity-60">
        
        <Pencil className="size-3" />
      </button>
    </div>);

}
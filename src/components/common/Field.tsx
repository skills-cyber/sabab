import React from 'react';
import { cn } from '../../utils/cn';

interface FieldProps {
  label: string;
  bn?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Form field: label (+ Bangla helper), required marker, inline error. */
export function Field({ label, bn, htmlFor, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline gap-1.5 text-[12.5px] font-medium text-foreground">
        {label}
        {required && <span className="text-danger" aria-hidden>*</span>}
        {bn && <span lang="bn" className="font-bn text-[11px] font-normal text-muted-foreground">{bn}</span>}
      </label>
      {children}
      {error ?
      <p className="text-[11.5px] text-danger" role="alert">{error}</p> :
      hint ?
      <p className="text-[11.5px] text-muted-foreground">{hint}</p> :
      null}
    </div>);

}
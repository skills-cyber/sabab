import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'default';
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Sabab select — compact single-line options, list at least as wide as the trigger,
 * capped at ~9 rows (scrolls beyond), clamped to the viewport. Trigger always shows the label.
 */
export function SelectField({ value, onValueChange, options, placeholder, className, size = 'default', ariaLabel, id, disabled }: SelectFieldProps) {
  const current = options.find((o) => o.value === value);
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        size={size}
        aria-label={ariaLabel}
        disabled={disabled}
        title={current?.label}
        className={cn('!w-full min-w-0 justify-between gap-2 rounded-md bg-card text-[13px]', size === 'sm' ? 'h-8 px-2.5' : 'h-9 px-3', className)}>
        
        <SelectValue placeholder={placeholder}>
          <span className="block truncate text-left">{current?.label ?? placeholder}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={4}
        collisionPadding={12}
        className="max-h-[min(18rem,var(--radix-select-content-available-height))] min-w-[max(var(--radix-select-trigger-width),12rem)] max-w-[min(28rem,calc(100vw-24px))] p-1">
        
        {options.map((o) =>
        <SelectItem key={o.value} value={o.value} title={o.label} className="h-8 rounded-[5px] py-0 pl-2 pr-8 text-[13px] [&>span:last-child]:truncate">
            {o.label}
          </SelectItem>
        )}
      </SelectContent>
    </Select>);

}
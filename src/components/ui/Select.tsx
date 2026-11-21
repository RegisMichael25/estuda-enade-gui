import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, children, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-bold uppercase tracking-wider text-muted select-none"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full bg-paper text-ink border-[2.5px] border-ink rounded-xl px-3.5 py-2.5 font-medium cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-ink',
            error && 'border-pink bg-pink/10',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs font-bold text-red-600">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';


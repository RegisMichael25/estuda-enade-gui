import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold uppercase tracking-wider text-muted select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-paper text-ink border-[2.5px] border-ink rounded-xl px-3.5 py-2.5 font-medium',
            'placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-ink',
            'transition-shadow duration-100',
            error && 'border-pink bg-pink/10',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs font-bold text-red-600">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold uppercase tracking-wider text-muted select-none"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-paper text-ink border-[2.5px] border-ink rounded-xl px-3.5 py-2.5 font-medium',
            'placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-ink',
            'transition-shadow duration-100 resize-y',
            error && 'border-pink bg-pink/10',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs font-bold text-red-600">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';


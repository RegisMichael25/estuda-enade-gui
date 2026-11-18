import React from 'react';
import { cn } from '@/lib/utils';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: 'blue' | 'pink' | 'green' | 'yellow' | 'lilac' | 'orange' | 'paper';
}

export function Tag({ className, color = 'paper', children, ...props }: TagProps) {
  const colorStyles = {
    blue: 'bg-blue text-ink',
    pink: 'bg-pink text-ink',
    green: 'bg-green text-ink',
    yellow: 'bg-yellow text-ink',
    lilac: 'bg-lilac text-ink',
    orange: 'bg-orange text-white',
    paper: 'bg-paper text-ink'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border-2 border-ink rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap select-none',
        colorStyles[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ className, active = false, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'border-[2.5px] border-ink rounded-full px-3.5 py-1.5 font-bold text-sm cursor-pointer select-none transition-all duration-100',
        active
          ? 'bg-ink text-paper shadow-brutal-sm'
          : 'bg-paper text-ink hover:bg-bg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'PUBLICADA' | 'RASCUNHO' | 'OCULTA' | 'SINALIZADA' | string;
}

export function Badge({ status, className, ...props }: BadgeProps) {
  const config = {
    PUBLICADA: { label: '● Publicada', class: 'text-emerald-700 font-bold' },
    RASCUNHO: { label: '○ Rascunho', class: 'text-muted font-bold' },
    OCULTA: { label: '◌ Oculta', class: 'text-muted/70 font-bold' },
    SINALIZADA: { label: '⚑ Sinalizada', class: 'text-orange font-bold' }
  }[status] || { label: status, class: 'text-ink font-bold' };

  return (
    <span className={cn('text-xs inline-flex items-center gap-1 select-none', config.class, className)} {...props}>
      {config.label}
    </span>
  );
}

export interface ProgressMeterProps {
  valor: number; // 0 a 100
  cor?: 'blue' | 'pink' | 'green' | 'yellow' | 'orange';
  className?: string;
}

export function ProgressMeter({ valor, cor = 'blue', className }: ProgressMeterProps) {
  const pct = Math.max(0, Math.min(100, Math.round(valor)));

  const barColors = {
    blue: 'bg-blue',
    pink: 'bg-pink',
    green: 'bg-green',
    yellow: 'bg-yellow',
    orange: 'bg-orange'
  };

  return (
    <div
      className={cn(
        'w-full h-3.5 bg-paper border-2 border-ink rounded-full overflow-hidden relative shadow-inner',
        className
      )}
    >
      <div
        className={cn('h-full border-r-2 border-ink transition-all duration-500 ease-out', barColors[cor])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}


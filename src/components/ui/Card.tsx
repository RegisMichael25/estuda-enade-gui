import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: 'paper' | 'yellow' | 'blue' | 'green' | 'pink' | 'lilac' | 'orange';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, color = 'paper', interactive = false, children, ...props }, ref) => {
    const colorStyles = {
      paper: 'bg-paper text-ink',
      yellow: 'bg-yellow text-ink',
      blue: 'bg-blue text-ink',
      green: 'bg-green text-ink',
      pink: 'bg-pink text-ink',
      lilac: 'bg-lilac text-ink',
      orange: 'bg-orange text-white'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'border-[2.5px] border-ink rounded-2xl p-4 shadow-brutal',
          colorStyles[color],
          interactive &&
            'cursor-pointer transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';


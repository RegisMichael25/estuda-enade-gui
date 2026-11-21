import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'yellow' | 'green' | 'pink' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  carregando?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      fullWidth = false,
      carregando = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: 'bg-orange text-white hover:bg-[#d95c2f]',
      secondary: 'bg-paper text-ink hover:bg-bg',
      yellow: 'bg-yellow text-ink hover:bg-[#e6b53a]',
      green: 'bg-green text-ink hover:bg-[#5db47b]',
      pink: 'bg-pink text-ink hover:bg-[#e28aa7]',
      ghost: 'bg-transparent border-transparent shadow-none hover:bg-black/5 hover:border-ink',
      danger: 'bg-pink text-ink hover:bg-red-200'
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      md: 'px-4 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3.5 text-base rounded-2xl'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || carregando}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-bold select-none cursor-pointer',
          'border-[2.5px] border-ink shadow-brutal-md transition-all duration-100',
          'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal',
          'active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-brutal-sm',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {carregando && <Loader2 className="w-4 h-4 animate-spin flex-none" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';


import React, { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { regrasSenha } from '@/lib/senha';

interface CampoSenhaProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
  mostrarRegras?: boolean;
}

export function CampoSenha({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  mostrarRegras = false,
  className,
  ...props
}: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false);
  const regras = mostrarRegras ? regrasSenha(value) : [];
  const idRegras = `${id}-regras`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-muted select-none">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={mostrarRegras ? idRegras : undefined}
          className={cn(
            'w-full bg-paper text-ink border-[2.5px] border-ink rounded-xl pl-3.5 pr-11 py-2.5 font-medium',
            'placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-ink',
            'transition-shadow duration-100',
            error && 'border-pink bg-pink/10',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg cursor-pointer"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visivel}
        >
          {visivel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <span className="text-xs font-bold text-red-600">{error}</span>}
      {mostrarRegras && (
        <ul id={idRegras} className="flex flex-col gap-0.5 mt-0.5">
          {regras.map((r) => (
            <li
              key={r.id}
              className={cn('flex items-center gap-1.5 text-xs font-semibold', r.ok ? 'text-green-700' : 'text-muted')}
            >
              {r.ok ? <Check className="w-3.5 h-3.5" aria-hidden /> : <X className="w-3.5 h-3.5" aria-hidden />}
              {r.texto}
              <span className="sr-only">{r.ok ? '(ok)' : '(pendente)'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

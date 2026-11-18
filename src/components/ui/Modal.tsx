import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ aberto, aoFechar, titulo, children, className }: ModalProps) {
  useEffect(() => {
    function lidarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar();
    }
    if (aberto) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', lidarTecla);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', lidarTecla);
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
        onClick={aoFechar}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-paper border-[3px] border-ink rounded-2xl p-6 shadow-brutal-xl z-10',
          'animate-in fade-in zoom-in-95 duration-150',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b-2 border-ink">
          {titulo && <h3 className="text-xl font-bold font-title text-ink">{titulo}</h3>}
          <button
            type="button"
            onClick={aoFechar}
            className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-bg cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}


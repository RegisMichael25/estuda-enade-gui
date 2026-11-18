import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ToastContextType {
  toast: (mensagem: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [visivel, setVisivel] = useState(false);

  const toast = useCallback((msg: string) => {
    setMensagem(msg);
    setVisivel(true);
    const timer = setTimeout(() => {
      setVisivel(false);
      setTimeout(() => setMensagem(null), 300);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mensagem && (
        <div
          className={cn(
            'fixed left-1/2 bottom-8 -translate-x-1/2 z-50 pointer-events-none',
            'bg-ink text-paper px-5 py-2.5 rounded-xl font-bold text-sm shadow-brutal',
            'transition-all duration-300 transform',
            visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {mensagem}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}


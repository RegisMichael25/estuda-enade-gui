import React from 'react';
import { Card } from '@/components/ui/Card';

/** Layout das telas públicas (entrar, criar conta, esqueci a senha): marca no topo e o cartão do formulário. */
export function AuthShell({
  erro,
  children,
  rodape
}: {
  erro?: React.ReactNode;
  children: React.ReactNode;
  /** Abaixo do cartão (ex.: "Não tem conta? Criar conta"). */
  rodape?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange border-[3px] border-ink flex items-center justify-center text-white font-title font-extrabold text-2xl shadow-brutal">
            e
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-title tracking-tight text-ink">
              estuda<span className="text-orange">.enade</span>
            </h1>
            <p className="text-xs font-bold text-muted uppercase tracking-wider">Sistema de Estudos & Prática</p>
          </div>
        </div>

        <Card className="p-6 md:p-8 bg-paper">
          {erro && (
            <div role="alert" className="mb-4 p-3 bg-pink/20 border-2 border-ink rounded-xl text-xs font-bold text-ink">
              {erro}
            </div>
          )}
          {children}
        </Card>

        {rodape && <div className="mt-4 text-center text-sm text-muted">{rodape}</div>}
      </div>
    </div>
  );
}

/** Divisor "ou" entre o formulário e o botão do Google. */
export function DivisorOu() {
  return (
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted" aria-hidden>
      <div className="flex-1 border-t-2 border-ink/20" />
      ou
      <div className="flex-1 border-t-2 border-ink/20" />
    </div>
  );
}

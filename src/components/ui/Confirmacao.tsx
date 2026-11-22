import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface OpcoesConfirmacao {
  titulo: string;
  mensagem?: React.ReactNode;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  /** Ação destrutiva ou sem volta: botão em destaque de perigo e foco inicial em "Cancelar". */
  perigo?: boolean;
}

type Confirmar = (opcoes: OpcoesConfirmacao) => Promise<boolean>;

const ConfirmacaoContext = createContext<Confirmar | undefined>(undefined);

interface Pedido extends OpcoesConfirmacao {
  responder: (ok: boolean) => void;
}

/**
 * Modal de confirmação único para o sistema. As telas chamam
 * `const ok = await confirmar({...})` e seguem só se `ok` for verdadeiro.
 * Fica dentro do roteador: mudar de rota (por exemplo, no envio automático
 * quando o tempo acaba) cancela a confirmação aberta.
 */
export function ConfirmacaoProvider({ children }: { children: React.ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const pedidoRef = useRef<Pedido | null>(null);

  const confirmar = useCallback<Confirmar>((opcoes) => {
    // Um pedido novo cancela o que estiver aberto.
    pedidoRef.current?.responder(false);
    return new Promise<boolean>((resolve) => {
      const novo: Pedido = {
        ...opcoes,
        responder: (ok) => {
          if (pedidoRef.current === novo) {
            pedidoRef.current = null;
            setPedido(null);
          }
          resolve(ok);
        },
      };
      pedidoRef.current = novo;
      setPedido(novo);
    });
  }, []);

  const { pathname } = useLocation();
  useEffect(() => {
    pedidoRef.current?.responder(false);
  }, [pathname]);

  return (
    <ConfirmacaoContext.Provider value={confirmar}>
      {children}
      {pedido && <DialogoConfirmacao pedido={pedido} />}
    </ConfirmacaoContext.Provider>
  );
}

function DialogoConfirmacao({ pedido }: { pedido: Pedido }) {
  const {
    titulo,
    mensagem,
    rotuloConfirmar = 'Confirmar',
    rotuloCancelar = 'Cancelar',
    perigo,
    responder,
  } = pedido;

  const tituloId = useId();
  const mensagemId = useId();
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const confirmarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const focoAnterior = document.activeElement as HTMLElement | null;
    (perigo ? cancelarRef : confirmarRef).current?.focus();

    // Captura o Esc antes dos outros modais, para fechar só a confirmação.
    function lidarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        responder(false);
      }
    }
    window.addEventListener('keydown', lidarTecla, true);

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', lidarTecla, true);
      document.body.style.overflow = overflowAnterior;
      focoAnterior?.focus?.();
    };
  }, [perigo, responder]);

  const Icone = perigo ? AlertTriangle : HelpCircle;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs" onClick={() => responder(false)} />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={mensagem ? mensagemId : undefined}
        className="relative w-full max-w-md bg-paper border-[3px] border-ink rounded-2xl p-6 shadow-brutal-xl z-10 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 flex-none rounded-xl border-[2.5px] border-ink flex items-center justify-center',
              perigo ? 'bg-pink' : 'bg-yellow'
            )}
          >
            <Icone className="w-5 h-5 text-ink" />
          </div>
          <div className="flex flex-col gap-1 pt-0.5">
            <h3 id={tituloId} className="text-lg font-bold font-title text-ink">
              {titulo}
            </h3>
            {mensagem && (
              <div id={mensagemId} className="text-sm text-muted">
                {mensagem}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t-2 border-ink/20">
          <Button ref={cancelarRef} type="button" variant="ghost" onClick={() => responder(false)}>
            {rotuloCancelar}
          </Button>
          <Button
            ref={confirmarRef}
            type="button"
            variant={perigo ? 'danger' : 'primary'}
            onClick={() => responder(true)}
          >
            {rotuloConfirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmacao() {
  const context = useContext(ConfirmacaoContext);
  if (!context) {
    throw new Error('useConfirmacao deve ser usado dentro de um ConfirmacaoProvider');
  }
  return context;
}

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/api/client';
import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LIMITE_CARACTERES_SINALIZACAO = 500;
const ALTURA_MINIMA = 90; // px
const ALTURA_MAXIMA = 220; // px

export interface ModalSinalizarQuestaoProps {
  aberto: boolean;
  aoFechar: () => void;
  questaoId: string | null;
  papel?: 'aluno' | 'professor';
  titulo?: string;
  onSucesso?: () => void;
}

export function ModalSinalizarQuestao({
  aberto,
  aoFechar,
  questaoId,
  papel = 'aluno',
  titulo = 'Sinalizar problema na questão ou gabarito',
  onSucesso
}: ModalSinalizarQuestaoProps) {
  const { toast } = useToast();
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const usuarioRedimensionou = useRef(false);

  // Auto-ajuste de altura de acordo com o texto digitado (se o usuário não arrastou manualmente)
  useEffect(() => {
    if (!aberto) {
      setMotivo('');
      usuarioRedimensionou.current = false;
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    if (!usuarioRedimensionou.current) {
      // Redefine temporariamente para auto para calcular o scrollHeight real do conteúdo
      textarea.style.height = 'auto';
      // Ajusta de acordo com o conteúdo digitado, respeitando altura mínima e máxima
      const novaAltura = Math.min(Math.max(textarea.scrollHeight, ALTURA_MINIMA), ALTURA_MAXIMA);
      textarea.style.height = `${novaAltura}px`;
    }
  }, [motivo, aberto]);

  function handleFechar() {
    setMotivo('');
    usuarioRedimensionou.current = false;
    aoFechar();
  }

  // Detecta se a interação do usuário foi no puxador de redimensionamento (canto inferior direito)
  function handleMouseDown(e: React.MouseEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const clicouNoPuxador =
      e.clientX >= rect.right - 24 && e.clientY >= rect.bottom - 24;
    if (clicouNoPuxador) {
      usuarioRedimensionou.current = true;
    }
  }

  async function handleEnviar() {
    if (!questaoId) return;
    const texto = motivo.trim();
    if (!texto) {
      toast('Por favor, informe o motivo da sinalização.');
      return;
    }
    if (texto.length > LIMITE_CARACTERES_SINALIZACAO) {
      toast(`O motivo não pode exceder ${LIMITE_CARACTERES_SINALIZACAO} caracteres.`);
      return;
    }

    setEnviando(true);
    try {
      if (papel === 'professor') {
        await api.professor.sinalizarQuestao(questaoId, texto);
        toast('Sinalização enviada com sucesso para revisão!');
      } else {
        await api.aluno.sinalizarQuestao(questaoId, texto);
        toast('Questão sinalizada para revisão dos professores!');
      }
      handleFechar();
      onSucesso?.();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao enviar sinalização.');
    } finally {
      setEnviando(false);
    }
  }

  const caracteresRestantes = LIMITE_CARACTERES_SINALIZACAO - motivo.length;
  const pertoDoLimite = caracteresRestantes <= 50;

  return (
    <Modal aberto={aberto} aoFechar={handleFechar} titulo={titulo}>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted">
          Encontrou algum erro no enunciado, alternativas ou gabarito? Descreva com clareza o problema identificado para revisão.
        </p>

        <div className="flex flex-col gap-1.5">
          <Textarea
            ref={textareaRef}
            placeholder="Descreva o problema encontrado na questão ou gabarito..."
            value={motivo}
            onChange={(e) => {
              const valor = e.target.value.slice(0, LIMITE_CARACTERES_SINALIZACAO);
              setMotivo(valor);
              // Se o campo for totalmente apagado, restaura o auto-ajuste
              if (!valor.trim()) {
                usuarioRedimensionou.current = false;
              }
            }}
            onMouseDown={handleMouseDown}
            maxLength={LIMITE_CARACTERES_SINALIZACAO}
            style={{
              minHeight: `${ALTURA_MINIMA}px`,
              maxHeight: `${ALTURA_MAXIMA}px`
            }}
            className="min-h-[90px] max-h-[220px] resize-y overflow-y-auto leading-relaxed"
            required
          />
          <div className="flex justify-between items-center px-1 text-[11px] font-bold">
            <span className="text-muted text-[10px]">
              Limite máximo de {LIMITE_CARACTERES_SINALIZACAO} caracteres
            </span>
            <span
              className={cn(
                pertoDoLimite ? 'text-orange font-extrabold' : 'text-muted'
              )}
            >
              {motivo.length} / {LIMITE_CARACTERES_SINALIZACAO}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-ink/20">
          <Button variant="ghost" onClick={handleFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            carregando={enviando}
            disabled={!motivo.trim() || motivo.length > LIMITE_CARACTERES_SINALIZACAO}
            onClick={handleEnviar}
          >
            Enviar sinalização
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export interface BotaoSinalizarProps {
  onClick: (e: React.MouseEvent) => void;
  rotulo?: string;
  title?: string;
  compacto?: boolean;
  variante?: 'subtil' | 'pill';
  className?: string;
}

export function BotaoSinalizar({
  onClick,
  rotulo = 'Sinalizar',
  title = 'Sinalizar erro na questão ou gabarito',
  compacto = false,
  variante = 'subtil',
  className = ''
}: BotaoSinalizarProps) {
  const estilosVariante = {
    subtil:
      'text-muted hover:text-ink hover:bg-black/5 px-2 py-1 rounded-lg border border-transparent hover:border-ink/20',
    pill:
      'bg-paper text-ink border-[2px] border-ink/40 hover:border-ink px-2.5 py-1 rounded-xl shadow-xs hover:shadow-sm'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer select-none shrink-0',
        estilosVariante[variante],
        className
      )}
    >
      <Flag className="w-3.5 h-3.5 text-orange flex-none" />
      {!compacto && <span>{rotulo}</span>}
    </button>
  );
}

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Tag } from '@/components/ui/Tag';
import { cn } from '@/lib/utils';

interface ItemQuestaoSelecionavelProps {
  questao: { id: string; enunciado: string; ano: number; tema: { nome: string } };
  marcada: boolean;
  aoAlternar: () => void;
  /** Mostra "Ver inteira" para abrir o enunciado completo sem marcar a questão. */
  expansivel?: boolean;
}

/**
 * Questão do banco em uma lista de seleção, com caixa de marcar, tema, ano e o início do enunciado.
 * Usado na montagem de atividade do professor e na prova que o aluno monta na prática livre.
 */
export function ItemQuestaoSelecionavel({ questao, marcada, aoAlternar, expansivel = false }: ItemQuestaoSelecionavelProps) {
  const [aberta, setAberta] = useState(false);

  return (
    <div
      role="checkbox"
      aria-checked={marcada}
      tabIndex={0}
      onClick={aoAlternar}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          aoAlternar();
        }
      }}
      className={cn(
        'p-2.5 rounded-xl border-2 flex items-start gap-2.5 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/40',
        marcada ? 'bg-yellow/30 border-ink shadow-brutal-sm' : 'bg-paper border-ink/40'
      )}
    >
      <input
        type="checkbox"
        checked={marcada}
        readOnly
        tabIndex={-1}
        aria-hidden
        className="w-4 h-4 accent-orange mt-0.5 pointer-events-none"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Tag color="blue" className="text-[10px] py-0">
            {questao.tema.nome}
          </Tag>
          <span className="text-[11px] font-bold text-muted">ENADE {questao.ano}</span>
        </div>
        <p className={cn('text-xs font-medium text-ink whitespace-pre-wrap', !aberta && 'line-clamp-2')}>
          {questao.enunciado}
        </p>
        {expansivel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAberta((a) => !a);
            }}
            className="mt-1 text-[11px] font-bold text-muted hover:text-ink flex items-center gap-0.5 cursor-pointer"
            aria-expanded={aberta}
          >
            {aberta ? 'Ver menos' : 'Ver inteira'}
            <ChevronDown className={cn('w-3 h-3 transition-transform', aberta && 'rotate-180')} />
          </button>
        )}
      </div>
    </div>
  );
}

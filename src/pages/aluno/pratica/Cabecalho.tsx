import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const PASSOS = ['Conteúdo', 'Questões', 'Revisão'];

/** Topo das etapas da prática: voltar, título e o andamento da montagem (passo 1 a 3). */
export function Cabecalho({
  rotuloVoltar,
  aoVoltar,
  passo,
  direita,
}: {
  rotuloVoltar: string;
  aoVoltar: () => void;
  /** 0 a 2 durante a montagem; omitido na resolução e no resumo. */
  passo?: number;
  direita?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-ink">
        <button
          type="button"
          onClick={aoVoltar}
          className="text-xs font-bold text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {rotuloVoltar}
        </button>
        {direita ?? <span className="text-xs font-bold text-ink">Prática Livre</span>}
      </div>

      {passo !== undefined && (
        <ol className="flex items-center gap-2" aria-label="Etapas da montagem">
          {PASSOS.map((nome, i) => (
            <li key={nome} className="flex items-center gap-2" aria-current={i === passo ? 'step' : undefined}>
              <span
                className={cn(
                  'w-6 h-6 rounded-full border-2 border-ink flex items-center justify-center text-xs font-extrabold shrink-0',
                  i === passo ? 'bg-orange text-white' : i < passo ? 'bg-ink text-paper' : 'bg-paper text-ink'
                )}
              >
                {i + 1}
              </span>
              <span className={cn('text-xs font-bold uppercase tracking-wider', i === passo ? 'text-ink' : 'text-muted')}>
                {nome}
              </span>
              {i < PASSOS.length - 1 && <span className="w-4 h-0.5 bg-ink/30" aria-hidden />}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

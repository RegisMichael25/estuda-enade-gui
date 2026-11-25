import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginacaoProps {
  /** Página atual, começando em 0 (como na API). */
  pagina: number;
  tamanho: number;
  total: number;
  aoMudar: (pagina: number) => void;
  /** Desativa as setas enquanto a página carrega. */
  carregando?: boolean;
  className?: string;
}

/** Faixa mostrada, "16–30 de 220"; serve também para o texto acima da lista. */
export function faixaDaPagina(pagina: number, tamanho: number, total: number): string {
  if (total === 0) return '0 de 0';
  const inicio = pagina * tamanho + 1;
  const fim = Math.min((pagina + 1) * tamanho, total);
  return `${inicio}–${fim} de ${total}`;
}

/** Setas de anterior e próxima com a página atual. Some quando tudo cabe em uma página. */
export function Paginacao({ pagina, tamanho, total, aoMudar, carregando = false, className }: PaginacaoProps) {
  const paginas = Math.ceil(total / tamanho);
  if (paginas <= 1) return null;

  const botao =
    'h-9 px-3 rounded-xl border-[2.5px] border-ink bg-paper text-ink text-xs font-bold flex items-center gap-1 shadow-brutal-sm cursor-pointer transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0';

  return (
    <nav aria-label="Paginação" className={cn('flex items-center justify-between gap-3', className)}>
      <button
        type="button"
        className={botao}
        disabled={carregando || pagina === 0}
        onClick={() => aoMudar(pagina - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <span className="text-xs font-bold text-ink text-center" aria-live="polite">
        Página {pagina + 1} de {paginas}
        <span className="block text-[11px] font-medium text-muted">{faixaDaPagina(pagina, tamanho, total)}</span>
      </span>

      <button
        type="button"
        className={botao}
        disabled={carregando || pagina >= paginas - 1}
        onClick={() => aoMudar(pagina + 1)}
        aria-label="Próxima página"
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

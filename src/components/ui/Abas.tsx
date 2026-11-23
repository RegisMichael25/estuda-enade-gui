import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface Aba {
  /** Caminho relativo à rota atual (ex.: "atividades") ou "" para a aba inicial. */
  para: string;
  rotulo: string;
  icone?: LucideIcon;
  /** Marca a aba só na rota exata (use na aba inicial). */
  exata?: boolean;
}

export interface AbasProps {
  abas: Aba[];
  className?: string;
}

/** Abas de navegação entre sub-rotas. A aba ativa vem da URL. */
export function Abas({ abas, className }: AbasProps) {
  return (
    <nav className={cn('flex gap-1.5 overflow-x-auto border-b-[2.5px] border-ink', className)} aria-label="Seções">
      {abas.map(({ para, rotulo, icone: Icone, exata }) => (
        <NavLink
          key={para}
          to={para}
          end={exata}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 px-3.5 py-2 -mb-[2.5px] rounded-t-xl border-[2.5px] font-bold text-sm whitespace-nowrap transition-colors',
              isActive
                ? 'bg-yellow border-ink text-ink'
                : 'border-transparent text-muted hover:text-ink hover:bg-paper'
            )
          }
        >
          {Icone && <Icone className="w-4 h-4 flex-none" />}
          {rotulo}
        </NavLink>
      ))}
    </nav>
  );
}

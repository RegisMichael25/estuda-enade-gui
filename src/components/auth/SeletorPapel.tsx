import { GraduationCap, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Papel } from '@/api/models';

const OPCOES: { papel: Papel; titulo: string; descricao: string; icone: typeof User; cor: string }[] = [
  {
    papel: 'ALUNO',
    titulo: 'Sou aluno',
    descricao: 'Pratico questões e faço atividades',
    icone: GraduationCap,
    cor: 'bg-yellow'
  },
  {
    papel: 'PROFESSOR',
    titulo: 'Sou professor',
    descricao: 'Gerencio turmas, questões e atividades',
    icone: User,
    cor: 'bg-lilac'
  }
];

/** Escolha de papel no cadastro. Sem papel padrão: o usuário precisa escolher. */
export function SeletorPapel({ valor, aoMudar }: { valor: Papel | null; aoMudar: (papel: Papel) => void }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-xs font-bold uppercase tracking-wider text-muted select-none mb-1.5">
        Como você vai usar?
      </legend>
      <div className="grid grid-cols-2 gap-3" role="radiogroup">
        {OPCOES.map(({ papel, titulo, descricao, icone: Icone, cor }) => {
          const selecionado = valor === papel;
          return (
            <button
              key={papel}
              type="button"
              role="radio"
              aria-checked={selecionado}
              onClick={() => aoMudar(papel)}
              className={cn(
                'border-[2.5px] border-ink rounded-xl p-3 text-left cursor-pointer transition-all',
                selecionado ? `${cor} shadow-brutal-sm` : 'bg-paper hover:bg-bg'
              )}
            >
              <Icone className="w-6 h-6 mb-1.5 text-ink" aria-hidden />
              <div className="font-bold text-sm">{titulo}</div>
              <div className="text-xs text-muted">{descricao}</div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Users, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const OPCOES: { to: string; titulo: string; descricao: string; icone: LucideIcon }[] = [
  {
    to: '/aluno/configuracoes/turmas',
    titulo: 'Turmas',
    descricao: 'Entre em uma turma com o código do professor e veja suas turmas.',
    icone: Users
  }
];

export function AlunoConfiguracoesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold font-title text-ink">Configurações</h1>

      <div className="flex flex-col gap-2.5">
        {OPCOES.map(({ to, titulo, descricao, icone: Icone }) => (
          <Card
            key={to}
            interactive
            onClick={() => navigate(to)}
            className="p-3.5 flex items-center gap-3.5"
          >
            <div className="w-11 h-11 rounded-xl bg-lilac border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
              <Icone className="w-5 h-5 text-ink" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-ink">{titulo}</h3>
              <p className="text-xs text-muted mt-0.5">{descricao}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted flex-none" />
          </Card>
        ))}
      </div>
    </div>
  );
}

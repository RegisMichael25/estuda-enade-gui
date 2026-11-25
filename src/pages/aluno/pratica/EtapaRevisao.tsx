import type { QuestaoAluno } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Play, Plus, Shuffle, X } from 'lucide-react';
import { embaralhar } from './estado';

interface EtapaRevisaoProps {
  prova: QuestaoAluno[];
  aoMudarProva: (prova: QuestaoAluno[]) => void;
  aoAdicionarMais: () => void;
  aoComecar: () => void;
  comecando?: boolean;
}

/** Passo 3: a prova como vai ser respondida. Dá para tirar questões e embaralhar a ordem. */
export function EtapaRevisao({ prova, aoMudarProva, aoAdicionarMais, aoComecar, comecando = false }: EtapaRevisaoProps) {
  const porTema = new Map<string, number>();
  prova.forEach((q) => porTema.set(q.tema.nome, (porTema.get(q.tema.nome) ?? 0) + 1));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold font-title">
          Sua prova · {prova.length} {prova.length === 1 ? 'questão' : 'questões'}
        </h2>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[...porTema.entries()].map(([tema, n]) => (
            <Tag key={tema} color="blue" className="text-[11px]">
              {tema} · {n}
            </Tag>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => aoMudarProva(embaralhar(prova))} disabled={prova.length < 2}>
          <Shuffle className="w-3.5 h-3.5" />
          Embaralhar ordem
        </Button>
        <Button variant="ghost" size="sm" onClick={aoAdicionarMais}>
          <Plus className="w-3.5 h-3.5" />
          Adicionar mais
        </Button>
      </div>

      {prova.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-bold">A prova está vazia.</p>
          <p className="text-xs text-muted mt-1">Volte e escolha ou sorteie questões.</p>
        </Card>
      ) : (
        <ol className="flex flex-col gap-2">
          {prova.map((q, i) => (
            <li
              key={q.id}
              className="p-2.5 rounded-xl border-2 border-ink/40 bg-paper flex items-start gap-2.5"
            >
              <span className="w-6 h-6 rounded-lg border-2 border-ink bg-bg flex items-center justify-center font-bold text-xs shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Tag color="blue" className="text-[10px] py-0">
                    {q.tema.nome}
                  </Tag>
                  <span className="text-[11px] font-bold text-muted">ENADE {q.ano}</span>
                </div>
                <p className="text-xs font-medium text-ink line-clamp-2">{q.enunciado}</p>
              </div>
              <button
                type="button"
                onClick={() => aoMudarProva(prova.filter((p) => p.id !== q.id))}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg cursor-pointer shrink-0"
                aria-label={`Tirar a questão ${i + 1} da prova`}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ol>
      )}

      <Button variant="primary" size="lg" fullWidth disabled={prova.length === 0} carregando={comecando} onClick={aoComecar}>
        <Play className="w-4 h-4" />
        Começar a praticar
      </Button>
    </div>
  );
}

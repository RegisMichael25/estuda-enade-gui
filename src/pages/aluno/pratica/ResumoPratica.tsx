import { useState } from 'react';
import type { QuestaoAluno } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag, ProgressMeter } from '@/components/ui/Tag';
import { cn } from '@/lib/utils';
import { CheckCircle, ChevronDown, MinusCircle, RotateCcw, XCircle, Plus } from 'lucide-react';
import { percentual, resumoPorTema, type Resposta } from './estado';

interface ResumoPraticaProps {
  prova: QuestaoAluno[];
  respostas: Record<string, Resposta>;
  aoRefazer: () => void;
  aoPraticarErradas: () => void;
  aoMontarOutra: () => void;
  aoAbrirQuestao: (indice: number) => void;
  /** Criando a próxima prova: trava os botões. */
  ocupado?: boolean;
}

/** Fim da prova: acertos no total e por tema, e o que fazer em seguida. */
export function ResumoPratica({
  prova,
  respostas,
  aoRefazer,
  aoPraticarErradas,
  aoMontarOutra,
  aoAbrirQuestao,
  ocupado = false,
}: ResumoPraticaProps) {
  const [verQuestoes, setVerQuestoes] = useState(false);
  const respondidas = prova.filter((q) => respostas[q.id]).length;
  const acertos = prova.filter((q) => respostas[q.id]?.gabarito.acertou).length;
  // "Erradas" inclui as puladas: também são as que o aluno ainda precisa praticar
  const erradas = prova.length - acertos;
  const temas = resumoPorTema(prova, respostas);

  return (
    <div className="flex flex-col gap-4">
      <Card color="yellow" className="p-5 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-ink/80">Resultado da sua prova</span>
        <p className="text-4xl font-title font-extrabold text-ink mt-1">{percentual(acertos, prova.length)}%</p>
        <p className="text-sm font-bold text-ink mt-1">
          {acertos} de {prova.length} {prova.length === 1 ? 'questão' : 'questões'}
          {respondidas < prova.length && ` · ${prova.length - respondidas} sem resposta`}
        </p>
      </Card>

      <Card className="p-4 bg-paper flex flex-col gap-3">
        <h3 className="text-sm font-bold font-title">Por tema</h3>
        {temas.map((t) => (
          <div key={t.tema} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-xs font-bold">
              <span className="text-ink">{t.tema}</span>
              <span className="text-muted">
                {t.acertos}/{t.total} · {percentual(t.acertos, t.total)}%
              </span>
            </div>
            <ProgressMeter valor={percentual(t.acertos, t.total)} cor={percentual(t.acertos, t.total) >= 60 ? 'green' : 'pink'} />
          </div>
        ))}
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="primary" size="md" className="flex-1" disabled={erradas === 0 || ocupado} onClick={aoPraticarErradas}>
          <RotateCcw className="w-4 h-4" />
          Praticar só as que errei{erradas > 0 ? ` (${erradas})` : ''}
        </Button>
        <Button variant="secondary" size="md" className="flex-1" disabled={ocupado} onClick={aoRefazer}>
          <RotateCcw className="w-4 h-4" />
          Refazer esta prova
        </Button>
        <Button variant="secondary" size="md" className="flex-1" onClick={aoMontarOutra}>
          <Plus className="w-4 h-4" />
          Montar outra
        </Button>
      </div>

      <Card className="p-0 bg-paper overflow-hidden">
        <button
          type="button"
          onClick={() => setVerQuestoes((v) => !v)}
          aria-expanded={verQuestoes}
          className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-bg/60"
        >
          <span className="text-sm font-bold font-title">Questões da prova</span>
          <ChevronDown className={cn('w-4 h-4 transition-transform', verQuestoes && 'rotate-180')} />
        </button>
        {verQuestoes && (
          <ol className="px-4 pb-4 flex flex-col gap-2 border-t-2 border-ink/20 pt-3">
            {prova.map((q, i) => {
              const r = respostas[q.id];
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => aoAbrirQuestao(i)}
                    className="w-full text-left p-2.5 rounded-xl border-2 border-ink/40 bg-paper hover:bg-bg flex items-start gap-2.5 cursor-pointer"
                  >
                    {!r ? (
                      <MinusCircle className="w-4 h-4 text-muted shrink-0 mt-0.5" aria-label="Sem resposta" />
                    ) : r.gabarito.acertou ? (
                      <CheckCircle className="w-4 h-4 text-green-700 shrink-0 mt-0.5" aria-label="Acertou" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-label="Errou" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-extrabold text-ink">{i + 1}.</span>
                        <Tag color="blue" className="text-[10px] py-0">
                          {q.tema.nome}
                        </Tag>
                        {r && <span className="text-[11px] font-bold text-muted">Gabarito: {r.gabarito.letraCorreta}</span>}
                      </div>
                      <p className="text-xs font-medium text-ink line-clamp-2">{q.enunciado}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}

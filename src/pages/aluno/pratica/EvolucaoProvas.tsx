import type { ProvaPessoalResumo } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { percentual } from './estado';

const MAXIMO_BARRAS = 12;
const DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

/**
 * Evolução do aluno: % de acertos em cada prova concluída, da mais antiga à mais recente (até as 12 últimas).
 * Uma série só: barras de uma cor, sem legenda; o título diz o que é. Cada barra tem tooltip no hover,
 * e uma tabela oculta repete os números para leitores de tela.
 */
export function EvolucaoProvas({ provas }: { provas: ProvaPessoalResumo[] }) {
  const concluidas = provas
    .filter((p) => p.concluidaEm)
    .sort((a, b) => new Date(a.concluidaEm!).getTime() - new Date(b.concluidaEm!).getTime())
    .slice(-MAXIMO_BARRAS);
  if (concluidas.length < 2) return null;

  const pontos = concluidas.map((p) => ({ prova: p, valor: percentual(p.acertos, p.total) }));
  const primeira = pontos[0].valor;
  const ultima = pontos[pontos.length - 1].valor;
  const diferenca = ultima - primeira;

  return (
    <Card className="p-4 bg-paper flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold font-title">Sua evolução · % de acertos</h3>
        <span className="text-xs font-bold text-muted">
          {diferenca === 0 ? 'Estável' : `${diferenca > 0 ? '+' : ''}${diferenca} pontos desde a primeira`}
        </span>
      </div>

      <div className="flex gap-2" aria-hidden>
        {/* Eixo: só 0, 50 e 100, discreto */}
        <div className="flex flex-col justify-between text-[10px] font-bold text-muted h-32 py-0 -mt-1.5 -mb-1.5 text-right w-7 shrink-0">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
        <div className="relative flex-1 h-32">
          <div className="absolute inset-x-0 top-0 border-t border-ink/10" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-ink/15" />
          <div className="absolute inset-x-0 bottom-0 border-t-2 border-ink/40" />
          <div className="absolute inset-0 flex items-end gap-0.5">
            {pontos.map(({ prova, valor }) => (
              <div key={prova.id} className="group relative flex-1 h-full flex items-end justify-center">
                <div
                  className="w-full max-w-10 rounded-t bg-orange transition-opacity group-hover:opacity-80"
                  style={{ height: `${Math.max(valor, 2)}%` }}
                />
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block whitespace-nowrap rounded-lg border-2 border-ink bg-paper px-2 py-1 shadow-brutal-sm">
                  <p className="text-[11px] font-bold text-ink">{prova.nome}</p>
                  <p className="text-[11px] text-muted">
                    {DATA.format(new Date(prova.concluidaEm!))} · {prova.acertos}/{prova.total} · <b className="text-ink">{valor}%</b>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pl-9" aria-hidden>
        {pontos.map(({ prova }) => (
          <span key={prova.id} className="flex-1 text-center text-[10px] font-bold text-muted truncate">
            {DATA.format(new Date(prova.concluidaEm!))}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Porcentagem de acertos nas provas concluídas, da mais antiga à mais recente</caption>
        <thead>
          <tr>
            <th>Prova</th>
            <th>Concluída em</th>
            <th>Acertos</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map(({ prova, valor }) => (
            <tr key={prova.id}>
              <td>{prova.nome}</td>
              <td>{DATA.format(new Date(prova.concluidaEm!))}</td>
              <td>
                {prova.acertos} de {prova.total} ({valor}%)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

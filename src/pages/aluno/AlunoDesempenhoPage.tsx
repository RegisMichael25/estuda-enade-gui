import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { DesempenhoAluno, TentativaEstado } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { ProgressMeter } from '@/components/ui/Tag';
import { Tag } from '@/components/ui/Tag';
import { ArrowRight } from 'lucide-react';

export function AlunoDesempenhoPage() {
  const navigate = useNavigate();
  const [desempenho, setDesempenho] = useState<DesempenhoAluno | null>(null);
  const [tentativas, setTentativas] = useState<TentativaEstado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [dadosDesempenho, historico] = await Promise.all([
          api.aluno.obterDesempenho(),
          api.aluno.obterHistoricoTentativas().catch((): TentativaEstado[] => [])
        ]);
        setDesempenho(dadosDesempenho);
        setTentativas(historico);
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) {
    return (
      <div className="p-8 text-center text-xs font-bold text-muted">
        Carregando desempenho...
      </div>
    );
  }

  const porTema = desempenho?.porTema || [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold font-title">Meu Desempenho</h2>
        <p className="text-xs text-muted">
          Acompanhe seu progresso de estudo e pontos fortes por matéria.
        </p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 gap-3">
        <Card color="yellow" className="p-4 text-center">
          <div className="text-4xl font-extrabold font-title text-ink">
            {desempenho?.percentual ?? 0}%
          </div>
          <span className="text-xs font-bold text-ink/80 block mt-1">
            taxa de acertos
          </span>
        </Card>

        <Card color="blue" className="p-4 text-center">
          <div className="text-4xl font-extrabold font-title text-ink">
            {desempenho?.respondidas ?? 0}
          </div>
          <span className="text-xs font-bold text-ink/80 block mt-1">
            questões resolvidas
          </span>
        </Card>
      </div>

      {/* Desempenho por Tema */}
      <Card className="p-4 bg-paper flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Desempenho por tema
        </span>

        {porTema.length === 0 ? (
          <p className="text-xs text-muted font-bold">
            Ainda não há dados por tema. Pratique questões para visualizar.
          </p>
        ) : (
          porTema.map((item, idx) => {
            const cores: ('blue' | 'yellow' | 'pink' | 'green')[] = [
              'blue',
              'yellow',
              'pink',
              'green'
            ];
            const cor = cores[idx % cores.length];

            return (
              <div key={item.tema} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-ink">
                  <span>{item.tema}</span>
                  <span>{item.percentual ?? 0}%</span>
                </div>
                <ProgressMeter valor={item.percentual ?? 0} cor={cor} />
              </div>
            );
          })
        )}
      </Card>

      {/* Histórico de Tentativas */}
      <div className="flex flex-col gap-2.5 mt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Histórico de tentativas ({tentativas.length})
        </span>

        {tentativas.length === 0 ? (
          <Card className="p-4 text-center bg-paper">
            <p className="text-xs text-muted font-bold">
              Você ainda não finalizou nenhuma atividade ou simulado.
            </p>
          </Card>
        ) : (
          tentativas.map((t) => (
            <Card
              key={t.id}
              interactive
              onClick={() => navigate(`/aluno/tentativa/${t.id}/resultado`)}
              className="p-3.5 flex items-center justify-between gap-3 bg-paper"
            >
              <div>
                <h4 className="font-bold text-xs text-ink">{t.titulo}</h4>
                <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                  <span>Tentativa #{t.numero}</span>
                  <span>•</span>
                  <span>{t.finalizada ? 'Finalizada' : 'Em andamento'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tag color={t.finalizada ? 'green' : 'yellow'}>
                  {t.finalizada ? 'Concluída' : 'Em aberto'}
                </Tag>
                <ArrowRight className="w-4 h-4 text-muted" />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

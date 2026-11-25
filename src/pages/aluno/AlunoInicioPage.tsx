import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { AtividadeAluno, DesempenhoAluno } from '@/api/models';
import { formatarDuracao } from '@/lib/duracao';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Play, ClipboardList, ArrowRight } from 'lucide-react';

export function AlunoInicioPage() {
  const navigate = useNavigate();

  const [atividades, setAtividades] = useState<AtividadeAluno[]>([]);
  const [desempenho, setDesempenho] = useState<DesempenhoAluno | null>(null);

  async function carregarDados() {
    try {
      const [listaAtividades, dadosDesempenho] = await Promise.all([
        api.aluno.obterAtividades().catch((): AtividadeAluno[] => []),
        api.aluno.obterDesempenho().catch((): DesempenhoAluno | null => null)
      ]);
      setAtividades(listaAtividades);
      setDesempenho(dadosDesempenho);
    } catch (err) {
      console.error('Erro ao carregar dados do aluno:', err);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero: Resumo de Desempenho */}
      <Card color="orange" className="p-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
          Seu desempenho geral
        </span>
        <h2 className="text-3xl font-extrabold font-title text-white mt-1">
          {desempenho && (desempenho.respondidas ?? 0) > 0
            ? `${desempenho.percentual ?? 0}% de acertos`
            : 'Comece a praticar!'}
        </h2>
        <p className="text-xs text-white/90 mt-1">
          {desempenho && (desempenho.respondidas ?? 0) > 0
            ? `${desempenho.respondidas} questões respondidas · ${desempenho.melhorTema
              ? `Melhor tema: ${desempenho.melhorTema}`
              : `${desempenho.acertos} acertos`
            }`
            : 'Resolva questões para visualizar suas estatísticas por matéria.'}
        </p>
      </Card>

      {/* Atividades Publicadas */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Atividades & Simulados
          </span>
          <span className="text-xs font-bold text-muted">
            {atividades.length} {atividades.length === 1 ? 'disponível' : 'disponíveis'}
          </span>
        </div>

        {atividades.length === 0 ? (
          <Card className="p-4 text-center bg-paper">
            <p className="text-xs font-bold text-muted">
              Nenhuma atividade aberta no momento para sua turma.
            </p>
          </Card>
        ) : (
          atividades.map((atv) => (
            <Card
              key={atv.id}
              interactive
              onClick={() =>
                navigate(
                  !atv.podeIniciar && atv.melhorTentativaId
                    ? `/aluno/tentativa/${atv.melhorTentativaId}/resultado`
                    : `/aluno/atividade/${atv.id}`
                )
              }
              className="p-3.5 flex items-center gap-3.5"
            >
              <div
                className={`w-11 h-11 rounded-xl border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm ${atv.tipo === 'SIMULADO' ? 'bg-yellow' : 'bg-blue'
                  }`}
              >
                <ClipboardList className="w-5 h-5 text-ink" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-ink truncate">{atv.titulo}</h3>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted mt-0.5">
                  <span>{atv.totalQuestoes} questões</span>
                  <span>•</span>
                  <span>{formatarDuracao(atv)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-none">
                {atv.status === 'ENCERRADA' ? (
                  <Tag color="paper">Encerrada</Tag>
                ) : atv.tentativaAbertaId ? (
                  <Tag color="yellow">Em andamento</Tag>
                ) : !atv.podeIniciar ? (
                  <Tag color="green">Concluído</Tag>
                ) : null}
                <ArrowRight className="w-4 h-4 text-muted flex-none" />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Card de Prática Livre */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Estudo individual
        </span>

        <Card
          color="green"
          interactive
          onClick={() => navigate('/aluno/pratica')}
          className="p-4 flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-paper border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
            <Play className="w-5 h-5 text-ink fill-ink" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-sm text-ink">Praticar no Banco Livre</h3>
            <p className="text-xs text-ink/80 mt-0.5">
              Filtre questões oficiais do ENADE por ano e tema com gabarito imediato.
            </p>
          </div>

          <ArrowRight className="w-4 h-4 text-ink flex-none" />
        </Card>
      </div>
    </div>
  );
}

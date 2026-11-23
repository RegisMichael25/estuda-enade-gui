import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { Atividade, ResultadosAtividade } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { ProgressMeter } from '@/components/ui/Tag';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { Combobox } from '@/components/ui/Combobox';
import { useTurma } from './ProfessorTurmaPage';

export function TurmaResultadosAba() {
  const { atividadeId } = useParams<{ atividadeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { turma } = useTurma();

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [atividadeIdAtiva, setAtividadeIdAtiva] = useState<string>(atividadeId || '');
  const [resultados, setResultados] = useState<ResultadosAtividade | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Carrega lista de atividades da turma para o seletor
  useEffect(() => {
    async function carregarLista() {
      try {
        // Rascunhos ainda não têm resultado.
        const lista = (await api.professor.obterAtividadesTurma(turma.id)).filter((a) => a.status !== 'RASCUNHO');
        setAtividades(lista);
        if (!atividadeIdAtiva && lista.length > 0) {
          setAtividadeIdAtiva(lista[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    carregarLista();
  }, [turma.id]);

  // Link direto para outra atividade (ex.: vindo do painel inicial)
  useEffect(() => {
    if (atividadeId) setAtividadeIdAtiva(atividadeId);
  }, [atividadeId]);

  // Carrega resultados da atividade selecionada
  useEffect(() => {
    async function carregarResultados() {
      if (!atividadeIdAtiva) {
        setCarregando(false);
        return;
      }
      setCarregando(true);
      try {
        const dados = await api.professor.obterResultadosAtividade(atividadeIdAtiva);
        setResultados(dados);
      } catch (err: any) {
        toast(err.mensagem || 'Erro ao carregar resultados da atividade.');
      } finally {
        setCarregando(false);
      }
    }
    carregarResultados();
  }, [atividadeIdAtiva, toast]);

  const tempoMedioMinutos = resultados?.tempoMedioSegundos
    ? Math.round(resultados.tempoMedioSegundos / 60)
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Seletor de Atividade */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs lg:text-sm text-muted">
          Acompanhamento agregado e individual dos alunos em cada atividade.
        </p>

        {atividades.length > 0 && (
          <div className="w-full sm:w-64">
            <Combobox
              tamanho="sm"
              placeholder="Buscar atividade"
              opcoes={atividades.map((a) => ({ valor: a.id, rotulo: a.titulo }))}
              valor={atividadeIdAtiva}
              aoMudar={(id) => {
                setAtividadeIdAtiva(id);
                navigate(`/professor/turmas/${turma.id}/resultados/${id}`, { replace: true });
              }}
            />
          </div>
        )}
      </div>

      {carregando ? (
        <div className="p-8 text-center text-xs font-bold text-muted">
          Carregando resultados da atividade...
        </div>
      ) : !resultados ? (
        <Card className="p-8 text-center bg-paper">
          <p className="text-sm font-bold text-muted">
            {atividades.length === 0
              ? 'Nenhuma atividade publicada nesta turma ainda.'
              : 'Nenhuma atividade selecionada ou sem dados no momento.'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Grid: Desempenho por Tema + Média Geral */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            {/* Acertos por Tema */}
            <Card className="lg:col-span-2 p-5 bg-paper flex flex-col gap-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Acertos da turma por tema
              </span>

              {resultados.porTema && resultados.porTema.length > 0 ? (
                resultados.porTema.map((t, idx) => {
                  const cores: ('blue' | 'yellow' | 'pink' | 'green')[] = [
                    'blue',
                    'yellow',
                    'pink',
                    'green'
                  ];
                  const cor = cores[idx % cores.length];

                  return (
                    <div key={t.tema} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold text-ink">
                        <span>{t.tema}</span>
                        <span>{t.percentual ?? 0}%</span>
                      </div>
                      <ProgressMeter valor={t.percentual ?? 0} cor={cor} />
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted font-bold">
                  Ainda não há dados suficientes para agregar por matéria.
                </p>
              )}
            </Card>

            {/* Média da Turma & Adesão */}
            <Card color="green" className="p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                  Média da turma
                </span>
                <div className="text-5xl font-extrabold font-title text-ink my-3">
                  {resultados.media !== null && resultados.media !== undefined ? `${resultados.media}%` : '—'}
                </div>
              </div>

              <div className="text-xs text-ink/90 font-medium pt-3 border-t-2 border-ink/20">
                <p>
                  <b>{resultados.concluiram}</b> de <b>{resultados.totalAlunos}</b> alunos concluíram
                </p>
                <p className="mt-1">
                  Tempo médio: <b>{tempoMedioMinutos !== null ? `${tempoMedioMinutos} min` : '—'}</b>
                </p>
              </div>
            </Card>
          </div>

          {/* Tabela de Resultados por Aluno */}
          <Card className="p-0 bg-paper overflow-hidden">
            <div className="p-4 border-b-2 border-ink bg-bg flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Alunos vinculados ({resultados.alunos?.length || 0})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-ink bg-paper font-bold text-muted uppercase text-[11px]">
                    <th className="p-3.5 pl-4">Aluno</th>
                    <th className="p-3.5">Nota / Acertos</th>
                    <th className="p-3.5 hidden sm:table-cell">Tempo Usado</th>
                    <th className="p-3.5 text-center">Tentativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-ink/20 font-medium text-ink">
                  {resultados.alunos && resultados.alunos.length > 0 ? (
                    resultados.alunos.map((aluno) => {
                      const tempoMin = aluno.tempoSegundos !== null && aluno.tempoSegundos !== undefined
                        ? `${Math.round(aluno.tempoSegundos / 60)} min`
                        : '—';

                      const concluiu = aluno.acertos !== null && aluno.acertos !== undefined && aluno.total !== null && aluno.total !== undefined;

                      return (
                        <tr key={aluno.alunoId} className="hover:bg-bg/50 transition-colors">
                          <td className="p-3.5 pl-4 font-bold">{aluno.nome}</td>
                          <td className="p-3.5">
                            {concluiu ? (
                              <span className="font-bold text-ink">
                                {aluno.acertos}/{aluno.total} (
                                {aluno.total! > 0 ? Math.round((aluno.acertos! / aluno.total!) * 100) : 0}%)
                              </span>
                            ) : aluno.tentativas > 0 ? (
                              <Tag color="yellow">Em andamento</Tag>
                            ) : (
                              <span className="text-muted">Não iniciou</span>
                            )}
                          </td>
                          <td className="p-3.5 hidden sm:table-cell text-muted">
                            {concluiu ? tempoMin : '—'}
                          </td>
                          <td className="p-3.5 text-center">
                            {aluno.tentativas > 0 ? (
                              <Tag color="blue">{aluno.tentativas}</Tag>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted font-bold">
                        Nenhum aluno registrado nesta atividade.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

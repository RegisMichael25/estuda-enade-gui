import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api/client';
import type { PainelProfessor, Turma } from '@/api/models';
import { ModalTurma } from '@/components/turma/ModalTurma';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip, Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { ArrowRight, ClipboardList, Plus, School, Users } from 'lucide-react';

/** Painel exibido e a turma para a qual ele foi buscado (`undefined` = todas). */
interface PainelCarregado {
  dados: PainelProfessor;
  turmaId?: string;
}

interface OpcaoTurma {
  id: string;
  nome: string;
}

export function ProfessorInicioPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // O filtro fica na URL (?turma=<id>): voltar, recarregar e compartilhar o link mantêm a escolha.
  const [searchParams, setSearchParams] = useSearchParams();
  const turmaId = searchParams.get('turma') ?? undefined;

  const [painel, setPainel] = useState<PainelCarregado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [turmasSeletor, setTurmasSeletor] = useState<OpcaoTurma[] | null>(null);
  const [modalTurmaAberta, setModalTurmaAberta] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    api.professor
      .obterPainel(turmaId)
      .then((dados) => {
        if (cancelado) return;
        setPainel({ dados, turmaId });
        // Sem filtro, o painel traz todas as turmas ativas: é a lista do seletor.
        if (!turmaId) setTurmasSeletor(dados.turmas.map(({ id, nome }) => ({ id, nome })));
      })
      .catch((err: any) => {
        if (cancelado) return;
        if (turmaId && err.status === 404) {
          // Turma arquivada, de outro professor ou link antigo: volta para "Todas".
          toast('Essa turma não está mais disponível no painel.');
          setSearchParams({}, { replace: true });
        } else {
          console.error('Erro ao carregar o painel:', err);
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [turmaId]);

  // Aberta já filtrada (link direto), a página não tem a lista completa para o seletor: busca uma vez.
  useEffect(() => {
    if (!turmaId || turmasSeletor) return;
    api.professor
      .obterTurmas()
      .then((ts) => setTurmasSeletor(ts.map(({ id, nome }) => ({ id, nome }))))
      .catch((err) => console.error('Erro ao carregar as turmas:', err));
  }, [turmaId, turmasSeletor]);

  function escolherTurma(id?: string) {
    if (id === turmaId) return;
    setSearchParams(id ? { turma: id } : {});
  }

  function handleTurmaCriada(nova: Turma) {
    navigate(`/professor/turmas/${nova.id}`);
  }

  const dados = painel?.dados;
  const turmas = dados?.turmas ?? [];
  const atividades = dados?.atividades ?? [];
  // Rótulos seguem o painel exibido, não a URL, para não descasar dos números durante a troca.
  const filtrado = !!painel?.turmaId;
  const turmaFiltrada = filtrado ? turmas[0] : undefined;
  const mostrarSeletor = (turmasSeletor?.length ?? 0) > 1 || !!turmaId;

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink">
          Bom dia, <span className="text-orange">{usuario?.nome || 'Professor'}</span>
        </h1>
        <p className="text-xs lg:text-sm font-medium text-muted mt-1">
          {turmaFiltrada ? (
            <>
              Visão geral da turma <span className="font-bold text-ink">{turmaFiltrada.nome}</span>.
            </>
          ) : (
            'Visão geral das suas turmas ativas.'
          )}
        </p>
      </div>

      {/* Seletor de turma */}
      {mostrarSeletor && turmasSeletor && (
        <div
          role="group"
          aria-label="Filtrar o painel por turma"
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        >
          <Chip className="shrink-0" active={!turmaId} aria-pressed={!turmaId} onClick={() => escolherTurma()}>
            Todas
          </Chip>
          {turmasSeletor.map((t) => (
            <Chip
              key={t.id}
              className="shrink-0"
              active={turmaId === t.id}
              aria-pressed={turmaId === t.id}
              onClick={() => escolherTurma(t.id)}
            >
              {t.nome}
            </Chip>
          ))}
        </div>
      )}

      {/* Durante a troca de turma, o painel anterior fica esmaecido em vez de zerar os números */}
      <div
        className={cn('flex flex-col gap-6 transition-opacity', carregando && painel && 'opacity-60')}
        aria-busy={carregando}
      >
        {/* Números */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {turmaFiltrada ? (
            <Card color="pink" className="p-4">
              <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">
                {turmaFiltrada.mediaPercentual != null ? `${turmaFiltrada.mediaPercentual}%` : '—'}
              </div>
              <span className="text-xs font-bold text-ink/80 block mt-1">média da turma</span>
            </Card>
          ) : (
            <Card color="lilac" className="p-4">
              <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">{dados?.turmasAtivas ?? 0}</div>
              <span className="text-xs font-bold text-ink/80 block mt-1">turmas ativas</span>
            </Card>
          )}
          <Card color="yellow" className="p-4">
            <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">{dados?.totalAlunos ?? 0}</div>
            <span className="text-xs font-bold text-ink/80 block mt-1">alunos</span>
          </Card>
          <Card color="green" className="p-4">
            <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">{dados?.atividadesAbertas ?? 0}</div>
            <span className="text-xs font-bold text-ink/80 block mt-1">atividades abertas</span>
          </Card>
          <Card color="blue" className="p-4">
            <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">{dados?.questoesNoBanco ?? 0}</div>
            <span className="text-xs font-bold text-ink/80 block mt-1">questões no banco</span>
          </Card>
        </div>

        {dados && !filtrado && turmas.length === 0 ? (
          <Card className="p-8 text-center bg-paper">
            <h2 className="text-xl font-bold font-title">Nenhuma turma ativa</h2>
            <p className="text-xs text-muted mt-1">Crie sua primeira turma para convidar alunos e publicar atividades.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => setModalTurmaAberta(true)}>
              <Plus className="w-3.5 h-3.5" />
              Criar turma
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Turmas */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {turmaFiltrada ? 'Turma' : 'Suas turmas'}
                </span>
                {turmaFiltrada ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/professor/turmas/${turmaFiltrada.id}`)}
                  >
                    Abrir turma
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => navigate('/professor/turmas')}>
                    Ver todas
                  </Button>
                )}
              </div>

              {turmas.map((t) => (
                <Card
                  key={t.id}
                  interactive
                  onClick={() => navigate(`/professor/turmas/${t.id}`)}
                  className="p-4 flex flex-col gap-2.5 bg-paper"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lilac border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
                      <School className="w-5 h-5 text-ink" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-ink truncate">{t.nome}</h3>
                      <p className="text-xs text-muted truncate">
                        {[t.curso?.nome ?? 'Sem curso', t.periodo].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted flex-none" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Tag color="blue">
                      <Users className="w-3 h-3 mr-1" />
                      {t.totalAlunos} {t.totalAlunos === 1 ? 'aluno' : 'alunos'}
                    </Tag>
                    <Tag color="green">
                      {t.atividadesAbertas} {t.atividadesAbertas === 1 ? 'atividade aberta' : 'atividades abertas'}
                    </Tag>
                    <Tag color="pink">média {t.mediaPercentual != null ? `${t.mediaPercentual}%` : '—'}</Tag>
                  </div>
                </Card>
              ))}
            </div>

            {/* Atividades recentes */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted py-1.5">Atividades recentes</span>

              {atividades.length === 0 ? (
                <Card className="p-6 text-center bg-paper">
                  <p className="text-xs font-bold text-muted">
                    {filtrado
                      ? 'Nenhuma atividade publicada nesta turma ainda. Abra a turma para criar a primeira.'
                      : 'Nenhuma atividade publicada ainda. Abra uma turma para criar a primeira.'}
                  </p>
                </Card>
              ) : (
                atividades.map((atv) => (
                  <Card
                    key={atv.id}
                    interactive
                    onClick={() => navigate(`/professor/turmas/${atv.turma.id}/resultados/${atv.id}`)}
                    className="p-4 flex items-center justify-between gap-3 bg-paper"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange text-white border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-ink truncate">{atv.titulo}</h3>
                        <p className="text-xs text-muted truncate">
                          {/* Com filtro, o nome da turma já está no seletor */}
                          {!filtrado && `${atv.turma.nome} · `}
                          {atv.concluiram}/{atv.totalAlunos} concluíram
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-none">
                      <Tag color={atv.status === 'ENCERRADA' ? 'paper' : 'green'}>
                        {atv.status === 'ENCERRADA' ? 'Encerrada' : 'Aberta'}
                      </Tag>
                      <ArrowRight className="w-4 h-4 text-muted" />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <ModalTurma
        aberto={modalTurmaAberta}
        aoFechar={() => setModalTurmaAberta(false)}
        aoSalvar={handleTurmaCriada}
      />
    </div>
  );
}

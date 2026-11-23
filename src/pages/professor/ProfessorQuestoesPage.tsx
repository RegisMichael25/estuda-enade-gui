import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { Questao, Sinalizacao } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiltroQuestoes, filtroVazio, type ValorFiltroQuestoes } from '@/components/FiltroQuestoes';
import { Tag, Badge } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { Plus, Flag, EyeOff, Check, Pencil, Trash2 } from 'lucide-react';

export function ProfessorQuestoesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);

  // Filtro em etapas: a lista só carrega depois de escolher o curso
  const [filtro, setFiltro] = useState<ValorFiltroQuestoes>(filtroVazio());

  // Modal de Sinalizações
  const [modalSinalizacaoAberta, setModalSinalizacaoAberta] = useState(false);
  const [sinalizacoesQuestao, setSinalizacoesQuestao] = useState<Sinalizacao[]>([]);
  const [questaoSinalizadaAtiva, setQuestaoSinalizadaAtiva] = useState<Questao | null>(null);
  const [resolvendoSinalizacao, setResolvendoSinalizacao] = useState(false);

  async function carregar() {
    if (!filtro.cursoId) {
      setQuestoes([]);
      setTotal(null);
      return;
    }
    setCarregando(true);
    try {
      const dados = await api.professor.obterQuestoes({
        cursoId: filtro.cursoId,
        temaId: filtro.temaId ?? undefined,
        ano: filtro.ano ?? undefined,
        busca: filtro.busca || undefined,
        status: filtro.status ?? undefined,
        apenasMinhas: filtro.apenasMinhas,
        apenasSinalizadas: filtro.apenasSinalizadas,
        tamanho: 50
      });
      setQuestoes(dados.itens);
      setTotal(dados.total);
    } catch (err) {
      console.error('Erro ao carregar banco de questões:', err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [filtro]);

  async function handlePublicarQuestao(q: Questao) {
    const ok = await confirmar({
      titulo: 'Publicar questão?',
      mensagem: 'A questão entra no banco institucional e na prática dos alunos, com gabarito e explicação. Confira antes de publicar.',
      rotuloConfirmar: 'Publicar',
    });
    if (!ok) return;
    try {
      await api.professor.publicarQuestao(q.id);
      toast('Questão publicada no banco institucional!');
      await carregar();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao publicar questão.');
    }
  }

  async function handleOcultarQuestao(q: Questao) {
    const ok = await confirmar({
      titulo: 'Ocultar questão?',
      mensagem: 'A questão sai do banco e da prática dos alunos. Atividades que já a usam não mudam. Você pode publicá-la de novo depois.',
      rotuloConfirmar: 'Ocultar',
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.professor.ocultarQuestao(q.id);
      toast('Questão ocultada do banco.');
      await carregar();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao ocultar questão.');
    }
  }

  async function handleExcluirQuestao(q: Questao) {
    const ok = await confirmar({
      titulo: 'Excluir rascunho de questão?',
      mensagem: 'O rascunho desta questão será apagado. Essa ação não pode ser desfeita.',
      rotuloConfirmar: 'Excluir',
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.professor.excluirQuestao(q.id);
      toast('Questão excluída.');
      await carregar();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao excluir questão.');
    }
  }

  async function handleVerSinalizacoes(q: Questao) {
    setQuestaoSinalizadaAtiva(q);
    try {
      const lista = await api.professor.obterSinalizacoesQuestao(q.id);
      setSinalizacoesQuestao(lista);
      setModalSinalizacaoAberta(true);
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao buscar sinalizações.');
    }
  }

  async function handleResolverSinalizacoes() {
    if (!questaoSinalizadaAtiva) return;
    const total = sinalizacoesQuestao.length;
    const ok = await confirmar({
      titulo: 'Marcar sinalizações como resolvidas?',
      mensagem: `${total === 1 ? 'A sinalização aberta' : `As ${total} sinalizações abertas`} desta questão ${total === 1 ? 'sai' : 'saem'} da sua lista de pendências. Faça isso depois de corrigir a questão ou de concluir que ela está certa.`,
      rotuloConfirmar: 'Resolver',
    });
    if (!ok) return;
    setResolvendoSinalizacao(true);
    try {
      await api.professor.resolverSinalizacoes(questaoSinalizadaAtiva.id);
      toast('Sinalizações resolvidas com sucesso!');
      setModalSinalizacaoAberta(false);
      await carregar();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao resolver sinalizações.');
    } finally {
      setResolvendoSinalizacao(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Topo: Título + Botão Nova Questão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink">
            Banco de Questões
          </h1>
          <p className="text-xs lg:text-sm text-muted">
            Acervo colaborativo institucional para prática e simulados.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/professor/questoes/nova')}
        >
          <Plus className="w-4 h-4" />
          Nova questão
        </Button>
      </div>

      <FiltroQuestoes
        valor={filtro}
        aoMudar={setFiltro}
        obterAnos={api.professor.obterAnosBanco}
        filtrosDoBanco
        total={total}
      />

      {/* Lista de Questões */}
      <div className="flex flex-col gap-3">
        {total !== null && total > questoes.length && !carregando && (
          <p className="text-xs font-bold text-muted">
            Mostrando as {questoes.length} mais recentes de {total}. Refine o filtro para encontrar as demais.
          </p>
        )}
        {!filtro.cursoId ? (
          <Card className="p-8 text-center bg-paper">
            <p className="text-sm font-bold text-muted">
              Escolha o curso e clique em Filtrar para ver as questões.
            </p>
          </Card>
        ) : carregando ? (
          <div className="p-8 text-center text-xs font-bold text-muted">
            Carregando questões...
          </div>
        ) : questoes.length === 0 ? (
          <Card className="p-8 text-center bg-paper">
            <p className="text-sm font-bold text-muted">
              Nenhuma questão encontrada com os filtros selecionados.
            </p>
          </Card>
        ) : (
          questoes.map((q) => {
            const temSinalizacao = (q.sinalizacoesAbertas ?? 0) > 0;

            return (
              <Card key={q.id} className="p-4 bg-paper flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag color="blue">{q.tema?.nome}</Tag>
                    <span className="text-xs font-bold text-muted">
                      ENADE {q.ano} · {q.curso?.nome}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted">
                      {q.minha ? 'Você' : q.autor?.nome}
                    </span>
                    {temSinalizacao ? (
                      <Badge status="SINALIZADA" />
                    ) : (
                      <Badge status={q.status || 'PUBLICADA'} />
                    )}
                  </div>
                </div>

                <p className="text-sm font-medium text-ink leading-relaxed">
                  {q.enunciado}
                </p>

                {/* Ações da Questão */}
                <div className="flex items-center justify-between pt-2 border-t border-ink/20 text-xs">
                  <span className="text-muted font-medium">
                    {q.alternativas?.length || 5} alternativas
                  </span>

                  <div className="flex items-center gap-2">
                    {temSinalizacao && (
                      <Button
                        variant="yellow"
                        size="sm"
                        onClick={() => handleVerSinalizacoes(q)}
                      >
                        <Flag className="w-3.5 h-3.5 text-orange" />
                        Ver {q.sinalizacoesAbertas} sinalização(ões)
                      </Button>
                    )}

                    {q.minha && q.status === 'RASCUNHO' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/professor/questoes/${q.id}/editar`)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                    )}

                    {q.minha && q.status === 'RASCUNHO' && (
                      <Button
                        variant="green"
                        size="sm"
                        onClick={() => handlePublicarQuestao(q)}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Publicar
                      </Button>
                    )}

                    {q.minha && q.status === 'RASCUNHO' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluirQuestao(q)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-pink" />
                      </Button>
                    )}

                    {q.minha && q.status === 'PUBLICADA' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOcultarQuestao(q)}
                      >
                        <EyeOff className="w-3.5 h-3.5 text-muted" />
                        Ocultar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de Sinalizações */}
      <Modal
        aberto={modalSinalizacaoAberta}
        aoFechar={() => setModalSinalizacaoAberta(false)}
        titulo="Sinalizações reportadas por alunos"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted">
            Foram apontadas dúvidas ou possíveis inconsistências nesta questão:
          </p>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {sinalizacoesQuestao.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-bg border-2 border-ink rounded-xl text-xs flex flex-col gap-1"
              >
                <div className="flex justify-end font-bold text-muted text-[11px]">
                  <span>{new Date(s.criadaEm).toLocaleDateString()}</span>
                </div>
                <p className="text-ink font-medium">"{s.motivo}"</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-ink/20">
            <Button variant="ghost" onClick={() => setModalSinalizacaoAberta(false)}>
              Fechar
            </Button>
            <Button
              variant="primary"
              carregando={resolvendoSinalizacao}
              onClick={handleResolverSinalizacoes}
            >
              Marcar como resolvidas
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { Questao, StatusQuestao, Tema, Sinalizacao } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Tag, Badge } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Flag, EyeOff, Check } from 'lucide-react';

export function ProfessorQuestoesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [apenasMinhas, setApenasMinhas] = useState(false);
  const [filtroTemaId, setFiltroTemaId] = useState<string | null>(null);
  const [filtroAno, setFiltroAno] = useState<number | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusQuestao | null>(null);
  const [apenasSinalizadas, setApenasSinalizadas] = useState(false);

  // Modal de Sinalizações
  const [modalSinalizacaoAberta, setModalSinalizacaoAberta] = useState(false);
  const [sinalizacoesQuestao, setSinalizacoesQuestao] = useState<Sinalizacao[]>([]);
  const [questaoSinalizadaAtiva, setQuestaoSinalizadaAtiva] = useState<Questao | null>(null);
  const [resolvendoSinalizacao, setResolvendoSinalizacao] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const [dadosQuestoes, listaTemas] = await Promise.all([
        api.professor.obterQuestoes({
          apenasMinhas: apenasMinhas || undefined,
          temaId: filtroTemaId || undefined,
          ano: filtroAno || undefined,
          status: filtroStatus || undefined,
          tamanho: 50
        }),
        api.catalogo.obterTemas().catch((): Tema[] => [])
      ]);

      let itens = dadosQuestoes.itens;
      if (apenasSinalizadas) {
        itens = itens.filter((q) => (q.sinalizacoesAbertas ?? 0) > 0);
      }

      setQuestoes(itens);
      setTemas(listaTemas);
    } catch (err) {
      console.error('Erro ao carregar banco de questões:', err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [apenasMinhas, filtroTemaId, filtroAno, filtroStatus, apenasSinalizadas]);

  async function handlePublicarQuestao(q: Questao) {
    try {
      await api.professor.publicarQuestao(q.id);
      toast('Questão publicada no banco institucional!');
      await carregar();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao publicar questão.');
    }
  }

  async function handleOcultarQuestao(q: Questao) {
    try {
      await api.professor.ocultarQuestao(q.id);
      toast('Questão ocultada do banco.');
      await carregar();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao ocultar questão.');
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

      {/* Chips de Filtro */}
      <div className="flex gap-2 flex-wrap items-center">
        <Chip
          active={!apenasMinhas && !filtroTemaId && !filtroAno && !filtroStatus && !apenasSinalizadas}
          onClick={() => {
            setApenasMinhas(false);
            setFiltroTemaId(null);
            setFiltroAno(null);
            setFiltroStatus(null);
            setApenasSinalizadas(false);
          }}
        >
          Todas
        </Chip>

        <Chip
          active={apenasMinhas}
          onClick={() => setApenasMinhas(!apenasMinhas)}
        >
          Minhas
        </Chip>

        {temas.slice(0, 4).map((t) => (
          <Chip
            key={t.id}
            active={filtroTemaId === t.id}
            onClick={() => setFiltroTemaId(filtroTemaId === t.id ? null : t.id)}
          >
            {t.nome}
          </Chip>
        ))}

        <Chip
          active={filtroAno === 2024}
          onClick={() => setFiltroAno(filtroAno === 2024 ? null : 2024)}
        >
          2024
        </Chip>

        <Chip
          active={filtroAno === 2021}
          onClick={() => setFiltroAno(filtroAno === 2021 ? null : 2021)}
        >
          2021
        </Chip>

        <Chip
          active={apenasSinalizadas}
          onClick={() => setApenasSinalizadas(!apenasSinalizadas)}
        >
          Sinalizadas
        </Chip>
      </div>

      {/* Lista de Questões */}
      <div className="flex flex-col gap-3">
        {carregando ? (
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
                        variant="green"
                        size="sm"
                        onClick={() => handlePublicarQuestao(q)}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Publicar
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

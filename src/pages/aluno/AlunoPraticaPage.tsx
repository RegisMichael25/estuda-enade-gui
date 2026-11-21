import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { Curso, Tema, QuestaoAluno, Gabarito } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Tag } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { Combobox } from '@/components/ui/Combobox';
import { ArrowLeft, Flag, CheckCircle, XCircle, ArrowRight, BookOpen } from 'lucide-react';

export function AlunoPraticaPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  // Estados dos filtros
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState<string>('');
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);
  const [temasDisponiveis, setTemasDisponiveis] = useState<Tema[]>([]);
  const [temaSelecionado, setTemaSelecionado] = useState<string | null>(null);

  // Estados da prática
  const [emPratica, setEmPratica] = useState(false);
  const [questoes, setQuestoes] = useState<QuestaoAluno[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<string | null>(null);
  const [respondido, setRespondido] = useState(false);
  const [gabarito, setGabarito] = useState<Gabarito | null>(null);
  const [respondendo, setRespondendo] = useState(false);

  // Modal de sinalização
  const [modalSinalizarAberto, setModalSinalizarAberto] = useState(false);
  const [motivoSinalizacao, setMotivoSinalizacao] = useState('');
  const [enviandoSinalizacao, setEnviandoSinalizacao] = useState(false);

  // Carregar dados de cursos, anos e temas
  useEffect(() => {
    async function carregarFiltros() {
      try {
        const [listaCursos, listaAnos, listaTemas] = await Promise.all([
          api.catalogo.obterCursos(),
          api.aluno.obterAnosPratica(),
          api.catalogo.obterTemas()
        ]);
        setCursos(listaCursos);
        setAnosDisponiveis(listaAnos);
        setTemasDisponiveis(listaTemas);
        if (listaCursos.length > 0) setCursoId(listaCursos[0].id);
      } catch (err) {
        console.error('Erro ao carregar catálogo para prática:', err);
      }
    }
    carregarFiltros();
  }, []);

  // Atualizar contagem prévia de questões encontradas
  useEffect(() => {
    async function contarQuestoes() {
      if (!cursoId) return;
      try {
        const res = await api.aluno.obterQuestoesPratica({
          cursoId,
          ano: anoSelecionado ?? undefined,
          temaId: temaSelecionado ?? undefined,
          tamanho: 1
        });
        setTotalQuestoes(res.total);
      } catch (err) {
        console.error('Erro ao contar questões:', err);
      }
    }
    contarQuestoes();
  }, [cursoId, anoSelecionado, temaSelecionado]);

  function handleTrocarCurso(novoCursoId: string) {
    setCursoId(novoCursoId);
    setTemaSelecionado(null);
  }

  async function handleIniciarPratica() {
    try {
      const res = await api.aluno.obterQuestoesPratica({
        cursoId,
        ano: anoSelecionado ?? undefined,
        temaId: temaSelecionado ?? undefined,
        tamanho: 50
      });

      if (res.itens.length === 0) {
        toast('Nenhuma questão encontrada com esses filtros.');
        return;
      }

      setQuestoes(res.itens);
      setIndiceAtual(0);
      setAlternativaSelecionada(null);
      setRespondido(false);
      setGabarito(null);
      setEmPratica(true);
    } catch (err) {
      toast('Não foi possível carregar as questões.');
    }
  }

  async function handleResponder() {
    if (!alternativaSelecionada || !questoes[indiceAtual]) {
      toast('Selecione uma alternativa.');
      return;
    }

    setRespondendo(true);
    try {
      const q = questoes[indiceAtual];
      const resultado = await api.aluno.responderPratica(q.id, alternativaSelecionada);
      setGabarito(resultado);
      setRespondido(true);
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao registrar resposta.');
    } finally {
      setRespondendo(false);
    }
  }

  async function handleSairDaPratica() {
    // Só pergunta se já houve progresso na sessão.
    if (indiceAtual > 0 || respondido) {
      const ok = await confirmar({
        titulo: 'Voltar para os filtros?',
        mensagem: `Você está na questão ${indiceAtual + 1} de ${questoes.length}. As respostas já dadas ficam salvas, mas esta sequência recomeça do início.`,
        rotuloConfirmar: 'Voltar aos filtros',
        rotuloCancelar: 'Continuar praticando',
      });
      if (!ok) return;
    }
    setEmPratica(false);
  }

  function handleProximaQuestao() {
    if (indiceAtual + 1 < questoes.length) {
      setIndiceAtual((i) => i + 1);
      setAlternativaSelecionada(null);
      setRespondido(false);
      setGabarito(null);
    } else {
      toast('Você concluiu todas as questões deste filtro!');
      setEmPratica(false);
    }
  }

  async function handleEnviarSinalizacao() {
    if (!motivoSinalizacao.trim() || !questoes[indiceAtual]) return;

    setEnviandoSinalizacao(true);
    try {
      await api.aluno.sinalizarQuestao(questoes[indiceAtual].id, motivoSinalizacao.trim());
      toast('Questão sinalizada para revisão dos professores!');
      setModalSinalizarAberto(false);
      setMotivoSinalizacao('');
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao enviar sinalização.');
    } finally {
      setEnviandoSinalizacao(false);
    }
  }

  const qAtual = questoes[indiceAtual];

  // ================= TELA DE RESOLUÇÃO =================
  if (emPratica && qAtual) {
    return (
      <div className="flex flex-col gap-4">
        {/* Topo com navegação e tags */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
          <button
            onClick={handleSairDaPratica}
            className="text-xs font-bold text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Filtros
          </button>

          <span className="text-xs font-bold text-ink">
            {indiceAtual + 1} de {questoes.length}
          </span>

          <Tag color="blue">{qAtual.tema.nome}</Tag>
        </div>

        {/* Metadados da questão */}
        <div className="text-xs font-bold text-muted">
          ENADE {qAtual.ano} · {qAtual.curso.nome}
        </div>

        {/* Enunciado da questão */}
        <Card className="p-4 bg-paper">
          <p className="text-sm font-medium text-ink leading-relaxed whitespace-pre-wrap">
            {qAtual.enunciado}
          </p>
        </Card>

        {/* Lista de Alternativas */}
        <div className="flex flex-col gap-2.5">
          {qAtual.alternativas.map((alt, idx) => {
            const letra = String.fromCharCode(65 + idx);
            const selecionada = alternativaSelecionada === alt.id;
            const eCorreta = gabarito && gabarito.alternativaCorretaId === alt.id;
            const eIncorreta = respondido && selecionada && !gabarito?.acertou;

            let estilo = 'bg-paper text-ink hover:bg-bg';
            if (selecionada && !respondido) {
              estilo = 'bg-yellow shadow-brutal-sm';
            }
            if (eCorreta) {
              estilo = 'bg-green text-ink shadow-brutal-sm font-bold';
            } else if (eIncorreta) {
              estilo = 'bg-pink text-ink line-through opacity-80';
            }

            return (
              <button
                key={alt.id}
                type="button"
                disabled={respondido}
                onClick={() => setAlternativaSelecionada(alt.id)}
                className={`w-full text-left p-3 rounded-xl border-[2.5px] border-ink flex items-start gap-3 transition-all cursor-pointer ${estilo}`}
              >
                <span className="w-6 h-6 rounded-lg border-2 border-ink bg-paper flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {letra}
                </span>
                <span className="text-xs font-medium leading-snug flex-1">
                  {alt.texto}
                </span>
              </button>
            );
          })}
        </div>

        {/* Botão Responder */}
        {!respondido && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            carregando={respondendo}
            onClick={handleResponder}
          >
            Responder
          </Button>
        )}

        {/* Card de Feedback Imediato */}
        {respondido && gabarito && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Card
              color={gabarito.acertou ? 'green' : 'pink'}
              className="p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                {gabarito.acertou ? (
                  <CheckCircle className="w-5 h-5 text-ink flex-none" />
                ) : (
                  <XCircle className="w-5 h-5 text-ink flex-none" />
                )}
                <h4 className="font-bold text-sm font-title text-ink">
                  {gabarito.acertou ? 'Você acertou!' : 'Resposta incorreta'} · Gabarito: Letra {gabarito.letraCorreta}
                </h4>
              </div>

              {gabarito.explicacao && (
                <p className="text-xs text-ink/90 leading-relaxed mt-2 pt-2 border-t border-ink/20">
                  <b>Justificativa:</b> {gabarito.explicacao}
                </p>
              )}
            </Card>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setModalSinalizarAberto(true)}
                className="flex-1"
              >
                <Flag className="w-4 h-4 text-orange" />
                Sinalizar
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleProximaQuestao}
                className="flex-1"
              >
                Próxima
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Modal de Sinalização */}
        <Modal
          aberto={modalSinalizarAberto}
          aoFechar={() => setModalSinalizarAberto(false)}
          titulo="Sinalizar problema na questão"
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted">
              Encontrou algum erro no enunciado, alternativas ou gabarito? Descreva para que os professores possam revisar.
            </p>
            <Textarea
              rows={3}
              placeholder="Descreva o problema encontrado..."
              value={motivoSinalizacao}
              onChange={(e) => setMotivoSinalizacao(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" onClick={() => setModalSinalizarAberto(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                carregando={enviandoSinalizacao}
                onClick={handleEnviarSinalizacao}
              >
                Enviar sinalização
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ================= TELA DE FILTROS =================
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 pb-2 border-b-2 border-ink">
        <button
          onClick={() => navigate('/aluno')}
          className="text-xs font-bold text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Início
        </button>
        <span className="text-xs font-bold text-ink">· Prática Livre</span>
      </div>

      <div>
        <h2 className="text-xl font-bold font-title">Banco de Prática</h2>
        <p className="text-xs text-muted">
          Escolha os filtros pedagógicos para praticar com feedback imediato.
        </p>
      </div>

      {/* Seletor de Curso */}
      <Combobox
        label="Curso"
        tamanho="sm"
        opcoes={cursos.map((c) => ({ valor: c.id, rotulo: c.nome }))}
        valor={cursoId}
        aoMudar={handleTrocarCurso}
      />

      {/* Chips de Ano */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          Ano do ENADE
        </label>
        <div className="flex gap-2 flex-wrap">
          <Chip
            active={anoSelecionado === null}
            onClick={() => setAnoSelecionado(null)}
          >
            Todos
          </Chip>
          {anosDisponiveis.map((ano) => (
            <Chip
              key={ano}
              active={anoSelecionado === ano}
              onClick={() => setAnoSelecionado(ano)}
            >
              {ano}
            </Chip>
          ))}
        </div>
      </div>

      {/* Chips de Tema */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          Tema / Matéria
        </label>
        <div className="flex gap-2 flex-wrap">
          <Chip
            active={temaSelecionado === null}
            onClick={() => setTemaSelecionado(null)}
          >
            Todos
          </Chip>
          {temasDisponiveis.map((tema) => (
            <Chip
              key={tema.id}
              active={temaSelecionado === tema.id}
              onClick={() => setTemaSelecionado(tema.id)}
            >
              {tema.nome}
            </Chip>
          ))}
        </div>
      </div>

      {/* Card de Contagem de Questões */}
      <Card color="yellow" className="p-3.5 mt-2 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-ink/80 block">Disponíveis</span>
          <span className="text-lg font-title font-extrabold text-ink">
            {totalQuestoes} questões encontradas
          </span>
        </div>
        <BookOpen className="w-6 h-6 text-ink/70" />
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={totalQuestoes === 0}
        onClick={handleIniciarPratica}
      >
        Começar a praticar
      </Button>
    </div>
  );
}

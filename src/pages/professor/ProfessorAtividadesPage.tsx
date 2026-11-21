import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { Turma, Atividade, Questao, StatusAtividade } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import {
  Plus,
  ClipboardList,
  CheckCircle,
  Trash2,
  Lock,
  FileCheck
} from 'lucide-react';

interface ContextType {
  turmaSelecionada: Turma | null;
}

const ROTULO_STATUS: Record<StatusAtividade, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADA: 'Publicada',
  ENCERRADA: 'Encerrada'
};

export function ProfessorAtividadesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmar = useConfirmacao();
  const { turmaSelecionada } = useOutletContext<ContextType>();

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal Nova Atividade
  const [modalAberta, setModalAberta] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<'SIMULADO' | 'LISTA'>('SIMULADO');
  const [duracaoMinutos, setDuracaoMinutos] = useState<number | ''>(30);
  const [permiteNovasTentativas, setPermiteNovasTentativas] = useState(false);
  const [questoesBanco, setQuestoesBanco] = useState<Questao[]>([]);
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  async function carregarAtividades() {
    if (!turmaSelecionada) return;
    setCarregando(true);
    try {
      const lista = await api.professor.obterAtividadesTurma(turmaSelecionada.id);
      setAtividades(lista);
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAtividades();
  }, [turmaSelecionada]);

  async function abrirModalCriar() {
    setModalAberta(true);
    try {
      const res = await api.professor.obterQuestoes({ status: 'PUBLICADA', tamanho: 50 });
      setQuestoesBanco(res.itens);
    } catch (err) {
      console.error(err);
    }
  }

  function alternarSelecaoQuestao(qId: string) {
    setQuestoesSelecionadas((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  }

  async function handleCriarAtividade(publicarImediatamente = false) {
    if (!turmaSelecionada) return;
    if (!titulo.trim()) {
      toast('Informe o título da atividade.');
      return;
    }
    if (questoesSelecionadas.length === 0) {
      toast('Selecione pelo menos uma questão do banco.');
      return;
    }

    if (
      publicarImediatamente &&
      !(await confirmar({
        titulo: 'Criar e publicar atividade?',
        mensagem: `"${titulo.trim()}" fica disponível para os alunos de ${turmaSelecionada.nome} na hora. Depois de publicada, não pode mais ser alterada.`,
        rotuloConfirmar: 'Publicar',
      }))
    ) {
      return;
    }

    setSalvando(true);
    try {
      const nova = await api.professor.criarAtividadeTurma(turmaSelecionada.id, {
        titulo: titulo.trim(),
        tipo,
        duracaoMinutos: duracaoMinutos !== '' ? Number(duracaoMinutos) : null,
        maxTentativas: permiteNovasTentativas ? null : 1,
        questaoIds: questoesSelecionadas
      });

      if (publicarImediatamente) {
        await api.professor.publicarAtividade(nova.id);
        toast('Atividade criada e publicada para os alunos!');
      } else {
        toast('Atividade salva como rascunho!');
      }

      setModalAberta(false);
      setTitulo('');
      setQuestoesSelecionadas([]);
      await carregarAtividades();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao criar atividade.');
    } finally {
      setSalvando(false);
    }
  }

  async function handlePublicar(atv: Atividade) {
    const ok = await confirmar({
      titulo: 'Publicar atividade?',
      mensagem: `"${atv.titulo}" fica disponível para os alunos na hora. Depois de publicada, não pode mais ser alterada.`,
      rotuloConfirmar: 'Publicar',
    });
    if (!ok) return;
    try {
      await api.professor.publicarAtividade(atv.id);
      toast('Atividade publicada com sucesso!');
      await carregarAtividades();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao publicar atividade.');
    }
  }

  async function handleEncerrar(atv: Atividade) {
    const ok = await confirmar({
      titulo: 'Encerrar atividade?',
      mensagem: `"${atv.titulo}" deixa de aceitar respostas, inclusive de quem está fazendo agora. Uma atividade encerrada não pode ser reaberta.`,
      rotuloConfirmar: 'Encerrar',
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.professor.encerrarAtividade(atv.id);
      toast('Atividade encerrada.');
      await carregarAtividades();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao encerrar atividade.');
    }
  }

  async function handleExcluir(atv: Atividade) {
    const ok = await confirmar({
      titulo: 'Excluir rascunho?',
      mensagem: `O rascunho "${atv.titulo}" será apagado. Essa ação não pode ser desfeita.`,
      rotuloConfirmar: 'Excluir',
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.professor.excluirAtividade(atv.id);
      toast('Atividade excluída.');
      await carregarAtividades();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao excluir atividade.');
    }
  }

  if (!turmaSelecionada) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink">
            Atividades & Simulados
          </h1>
          <p className="text-xs lg:text-sm text-muted">
            Turma: <b>{turmaSelecionada.nome}</b> · Listas de treino e simulados avaliativos.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={abrirModalCriar}>
          <Plus className="w-4 h-4" />
          Nova atividade
        </Button>
      </div>

      {/* Lista de Atividades */}
      <div className="flex flex-col gap-3">
        {carregando ? (
          <div className="p-8 text-center text-xs font-bold text-muted">
            Carregando atividades...
          </div>
        ) : atividades.length === 0 ? (
          <Card className="p-8 text-center bg-paper">
            <p className="text-sm font-bold text-muted">
              Nenhuma atividade cadastrada para esta turma.
            </p>
            <Button variant="primary" size="sm" onClick={abrirModalCriar} className="mt-3">
              + Criar primeira atividade
            </Button>
          </Card>
        ) : (
          atividades.map((atv) => (
            <Card key={atv.id} className="p-4 bg-paper flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl border-2 border-ink flex items-center justify-center text-ink flex-none shadow-brutal-sm ${
                      atv.tipo === 'SIMULADO' ? 'bg-yellow' : 'bg-blue'
                    }`}
                  >
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-ink">{atv.titulo}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                      <span>{atv.totalQuestoes} questões</span>
                      <span>•</span>
                      <span>{atv.duracaoMinutos ? `${atv.duracaoMinutos} min` : 'Sem tempo'}</span>
                      <span>•</span>
                      <span>{atv.maxTentativas === null ? 'Novas tentativas permitidas' : `${atv.maxTentativas} tentativa`}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Tag
                    color={
                      atv.status === 'PUBLICADA'
                        ? 'green'
                        : atv.status === 'ENCERRADA'
                        ? 'pink'
                        : 'paper'
                    }
                  >
                    {ROTULO_STATUS[atv.status]}
                  </Tag>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between pt-2 border-t border-ink/20 text-xs">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/professor/atividades/${atv.id}/resultados`)}
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Ver resultados
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {atv.status === 'RASCUNHO' && (
                    <Button variant="green" size="sm" onClick={() => handlePublicar(atv)}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Publicar
                    </Button>
                  )}

                  {atv.status === 'PUBLICADA' && (
                    <Button variant="ghost" size="sm" onClick={() => handleEncerrar(atv)}>
                      <Lock className="w-3.5 h-3.5 text-muted" />
                      Encerrar
                    </Button>
                  )}

                  {atv.status === 'RASCUNHO' && (
                    <Button variant="ghost" size="sm" onClick={() => handleExcluir(atv)}>
                      <Trash2 className="w-3.5 h-3.5 text-pink" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Nova Atividade */}
      <Modal
        aberto={modalAberta}
        aoFechar={() => setModalAberta(false)}
        titulo="Criar Nova Atividade"
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Título da Atividade"
            placeholder="Ex: Simulado 1 — Banco de Dados e Redes"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full bg-paper border-[2.5px] border-ink rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="SIMULADO">Simulado (Avaliativo)</option>
                <option value="LISTA">Lista de Exercícios (Treino)</option>
              </select>
            </div>

            <Input
              label="Duração em minutos (vazio = livre)"
              type="number"
              placeholder="Ex: 30"
              value={duracaoMinutos}
              onChange={(e) => setDuracaoMinutos(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink select-none">
            <input
              type="checkbox"
              checked={permiteNovasTentativas}
              onChange={(e) => setPermiteNovasTentativas(e.target.checked)}
              className="w-4 h-4 accent-orange cursor-pointer"
            />
            Permitir que o aluno refaça a atividade em novas tentativas
          </label>

          {/* Selecionador de Questões do Banco */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Selecione as questões do banco ({questoesSelecionadas.length} selecionadas)
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto border-2 border-ink rounded-xl bg-bg p-2 flex flex-col gap-2">
              {questoesBanco.length === 0 ? (
                <p className="text-xs text-muted text-center p-4">
                  Nenhuma questão publicada disponível no banco para selecionar.
                </p>
              ) : (
                questoesBanco.map((q) => {
                  const marcada = questoesSelecionadas.includes(q.id);

                  return (
                    <div
                      key={q.id}
                      onClick={() => alternarSelecaoQuestao(q.id)}
                      className={`p-2.5 rounded-xl border-2 flex items-start gap-2.5 cursor-pointer transition-all ${
                        marcada ? 'bg-yellow/30 border-ink shadow-brutal-sm' : 'bg-paper border-ink/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={marcada}
                        onChange={() => {}}
                        className="w-4 h-4 accent-orange mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag color="blue" className="text-[10px] py-0">
                            {q.tema.nome}
                          </Tag>
                          <span className="text-[11px] font-bold text-muted">
                            ENADE {q.ano}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-ink line-clamp-2">
                          {q.enunciado}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-3 border-t-2 border-ink/20">
            <Button variant="ghost" onClick={() => setModalAberta(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              carregando={salvando}
              onClick={() => handleCriarAtividade(false)}
            >
              Salvar rascunho
            </Button>
            <Button
              variant="primary"
              carregando={salvando}
              onClick={() => handleCriarAtividade(true)}
            >
              Criar e publicar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { AtividadeAluno } from '@/api/models';
import { CODIGO_MINUTOS, duracaoPorExtenso, outraUnidade, rotuloUnidade } from '@/lib/duracao';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export function AlunoAtividadeDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  const [atividade, setAtividade] = useState<AtividadeAluno | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    async function carregar() {
      if (!id) return;
      try {
        const dados = await api.aluno.obterAtividadeDetalhe(id);
        setAtividade(dados);
      } catch (err: any) {
        toast(err.mensagem || 'Erro ao carregar detalhes da atividade.');
        navigate('/aluno');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [id, navigate, toast]);

  async function handleIniciar() {
    if (!id || !atividade) return;
    // Retomar uma tentativa aberta não gasta nada; só a nova pede confirmação.
    if (!atividade.tentativaAbertaId) {
      const restantes =
        atividade.maxTentativas === null ? null : atividade.maxTentativas - atividade.tentativasFeitas;
      const ok = await confirmar({
        titulo: 'Iniciar atividade?',
        mensagem: (
          <>
            {atividade.duracaoMinutos
              ? `O cronômetro de ${duracaoPorExtenso(atividade)} começa agora e não pausa se você sair da tela.`
              : 'Esta atividade não tem tempo limite.'}
            {restantes !== null &&
              ` Esta tentativa conta no seu limite: ${
                restantes <= 1 ? 'é a última que você tem' : `restam ${restantes}, incluindo esta`
              }.`}
          </>
        ),
        rotuloConfirmar: 'Iniciar',
        rotuloCancelar: 'Agora não',
      });
      if (!ok) return;
    }
    setIniciando(true);
    try {
      const tentativa = await api.aluno.iniciarTentativa(id);
      navigate(`/aluno/tentativa/${tentativa.id}`);
    } catch (err: any) {
      toast(err.mensagem || 'Não foi possível iniciar a tentativa.');
    } finally {
      setIniciando(false);
    }
  }

  if (carregando || !atividade) {
    return (
      <div className="p-8 text-center text-xs font-bold text-muted">
        Carregando atividade...
      </div>
    );
  }

  const tentativasIlimitadas = atividade.maxTentativas === null;
  // O número grande mostra o que o professor digitou; a linha de baixo, a outra unidade
  const comTempo = atividade.duracaoMinutos !== null;
  const valorDuracao = atividade.duracao ?? atividade.duracaoMinutos;
  const codigoDuracao = atividade.unidadeTempo?.codigo ?? CODIGO_MINUTOS;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 pb-2 border-b-2 border-ink">
        <button
          onClick={() => navigate('/aluno')}
          className="text-xs font-bold text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <span className="text-xs font-bold text-ink truncate">
          · {atividade.titulo}
        </span>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold font-title text-ink">{atividade.titulo}</h2>
          {atividade.status === 'ENCERRADA' && (
            <Tag color="paper">Encerrada</Tag>
          )}
        </div>
        <p className="text-xs text-muted mt-1">
          {atividade.tipo === 'SIMULADO' ? 'Simulado oficial' : 'Lista de exercícios'}
        </p>
      </div>

      {atividade.status === 'ENCERRADA' && (
        <Card className="p-3.5 bg-paper border-2 border-ink">
          <div className="flex items-center gap-2 text-ink">
            <AlertTriangle className="w-4 h-4 text-orange flex-none" />
            <p className="text-xs font-bold">
              Esta atividade foi encerrada pelo professor e não aceita novos envios ou tentativas.
            </p>
          </div>
        </Card>
      )}

      {/* Grid de Informações Chave */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card color="blue" className="p-3 text-center">
          <div className="text-2xl font-title font-extrabold text-ink">
            {atividade.totalQuestoes ?? 0}
          </div>
          <span className="text-[11px] font-bold text-ink/80 block mt-0.5">
            questões
          </span>
        </Card>

        <Card color="yellow" className="p-3 text-center">
          <div className="text-2xl font-title font-extrabold text-ink">
            {comTempo ? valorDuracao : '—'}
          </div>
          <span className="text-[11px] font-bold text-ink/80 block mt-0.5">
            {comTempo && valorDuracao !== null ? rotuloUnidade(valorDuracao, codigoDuracao) : 'sem tempo'}
          </span>
          {comTempo && (
            <span className="text-[10px] font-bold text-ink/60 block">({outraUnidade(atividade)})</span>
          )}
        </Card>

        <Card color="pink" className="p-3 text-center">
          <div className="text-2xl font-title font-extrabold text-ink">
            {tentativasIlimitadas ? 'Livre' : atividade.maxTentativas}
          </div>
          <span className="text-[11px] font-bold text-ink/80 block mt-0.5">
            tentativa{tentativasIlimitadas ? 's livres' : ''}
          </span>
        </Card>
      </div>

      {/* Instruções */}
      <Card className="p-4 bg-paper">
        <h3 className="font-bold text-sm font-title text-ink mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-orange" />
          Antes de começar
        </h3>
        <ul className="text-xs text-muted leading-relaxed flex flex-col gap-1.5 list-disc list-inside">
          <li>
            {atividade.duracaoMinutos
              ? `O cronômetro começará imediatamente ao tocar em Iniciar. Você terá ${duracaoPorExtenso(atividade)} para a conclusão.`
              : 'Esta atividade não possui tempo limite. Você pode realizá-la no seu próprio ritmo.'}
          </li>
          <li>Suas respostas marcadas são salvas automaticamente questão a questão.</li>
          <li>
            {atividade.duracaoMinutos
              ? 'Ao chegar a zero, suas respostas são enviadas automaticamente.'
              : 'Ao terminar, toque em "Enviar respostas" para calcular seu resultado.'}
          </li>
          <li>O gabarito com as explicações completas estará disponível após a conclusão.</li>
        </ul>
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        carregando={iniciando}
        disabled={!atividade.podeIniciar}
        onClick={handleIniciar}
      >
        {atividade.status === 'ENCERRADA'
          ? 'Atividade encerrada'
          : atividade.tentativaAbertaId
            ? 'Continuar tentativa'
            : atividade.podeIniciar
              ? 'Iniciar atividade'
              : 'Tentativas esgotadas'}
      </Button>
    </div>
  );
}

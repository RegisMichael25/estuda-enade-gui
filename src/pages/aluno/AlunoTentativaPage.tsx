import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { TentativaEstado, QuestaoAluno } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { formatarTempo } from '@/lib/utils';
import { Clock, Send, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export function AlunoTentativaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  const [tentativa, setTentativa] = useState<TentativaEstado | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const [salvandoResposta, setSalvandoResposta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const enviadoRef = useRef(false);

  useEffect(() => {
    async function carregar() {
      if (!id) return;
      try {
        const dados = await api.aluno.obterTentativa(id);
        if (dados.finalizada) {
          navigate(`/aluno/tentativa/${id}/resultado`, { replace: true });
          return;
        }

        setTentativa(dados);
        setRespostas(dados.respostas || {});

        if (dados.expiraEm) {
          const agoraServidor = dados.agora ? new Date(dados.agora).getTime() : Date.now();
          const expiraEm = new Date(dados.expiraEm).getTime();
          const diferenca = Math.max(0, Math.floor((expiraEm - agoraServidor) / 1000));
          setSegundosRestantes(diferenca);
        }
      } catch (err: any) {
        toast(err.mensagem || 'Erro ao carregar tentativa.');
        navigate('/aluno');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [id, navigate, toast]);

  // Cronômetro regressivo
  useEffect(() => {
    if (segundosRestantes === null || segundosRestantes <= 0) return;

    const timer = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Tempo esgotado: auto-envio
          if (!enviadoRef.current) {
            handleFinalizarTentativa(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [segundosRestantes]);

  async function handleSelecionarAlternativa(alternativaId: string) {
    if (!tentativa || !id) return;
    const q = tentativa.questoes[indiceAtual];
    if (!q) return;

    // Atualiza estado local imediatamente
    setRespostas((prev) => ({ ...prev, [q.id]: alternativaId }));

    // Salva incrementalmente no backend
    setSalvandoResposta(true);
    try {
      await api.aluno.salvarResposta(id, q.id, alternativaId);
    } catch (err) {
      console.error('Erro ao salvar resposta:', err);
    } finally {
      setSalvandoResposta(false);
    }
  }

  async function handleFinalizarTentativa(autoEnvio = false) {
    if (!id || enviadoRef.current) return;
    enviadoRef.current = true;
    setEnviando(true);

    try {
      if (autoEnvio) {
        toast('Tempo esgotado! Suas respostas foram enviadas.');
      }
      await api.aluno.enviarTentativa(id);
      navigate(`/aluno/tentativa/${id}/resultado`, { replace: true });
    } catch (err: any) {
      enviadoRef.current = false;
      toast(err.mensagem || 'Erro ao enviar respostas.');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando || !tentativa) {
    return (
      <div className="p-8 text-center text-xs font-bold text-muted">
        Carregando simulado...
      </div>
    );
  }

  const questoes = tentativa.questoes || [];
  const qAtual = questoes[indiceAtual];
  const totalQuestoes = questoes.length;
  const totalMarcadas = Object.keys(respostas).length;
  const pendentes = totalQuestoes - totalMarcadas;

  async function handlePedirEnvio() {
    const ok = await confirmar({
      titulo: 'Finalizar e enviar simulado?',
      mensagem: (
        <div className="flex flex-col gap-3">
          <p className="text-ink/90">
            Você respondeu <b>{totalMarcadas}</b> de <b>{totalQuestoes}</b> questões.
          </p>
          {pendentes > 0 && (
            <div className="p-3 bg-pink/20 border-2 border-ink rounded-xl text-xs font-bold text-ink flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-pink flex-none" />
              <span>
                Atenção: ainda {pendentes === 1 ? 'resta 1 questão' : `restam ${pendentes} questões`} sem
                resposta!
              </span>
            </div>
          )}
          <p>Ao confirmar, sua tentativa será encerrada e você verá seu gabarito e pontuação.</p>
        </div>
      ),
      rotuloConfirmar: 'Sim, enviar agora',
      rotuloCancelar: 'Revisar mais',
    });
    if (ok) handleFinalizarTentativa(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de cabeçalho da tentativa */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
        <span className="text-xs font-bold text-ink">
          Questão {indiceAtual + 1} de {totalQuestoes}
        </span>

        {segundosRestantes !== null && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-ink font-mono font-bold text-xs ${
              segundosRestantes <= 180 ? 'bg-pink animate-pulse text-ink' : 'bg-yellow text-ink'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatarTempo(segundosRestantes)}</span>
          </div>
        )}
      </div>

      {/* Régua / Grade de navegação entre as questões */}
      <div className="flex gap-1.5 flex-wrap">
        {questoes.map((q, idx) => {
          const ativa = idx === indiceAtual;
          const respondida = !!respostas[q.id];

          let estilo = 'bg-paper text-ink hover:bg-bg';
          if (ativa) estilo = 'bg-yellow text-ink font-extrabold shadow-brutal-sm';
          else if (respondida) estilo = 'bg-blue text-ink font-bold';

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndiceAtual(idx)}
              className={`w-7 h-7 rounded-lg border-2 border-ink text-xs flex items-center justify-center transition-all cursor-pointer ${estilo}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Questão Atual */}
      {qAtual && (
        <div className="flex flex-col gap-3">
          <Card className="p-4 bg-paper">
            <p className="text-sm font-medium text-ink leading-relaxed whitespace-pre-wrap">
              {qAtual.enunciado}
            </p>
          </Card>

          <div className="flex flex-col gap-2.5">
            {qAtual.alternativas.map((alt, idx) => {
              const letra = String.fromCharCode(65 + idx);
              const selecionada = respostas[qAtual.id] === alt.id;

              return (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => handleSelecionarAlternativa(alt.id)}
                  className={`w-full text-left p-3 rounded-xl border-[2.5px] border-ink flex items-start gap-3 transition-all cursor-pointer ${
                    selecionada
                      ? 'bg-yellow text-ink shadow-brutal-sm font-medium'
                      : 'bg-paper text-ink hover:bg-bg'
                  }`}
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
        </div>
      )}

      {/* Controles de Navegação Anterior / Próxima ou Enviar respostas */}
      <div className="flex gap-2 mt-2">
        <Button
          variant="secondary"
          size="md"
          disabled={indiceAtual === 0}
          onClick={() => setIndiceAtual((i) => Math.max(0, i - 1))}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </Button>

        {indiceAtual === totalQuestoes - 1 ? (
          <Button
            variant="primary"
            size="md"
            carregando={enviando}
            onClick={handlePedirEnvio}
            className="flex-1"
          >
            <Send className="w-4 h-4" />
            Enviar respostas ({totalMarcadas}/{totalQuestoes})
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIndiceAtual((i) => Math.min(totalQuestoes - 1, i + 1))}
            className="flex-1"
          >
            Próxima
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
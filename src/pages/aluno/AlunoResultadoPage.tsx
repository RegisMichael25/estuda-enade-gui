import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { ResultadoTentativa } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressMeter } from '@/components/ui/Tag';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { MuralComentarios } from '@/components/MuralComentarios';
import { CheckCircle2, XCircle, ArrowLeft, ChevronDown, ChevronUp, Home } from 'lucide-react';

export function AlunoResultadoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [resultado, setResultado] = useState<ResultadoTentativa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      if (!id) return;
      try {
        const dados = await api.aluno.obterResultadoTentativa(id);
        setResultado(dados);
      } catch (err: any) {
        toast(err.mensagem || 'Erro ao carregar resultado.');
        navigate('/aluno');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [id, navigate, toast]);

  if (carregando || !resultado) {
    return (
      <div className="p-8 text-center text-xs font-bold text-muted">
        Carregando resultado...
      </div>
    );
  }

  const { tentativa, questoes, porTema, tempoSegundos } = resultado;
  const tempoMinutos = Math.max(1, Math.round(tempoSegundos / 60));
  const acertos = tentativa.acertos ?? 0; // null só antes da correção; o resultado já vem corrigido
  const percentual = tentativa.total > 0 ? Math.round((acertos / tentativa.total) * 100) : 0;

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
        <span className="text-xs font-bold text-ink">· Resultado</span>
      </div>

      {/* Hero do Resultado */}
      <Card color={percentual >= 60 ? 'green' : 'yellow'} className="p-6 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-ink/80">
          Tentativa Concluída
        </span>
        <div className="text-5xl font-extrabold font-title text-ink my-2">
          {acertos}/{tentativa.total}
        </div>
        <p className="text-sm font-bold text-ink">
          {percentual >= 70
            ? 'Excelente desempenho!'
            : percentual >= 50
            ? 'Bom trabalho! Continue praticando.'
            : 'Foco nos pontos de melhoria!'}
        </p>
        <p className="text-xs text-ink/80 mt-1">
          Tempo utilizado: <b>{tempoMinutos} min</b> · Nota: <b>{percentual}%</b>
        </p>
      </Card>

      {/* Desempenho por Tema */}
      {porTema && porTema.length > 0 && (
        <Card className="p-4 bg-paper flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Acertos por tema
          </span>

          {porTema.map((item, idx) => {
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
          })}
        </Card>
      )}

      {/* Gabarito e Justificativas Questão a Questão */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Gabarito & Justificativas
        </span>

        {questoes.map((q, idx) => {
          const aberto = expandidoId === q.id;

          return (
            <Card key={q.id} className="p-3.5 bg-paper">
              <div
                onClick={() => setExpandidoId(aberto ? null : q.id)}
                className="flex items-start justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg border-2 border-ink bg-bg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag color="blue" className="text-[10px] py-0 px-2">
                        {q.tema?.nome}
                      </Tag>
                      {q.acertou ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Acertou
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Errou
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-ink mt-1.5 line-clamp-2">
                      {q.enunciado}
                    </p>
                  </div>
                </div>

                {aberto ? (
                  <ChevronUp className="w-4 h-4 text-muted flex-none" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted flex-none" />
                )}
              </div>

              {aberto && (
                <div className="mt-3 pt-3 border-t border-ink/20 flex flex-col gap-2 animate-in fade-in duration-150">
                  <div className="text-xs text-ink/90 bg-bg p-3 rounded-xl border border-ink/30 whitespace-pre-wrap">
                    {q.enunciado}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {q.alternativas.map((alt, aIdx) => {
                      const letra = alt.letra || String.fromCharCode(65 + aIdx);
                      const eCorreta = alt.correta === true;
                      const marcadaPeloAluno = alt.id === q.alternativaMarcadaId;

                      let badge = '';
                      let estilo = 'bg-paper text-ink border-ink/40';

                      if (eCorreta) {
                        estilo = 'bg-green/30 border-green font-bold text-ink';
                        badge = ' (Gabarito Oficial)';
                      }
                      if (marcadaPeloAluno && !eCorreta) {
                        estilo = 'bg-pink/30 border-pink line-through text-ink';
                        badge = ' (Sua resposta)';
                      } else if (marcadaPeloAluno && eCorreta) {
                        badge = ' (Sua resposta - Correta)';
                      }

                      return (
                        <div
                          key={alt.id}
                          className={`p-2.5 rounded-xl border-2 text-xs flex items-start gap-2 ${estilo}`}
                        >
                          <span className="font-bold">{letra}.</span>
                          <span className="flex-1 leading-snug">
                            {alt.texto}
                            <span className="font-bold text-[11px]">{badge}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explicacao && (
                    <div className="p-3 bg-yellow/30 border-2 border-ink rounded-xl text-xs text-ink">
                      <b>Explicação Pedagógica:</b> {q.explicacao}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Mural aberto à turma: a API só libera depois do envio da primeira tentativa */}
      <MuralComentarios key={tentativa.atividadeId} atividadeId={tentativa.atividadeId} papel="aluno" />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={() => navigate('/aluno')}
        className="mt-2"
      >
        <Home className="w-4 h-4" />
        Voltar ao início
      </Button>
    </div>
  );
}

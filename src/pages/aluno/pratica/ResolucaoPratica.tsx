import { useState } from 'react';
import type { QuestaoAluno } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { ModalSinalizarQuestao, BotaoSinalizar } from '@/components/ModalSinalizarQuestao';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, CheckCircle, Flag, XCircle } from 'lucide-react';
import type { Resposta } from './estado';

interface ResolucaoPraticaProps {
  prova: QuestaoAluno[];
  respostas: Record<string, Resposta>;
  indice: number;
  /** Questões que não podem ser respondidas agora (ocultadas ou em atividade aberta do aluno). */
  indisponiveis?: Set<string>;
  /** Prova concluída: só consulta, sem responder. */
  somenteLeitura?: boolean;
  aoIrPara: (indice: number) => void;
  /** Registra a resposta (a página chama a API e guarda o gabarito). */
  aoResponder: (questaoId: string, alternativaId: string) => Promise<void>;
  aoFinalizar: () => void;
}

const ROTULO_ESTADO = {
  pendente: '',
  acertou: ', acertou',
  errou: ', errou',
  indisponivel: ', indisponível',
};

/** Uma questão por vez, com gabarito e justificativa logo depois de responder. */
export function ResolucaoPratica({
  prova,
  respostas,
  indice,
  indisponiveis,
  somenteLeitura = false,
  aoIrPara,
  aoResponder,
  aoFinalizar,
}: ResolucaoPraticaProps) {
  const { toast } = useToast();
  const q = prova[indice];
  const resposta = q ? respostas[q.id] : undefined;
  const gabarito = resposta?.gabarito ?? null;
  const respondido = !!resposta;
  const indisponivel = !!q && !!indisponiveis?.has(q.id);
  const bloqueada = respondido || indisponivel || somenteLeitura;

  // A página monta este componente com `key` = id da questão: ao trocar de questão, a marcação
  // recomeça da resposta já dada (ou vazia)
  const [selecionada, setSelecionada] = useState<string | null>(resposta?.alternativaId ?? null);
  const [respondendo, setRespondendo] = useState(false);
  const [modalSinalizarAberto, setModalSinalizarAberto] = useState(false);

  if (!q) return null;
  const ultima = indice === prova.length - 1;

  async function responder() {
    if (!selecionada) {
      toast('Selecione uma alternativa.');
      return;
    }
    setRespondendo(true);
    try {
      await aoResponder(q.id, selecionada);
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao registrar resposta.');
    } finally {
      setRespondendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mapa da prova: pula para qualquer questão e mostra o que já foi respondido */}
      <nav aria-label="Questões da prova" className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {prova.map((item, i) => {
          const r = respostas[item.id];
          const estado = indisponiveis?.has(item.id) ? 'indisponivel' : !r ? 'pendente' : r.gabarito.acertou ? 'acertou' : 'errou';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => aoIrPara(i)}
              aria-current={i === indice ? 'step' : undefined}
              aria-label={`Questão ${i + 1}${ROTULO_ESTADO[estado]}`}
              className={cn(
                'min-w-8 h-8 px-1.5 rounded-lg border-2 border-ink text-xs font-extrabold shrink-0 cursor-pointer transition-all',
                estado === 'acertou' && 'bg-green',
                estado === 'errou' && 'bg-pink',
                estado === 'pendente' && 'bg-paper hover:bg-bg',
                estado === 'indisponivel' && 'bg-bg text-muted line-through',
                i === indice && 'ring-2 ring-orange ring-offset-1 shadow-brutal-sm'
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 text-xs font-bold text-muted">
        <span className="flex items-center gap-2 min-w-0">
          <Tag color="blue">{q.tema.nome}</Tag>
          <span className="truncate">ENADE {q.ano}</span>
        </span>
        <BotaoSinalizar onClick={() => setModalSinalizarAberto(true)} title="Sinalizar problema nesta questão" />
      </div>

      {indisponivel && (
        <Card color="lilac" className="p-3.5">
          <p className="text-xs font-bold text-ink">Esta questão não está disponível agora.</p>
          <p className="text-xs text-ink/80 mt-0.5">
            Ela foi retirada do banco ou faz parte de uma atividade sua ainda não concluída. Depois de enviar a
            atividade, ela volta para a prática.
          </p>
        </Card>
      )}

      <Card className="p-4 bg-paper">
        <p className="text-sm font-medium text-ink leading-relaxed whitespace-pre-wrap">{q.enunciado}</p>
      </Card>

      <div className="flex flex-col gap-2.5">
        {q.alternativas.map((alt, idx) => {
          const letra = String.fromCharCode(65 + idx);
          const marcada = selecionada === alt.id;
          const eCorreta = gabarito && gabarito.alternativaCorretaId === alt.id;
          const eIncorreta = respondido && marcada && !gabarito?.acertou;

          let estilo = 'bg-paper text-ink hover:bg-bg';
          if (marcada && !respondido) estilo = 'bg-yellow shadow-brutal-sm';
          if (eCorreta) estilo = 'bg-green text-ink shadow-brutal-sm font-bold';
          else if (eIncorreta) estilo = 'bg-pink text-ink line-through opacity-80';

          return (
            <button
              key={alt.id}
              type="button"
              disabled={bloqueada}
              onClick={() => setSelecionada(alt.id)}
              aria-pressed={marcada}
              className={`w-full text-left p-3 rounded-xl border-[2.5px] border-ink flex items-start gap-3 transition-all cursor-pointer disabled:cursor-default ${estilo}`}
            >
              <span className="w-6 h-6 rounded-lg border-2 border-ink bg-paper flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {letra}
              </span>
              <span className="text-xs font-medium leading-snug flex-1">{alt.texto}</span>
            </button>
          );
        })}
      </div>

      {somenteLeitura && !respondido && !indisponivel && (
        <p className="text-xs font-bold text-muted text-center">Ficou sem resposta nesta prova.</p>
      )}

      {!bloqueada && (
        <Button variant="primary" size="lg" fullWidth carregando={respondendo} onClick={responder}>
          Responder
        </Button>
      )}

      {respondido && gabarito && (
        <Card color={gabarito.acertou ? 'green' : 'pink'} className="p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              {gabarito.acertou ? <CheckCircle className="w-5 h-5 text-ink flex-none" /> : <XCircle className="w-5 h-5 text-ink flex-none" />}
              <h4 className="font-bold text-sm font-title text-ink">
                {gabarito.acertou ? 'Você acertou!' : 'Resposta incorreta'} · Gabarito: Letra {gabarito.letraCorreta}
              </h4>
            </div>
            <BotaoSinalizar
              onClick={() => setModalSinalizarAberto(true)}
              title="Sinalizar problema no gabarito ou justificativa"
              variante="pill"
            />
          </div>
          {gabarito.explicacao && (
            <p className="text-xs text-ink/90 leading-relaxed mt-2 pt-2 border-t border-ink/20">
              <b>Justificativa:</b> {gabarito.explicacao}
            </p>
          )}
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" size="md" className="flex-1" disabled={indice === 0} onClick={() => aoIrPara(indice - 1)}>
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </Button>
        {respondido && (
          <Button variant="secondary" size="md" onClick={() => setModalSinalizarAberto(true)} aria-label="Sinalizar questão">
            <Flag className="w-4 h-4 text-orange" />
          </Button>
        )}
        {ultima ? (
          <Button variant={bloqueada ? 'primary' : 'secondary'} size="md" className="flex-1" onClick={aoFinalizar}>
            Ver resultado
          </Button>
        ) : (
          <Button variant={bloqueada ? 'primary' : 'secondary'} size="md" className="flex-1" onClick={() => aoIrPara(indice + 1)}>
            {bloqueada ? 'Próxima' : 'Pular'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ModalSinalizarQuestao
        aberto={modalSinalizarAberto}
        aoFechar={() => setModalSinalizarAberto(false)}
        questaoId={q.id}
        papel="aluno"
      />
    </div>
  );
}

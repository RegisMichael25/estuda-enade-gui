import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { ProvaPessoal } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { useToast } from '@/components/ui/Toast';
import { Cabecalho } from './pratica/Cabecalho';
import { ResolucaoPratica } from './pratica/ResolucaoPratica';
import { ResumoPratica } from './pratica/ResumoPratica';
import type { Resposta } from './pratica/estado';

/**
 * Prova montada pelo aluno, salva no servidor: dá para fechar e continuar em outro aparelho.
 * Em andamento abre na primeira questão sem resposta; concluída abre no resultado.
 */
export function AlunoProvaPage() {
  const { provaId = '' } = useParams();
  const navigate = useNavigate();
  const confirmar = useConfirmacao();
  const { toast } = useToast();

  const [dados, setDados] = useState<ProvaPessoal | null>(null);
  const [erro, setErro] = useState(false);
  const [indice, setIndice] = useState(0);
  const [verResumo, setVerResumo] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);

  useEffect(() => {
    let ativo = true;
    setDados(null);
    setErro(false);
    api.aluno
      .obterProva(provaId)
      .then((p) => {
        if (!ativo) return;
        setDados(p);
        const pendente = p.questoes.findIndex((q) => q.disponivel && !q.gabarito);
        setIndice(pendente === -1 ? 0 : pendente);
        setVerResumo(!!p.prova.concluidaEm);
      })
      .catch(() => ativo && setErro(true));
    return () => {
      ativo = false;
    };
  }, [provaId]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [indice, verResumo]);

  const questoes = useMemo(() => dados?.questoes.map((q) => q.questao) ?? [], [dados]);
  const respostas = useMemo(() => {
    const r: Record<string, Resposta> = {};
    dados?.questoes.forEach((q) => {
      if (q.gabarito) r[q.questao.id] = { alternativaId: q.gabarito.alternativaMarcadaId ?? null, gabarito: q.gabarito };
    });
    return r;
  }, [dados]);
  const indisponiveis = useMemo(
    () => new Set(dados?.questoes.filter((q) => !q.disponivel).map((q) => q.questao.id) ?? []),
    [dados]
  );

  if (erro) {
    return (
      <Card className="p-6 text-center max-w-3xl">
        <p className="text-sm font-bold">Prova não encontrada.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/aluno/provas')}>
          Ver minhas provas
        </Button>
      </Card>
    );
  }
  if (!dados) {
    return <p className="text-xs text-muted">Carregando prova...</p>;
  }

  const concluida = !!dados.prova.concluidaEm;

  async function responder(questaoId: string, alternativaId: string) {
    const gabarito = await api.aluno.responderNaProva(provaId, questaoId, alternativaId);
    setDados((d) =>
      d && {
        prova: {
          ...d.prova,
          respondidas: d.prova.respondidas + 1,
          acertos: d.prova.acertos + (gabarito.acertou ? 1 : 0),
        },
        questoes: d.questoes.map((q) => (q.questao.id === questaoId ? { ...q, gabarito } : q)),
      }
    );
  }

  async function finalizar() {
    if (concluida) {
      setVerResumo(true);
      return;
    }
    const pendentes = dados!.questoes.filter((q) => q.disponivel && !q.gabarito).length;
    if (pendentes > 0) {
      const ok = await confirmar({
        titulo: 'Concluir a prova?',
        mensagem: `${pendentes} ${pendentes === 1 ? 'questão ficou' : 'questões ficaram'} sem resposta e contam como não acertadas. Depois de concluir, não dá mais para responder nesta prova.`,
        rotuloConfirmar: 'Concluir e ver resultado',
        rotuloCancelar: 'Continuar respondendo',
      });
      if (!ok) return;
    }
    try {
      setDados(await api.aluno.concluirProva(provaId));
      setVerResumo(true);
    } catch (err: any) {
      toast(err.mensagem || 'Não foi possível concluir a prova.');
    }
  }

  /** Refazer ou praticar as erradas cria outra prova e abre ela. */
  async function novaProva(criar: (id: string) => Promise<ProvaPessoal>) {
    setAcaoEmAndamento(true);
    try {
      const nova = await criar(provaId);
      navigate(`/aluno/provas/${nova.prova.id}`);
    } catch (err: any) {
      toast(err.mensagem || 'Não foi possível criar a prova.');
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  if (verResumo) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <Cabecalho
          rotuloVoltar="Minhas provas"
          aoVoltar={() => navigate('/aluno/provas')}
          direita={<span className="text-xs font-bold text-ink truncate">{dados.prova.nome}</span>}
        />
        <ResumoPratica
          prova={questoes}
          respostas={respostas}
          ocupado={acaoEmAndamento}
          aoRefazer={() => novaProva(api.aluno.refazerProva)}
          aoPraticarErradas={() => novaProva(api.aluno.provaComErradas)}
          aoMontarOutra={() => navigate('/aluno/pratica')}
          aoAbrirQuestao={(i) => {
            setIndice(i);
            setVerResumo(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Cabecalho
        rotuloVoltar="Minhas provas"
        aoVoltar={() => navigate('/aluno/provas')}
        direita={
          <span className="text-xs font-bold text-ink">
            {concluida ? 'Concluída · ' : ''}
            {indice + 1} de {questoes.length}
          </span>
        }
      />
      <ResolucaoPratica
        key={questoes[indice]?.id}
        prova={questoes}
        respostas={respostas}
        indice={indice}
        indisponiveis={indisponiveis}
        somenteLeitura={concluida}
        aoIrPara={setIndice}
        aoResponder={responder}
        aoFinalizar={finalizar}
      />
    </div>
  );
}

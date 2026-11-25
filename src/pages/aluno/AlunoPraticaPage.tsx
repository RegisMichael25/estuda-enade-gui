import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { QuestaoAluno } from '@/api/models';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { useToast } from '@/components/ui/Toast';
import { History } from 'lucide-react';
import { Cabecalho } from './pratica/Cabecalho';
import { EtapaConteudo } from './pratica/EtapaConteudo';
import { EtapaQuestoes } from './pratica/EtapaQuestoes';
import { EtapaRevisao } from './pratica/EtapaRevisao';
import { carregarEstado, salvarEstado, type EstadoMontagem } from './pratica/estado';

/**
 * Prática livre: o aluno monta a própria prova (escolhendo à mão, sorteando ou os dois). Ao começar, a
 * prova é salva e aberta em /aluno/provas/:id. É só dele: nada vai para a turma do professor.
 */
export function AlunoPraticaPage() {
  const navigate = useNavigate();
  const confirmar = useConfirmacao();
  const { toast } = useToast();
  // "?foco=fracos" vem do atalho "Praticar temas fracos" (Início): abre no conteúdo com esses temas marcados
  const [parametros, setParametros] = useSearchParams();
  const focoFracos = parametros.get('foco') === 'fracos';
  const [estado, setEstado] = useState<EstadoMontagem>(() => {
    const salvo = carregarEstado();
    return focoFracos ? { ...salvo, fase: 'conteudo' } : salvo;
  });
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    salvarEstado(estado);
  }, [estado]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [estado.fase]);

  function atualizar(parcial: Partial<EstadoMontagem>) {
    setEstado((e) => ({ ...e, ...parcial }));
  }

  /** Salva a prova no servidor e abre a resolução. A montagem recomeça vazia, mantendo o conteúdo. */
  async function comecar(prova: QuestaoAluno[], nome?: string) {
    if (prova.length === 0 || criando) return;
    setCriando(true);
    try {
      const criada = await api.aluno.criarProva(prova.map((q) => q.id), nome);
      setEstado((e) => ({ ...e, prova: [], fase: 'conteudo' }));
      navigate(`/aluno/provas/${criada.prova.id}`);
    } catch (err: any) {
      toast(err.mensagem || 'Não foi possível salvar a prova.');
    } finally {
      setCriando(false);
    }
  }

  async function mudarConteudo(parcial: Partial<Pick<EstadoMontagem, 'cursoId' | 'temaIds' | 'anos' | 'historico'>>) {
    // Trocar de curso desfaz a prova: as questões escolhidas são do outro curso
    if (parcial.cursoId !== undefined && parcial.cursoId !== estado.cursoId && estado.prova.length > 0) {
      const ok = await confirmar({
        titulo: 'Trocar de curso?',
        mensagem: `As ${estado.prova.length} questões já escolhidas saem da prova.`,
        rotuloConfirmar: 'Trocar de curso',
        rotuloCancelar: 'Manter',
      });
      if (!ok) return;
      atualizar({ ...parcial, prova: [] });
      return;
    }
    atualizar(parcial);
  }

  const linkHistorico = (
    <Link to="/aluno/provas" className="text-xs font-bold text-ink hover:text-orange flex items-center gap-1">
      <History className="w-3.5 h-3.5" />
      Minhas provas
    </Link>
  );

  if (estado.fase === 'revisao') {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <Cabecalho rotuloVoltar="Questões" aoVoltar={() => atualizar({ fase: 'questoes' })} passo={2} direita={linkHistorico} />
        <EtapaRevisao
          prova={estado.prova}
          aoMudarProva={(p) => atualizar({ prova: p })}
          aoAdicionarMais={() => atualizar({ fase: 'questoes' })}
          aoComecar={() => comecar(estado.prova)}
          comecando={criando}
        />
      </div>
    );
  }

  if (estado.fase === 'questoes' && estado.cursoId) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <Cabecalho rotuloVoltar="Conteúdo" aoVoltar={() => atualizar({ fase: 'conteudo' })} passo={1} direita={linkHistorico} />
        <EtapaQuestoes
          cursoId={estado.cursoId}
          temaIds={estado.temaIds}
          anos={estado.anos}
          historico={estado.historico}
          prova={estado.prova}
          aoMudarProva={(p) => atualizar({ prova: p })}
          aoRevisar={() => atualizar({ fase: 'revisao' })}
          aoComecar={comecar}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Cabecalho rotuloVoltar="Início" aoVoltar={() => navigate('/aluno')} passo={0} direita={linkHistorico} />
      <EtapaConteudo
        cursoId={estado.cursoId}
        temaIds={estado.temaIds}
        anos={estado.anos}
        historico={estado.historico}
        aoMudar={mudarConteudo}
        aoAvancar={() => atualizar({ fase: 'questoes' })}
        focoFracos={focoFracos}
        aoAplicarFoco={() => setParametros({}, { replace: true })}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { ContagemTema, Curso, HistoricoPratica } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Combobox } from '@/components/ui/Combobox';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { percentual, PERCENTUAL_TEMA_FRACO, temaFraco } from './estado';

interface EtapaConteudoProps {
  cursoId: string;
  temaIds: string[];
  anos: number[];
  historico: HistoricoPratica;
  aoMudar: (parcial: { cursoId?: string; temaIds?: string[]; anos?: number[]; historico?: HistoricoPratica }) => void;
  aoAvancar: () => void;
  /** Veio do atalho "Praticar temas fracos": marca os temas fracos assim que o curso carregar. */
  focoFracos?: boolean;
  aoAplicarFoco?: () => void;
}

const OPCOES_HISTORICO: { valor: HistoricoPratica; rotulo: string }[] = [
  { valor: 'TODAS', rotulo: 'Todas' },
  { valor: 'NAO_RESPONDIDAS', rotulo: 'Ainda não respondi' },
  { valor: 'ERRADAS', rotulo: 'Só as que errei' },
];

function alternar<T>(lista: T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

/** Passo 1: curso, temas e anos da prova. Nenhum tema ou ano marcado vale como "todos". */
export function EtapaConteudo({
  cursoId,
  temaIds,
  anos,
  historico,
  aoMudar,
  aoAvancar,
  focoFracos = false,
  aoAplicarFoco,
}: EtapaConteudoProps) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [contagem, setContagem] = useState<ContagemTema[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    api.catalogo.obterCursos().then(setCursos).catch((err) => console.error('Erro ao carregar cursos:', err));
  }, []);

  useEffect(() => {
    setAnosDisponiveis([]);
    if (!cursoId) return;
    api.aluno.obterAnosPratica(cursoId).then(setAnosDisponiveis).catch((err) => console.error('Erro ao carregar anos:', err));
  }, [cursoId]);

  // A contagem por tema depende dos anos escolhidos
  const chaveAnos = anos.join(',');
  useEffect(() => {
    setContagem([]);
    if (!cursoId) return;
    let ativo = true;
    setCarregando(true);
    api.aluno
      .obterContagemPratica(cursoId, anos, historico)
      .then((c) => ativo && setContagem(c))
      .catch((err) => console.error('Erro ao contar questões:', err))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // Os anos entram pela chave: o array muda de identidade a cada render
  }, [cursoId, chaveAnos, historico]);

  // Um tema marcado que ficou sem questão com os anos escolhidos deixa de valer
  const temasValidos = temaIds.filter((id) => contagem.some((c) => c.tema.id === id));
  const disponiveis = contagem
    .filter((c) => temasValidos.length === 0 || temasValidos.includes(c.tema.id))
    .reduce((soma, c) => soma + c.total, 0);
  const fracos = contagem.filter(temaFraco);
  // Sem curso escolhido, o atalho escolhe o curso com mais temas fracos
  useEffect(() => {
    if (!focoFracos || cursoId || cursos.length === 0) return;
    let ativo = true;
    Promise.all(
      cursos.map((c) =>
        api.aluno
          .obterContagemPratica(c.id, [], 'TODAS')
          .then((lista) => ({ id: c.id, fracos: lista.filter(temaFraco).length }))
          .catch(() => ({ id: c.id, fracos: 0 }))
      )
    ).then((porCurso) => {
      if (!ativo) return;
      const melhor = porCurso.reduce((a, b) => (b.fracos > a.fracos ? b : a));
      if (melhor.fracos > 0) aoMudar({ cursoId: melhor.id, temaIds: [], anos: [] });
      else aoAplicarFoco?.();
    });
    return () => {
      ativo = false;
    };
  }, [focoFracos, cursoId, cursos]);

  useEffect(() => {
    if (!focoFracos || carregando || contagem.length === 0) return;
    if (fracos.length > 0) aoMudar({ temaIds: fracos.map((f) => f.tema.id) });
    aoAplicarFoco?.();
  }, [focoFracos, carregando, contagem]);

  const soFracos = fracos.length > 0 && temasValidos.length === fracos.length && fracos.every((f) => temasValidos.includes(f.tema.id));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold font-title">Monte sua prova</h2>
        <p className="text-xs text-muted">
          Escolha o conteúdo, depois as questões. É só para você praticar: nada vai para a turma.
        </p>
      </div>

      <Card className="p-4 bg-paper flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-ink">Curso</span>
          <Combobox
            tamanho="sm"
            placeholder="Selecione o curso"
            opcoes={cursos.map((c) => ({ valor: c.id, rotulo: c.nome }))}
            valor={cursoId}
            aoMudar={(id) => id !== cursoId && aoMudar({ cursoId: id, temaIds: [], anos: [] })}
            mensagemVazia="Nenhum curso cadastrado"
          />
        </div>

        {cursoId && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink">Questões</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filtrar pelo que você já respondeu">
                {OPCOES_HISTORICO.map((o) => (
                  <Chip
                    key={o.valor}
                    role="radio"
                    aria-checked={historico === o.valor}
                    active={historico === o.valor}
                    onClick={() => aoMudar({ historico: o.valor })}
                    className="text-xs"
                  >
                    {o.rotulo}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">Temas</span>
                <span className="text-xs text-muted">
                  {temasValidos.length === 0 ? 'Todos os temas' : `${temasValidos.length} escolhido(s)`}
                </span>
              </div>
              {carregando && contagem.length === 0 ? (
                <p className="text-xs text-muted">Carregando temas...</p>
              ) : contagem.length === 0 ? (
                <p className="text-xs text-muted">
                  {historico === 'ERRADAS'
                    ? 'Nenhuma questão errada para refazer com esses filtros.'
                    : historico === 'NAO_RESPONDIDAS'
                      ? 'Você já respondeu todas as questões com esses filtros.'
                      : 'Nenhuma questão disponível neste curso com esses anos.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {contagem.map((c) => {
                    const fraco = temaFraco(c);
                    const ativo = temasValidos.includes(c.tema.id);
                    return (
                      <Chip
                        key={c.tema.id}
                        active={ativo}
                        aria-pressed={ativo}
                        onClick={() => aoMudar({ temaIds: alternar(temasValidos, c.tema.id) })}
                        title={
                          c.respondidas > 0
                            ? `Você acertou ${c.acertos} de ${c.respondidas} (${percentual(c.acertos, c.respondidas)}%) neste tema`
                            : 'Você ainda não respondeu questões deste tema'
                        }
                        className={cn('text-xs', fraco && !ativo && 'bg-pink/40')}
                      >
                        {fraco && <TrendingDown className="w-3.5 h-3.5 inline mr-1 -mt-0.5" aria-label="Tema fraco" />}
                        {c.tema.nome} <span className="opacity-70">· {c.total}</span>
                      </Chip>
                    );
                  })}
                </div>
              )}
              {fracos.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-pink/20 border-2 border-ink/20 px-3 py-2">
                  <p className="text-xs text-ink">
                    <b>{fracos.length === 1 ? '1 tema fraco' : `${fracos.length} temas fracos`}</b>: você acerta menos de{' '}
                    {PERCENTUAL_TEMA_FRACO}% neles.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={soFracos}
                    onClick={() => aoMudar({ temaIds: fracos.map((f) => f.tema.id) })}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    {soFracos ? 'Temas fracos escolhidos' : 'Praticar meus temas fracos'}
                  </Button>
                </div>
              )}
            </div>

            {anosDisponiveis.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">Anos do ENADE</span>
                  <span className="text-xs text-muted">{anos.length === 0 ? 'Todos os anos' : `${anos.length} escolhido(s)`}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {anosDisponiveis.map((a) => (
                    <Chip
                      key={a}
                      active={anos.includes(a)}
                      aria-pressed={anos.includes(a)}
                      onClick={() => aoMudar({ anos: alternar(anos, a) })}
                      className="text-xs"
                    >
                      {a}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {cursoId && (
        <Card color="yellow" className="p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-ink/80 block">Disponíveis para a sua prova</span>
            <span className="text-lg font-title font-extrabold text-ink">
              {disponiveis} {disponiveis === 1 ? 'questão' : 'questões'}
            </span>
          </div>
        </Card>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!cursoId || disponiveis === 0}
        onClick={() => {
          if (temasValidos.length !== temaIds.length) aoMudar({ temaIds: temasValidos });
          aoAvancar();
        }}
      >
        Escolher as questões
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

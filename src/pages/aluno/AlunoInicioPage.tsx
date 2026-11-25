import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ChevronDown, ClipboardList, History, Play, Timer, TrendingDown } from 'lucide-react';
import { api } from '@/api/client';
import type { AtividadeAluno, DesempenhoAluno, ProvaPessoalResumo, TemaDesempenho } from '@/api/models';
import { formatarDuracao } from '@/lib/duracao';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { percentual, temaFraco } from './pratica/estado';

/** Situação da atividade para o aluno, na ordem em que aparece na lista. */
type Situacao = 'andamento' | 'afazer' | 'refazer' | 'concluida' | 'encerrada';
const ORDEM: Situacao[] = ['andamento', 'afazer', 'refazer', 'concluida', 'encerrada'];
const PENDENTES: Situacao[] = ['andamento', 'afazer', 'refazer'];

function situacao(a: AtividadeAluno): Situacao {
  if (a.tentativaAbertaId) return 'andamento';
  if (a.status === 'ENCERRADA') return 'encerrada';
  if (a.podeIniciar) return a.tentativasFeitas === 0 ? 'afazer' : 'refazer';
  return 'concluida';
}

/** Temas fracos mostrados no Início; a lista completa fica em Desempenho. */
const MAXIMO_TEMAS_NO_INICIO = 3;
const LINK_TEMAS_FRACOS = '/aluno/pratica?foco=fracos';

interface ProximoPasso {
  rotulo: string;
  titulo: string;
  detalhe: string;
  acao: string;
  destino: string;
  Icone: LucideIcon;
}

/**
 * Uma única sugestão do que fazer agora: o que está pela metade vem antes do que é novo, e a
 * atividade da turma vem antes do estudo individual.
 */
function proximoPasso(
  atividades: AtividadeAluno[],
  prova: ProvaPessoalResumo | null,
  fracos: TemaDesempenho[],
  respondidas: number
): ProximoPasso {
  const emAndamento = atividades.find((a) => situacao(a) === 'andamento');
  if (emAndamento) {
    return {
      rotulo: 'Termine o que começou',
      titulo: emAndamento.titulo,
      detalhe: emAndamento.duracaoMinutos
        ? `Tentativa em andamento · o tempo continua contando · ${formatarDuracao(emAndamento)}`
        : `Tentativa em andamento · ${emAndamento.turma.nome}`,
      acao: 'Continuar tentativa',
      destino: `/aluno/tentativa/${emAndamento.tentativaAbertaId}`,
      Icone: Timer,
    };
  }
  if (prova) {
    return {
      rotulo: 'Continue sua prova',
      titulo: prova.nome,
      detalhe: `${prova.respondidas} de ${prova.total} questões respondidas`,
      acao: 'Continuar prova',
      destino: `/aluno/provas/${prova.id}`,
      Icone: History,
    };
  }
  const nova = atividades.find((a) => situacao(a) === 'afazer');
  if (nova) {
    return {
      rotulo: 'Nova atividade da turma',
      titulo: nova.titulo,
      detalhe: `${nova.turma.nome} · ${nova.totalQuestoes} questões · ${formatarDuracao(nova)}`,
      acao: 'Ver atividade',
      destino: `/aluno/atividade/${nova.id}`,
      Icone: ClipboardList,
    };
  }
  if (fracos.length > 0) {
    const pior = fracos[0];
    return {
      rotulo: 'Reforce um tema',
      titulo: pior.tema,
      detalhe: `Você acertou ${pior.acertos} de ${pior.respondidas} (${pior.percentual}%) neste tema`,
      acao: fracos.length === 1 ? 'Praticar este tema' : 'Praticar temas fracos',
      destino: LINK_TEMAS_FRACOS,
      Icone: TrendingDown,
    };
  }
  return {
    rotulo: respondidas === 0 ? 'Comece por aqui' : 'Continue praticando',
    titulo: respondidas === 0 ? 'Monte sua primeira prova' : 'Monte uma nova prova',
    detalhe: 'Escolha temas e questões do ENADE, ou sorteie, e veja o gabarito na hora.',
    acao: 'Montar prova',
    destino: '/aluno/pratica',
    Icone: Play,
  };
}

export function AlunoInicioPage() {
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [atividades, setAtividades] = useState<AtividadeAluno[]>([]);
  const [desempenho, setDesempenho] = useState<DesempenhoAluno | null>(null);
  // Prova montada pelo aluno que ficou pela metade (a mais recente)
  const [provaEmAndamento, setProvaEmAndamento] = useState<ProvaPessoalResumo | null>(null);
  const [verAnteriores, setVerAnteriores] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      api.aluno.obterAtividades().catch((): AtividadeAluno[] => []),
      api.aluno.obterDesempenho().catch((): DesempenhoAluno | null => null),
      api.aluno.listarProvas().catch((): ProvaPessoalResumo[] => []),
    ]).then(([listaAtividades, dadosDesempenho, provas]) => {
      if (!ativo) return;
      setAtividades(listaAtividades);
      setDesempenho(dadosDesempenho);
      setProvaEmAndamento(provas.find((p) => !p.concluidaEm) ?? null);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const respondidas = desempenho?.respondidas ?? 0;
  // Do mais fraco para o menos fraco
  const fracos = (desempenho?.porTema ?? [])
    .filter(temaFraco)
    .sort((a, b) => a.percentual - b.percentual || b.respondidas - a.respondidas);

  const ordenadas = [...atividades].sort((a, b) => ORDEM.indexOf(situacao(a)) - ORDEM.indexOf(situacao(b)));
  const pendentes = ordenadas.filter((a) => PENDENTES.includes(situacao(a)));
  const anteriores = ordenadas.filter((a) => !PENDENTES.includes(situacao(a)));

  if (carregando) {
    return <p className="text-xs font-bold text-muted">Carregando...</p>;
  }

  const passo = proximoPasso(atividades, provaEmAndamento, fracos, respondidas);
  const provaNoDestaque = !!provaEmAndamento && passo.destino === `/aluno/provas/${provaEmAndamento.id}`;

  return (
    <div className="flex flex-col gap-5">
      {/* Próximo passo */}
      <Card color="orange" className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0 flex items-start gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-paper border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
            <passo.Icone className="w-5 h-5 sm:w-6 sm:h-6 text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">{passo.rotulo}</span>
            <h2 className="text-xl sm:text-2xl font-extrabold font-title text-white mt-0.5 break-words">{passo.titulo}</h2>
            <p className="text-xs text-white/90 mt-1">{passo.detalhe}</p>
          </div>
        </div>
        <Button variant="secondary" size="md" className="shrink-0 self-start sm:self-center" onClick={() => navigate(passo.destino)}>
          {passo.acao}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>

      {/* Números do aluno */}
      {respondidas > 0 && desempenho && (
        <button
          type="button"
          onClick={() => navigate('/aluno/desempenho')}
          className="grid grid-cols-3 gap-2 text-left cursor-pointer group"
          aria-label="Ver meu desempenho"
        >
          <Numero valor={`${desempenho.percentual ?? 0}%`} rotulo="de acertos" />
          <Numero valor={String(respondidas)} rotulo={respondidas === 1 ? 'questão respondida' : 'questões respondidas'} />
          <Numero
            valor={String(fracos.length)}
            rotulo={fracos.length === 1 ? 'tema a reforçar' : 'temas a reforçar'}
            destaque={fracos.length > 0}
          />
        </button>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
        {/* Atividades da turma */}
        <section className="flex flex-col gap-2.5" aria-labelledby="titulo-atividades">
          <div className="flex items-center justify-between">
            <h3 id="titulo-atividades" className="text-xs font-bold uppercase tracking-wider text-muted">
              Atividades da turma
            </h3>
            <span className="text-xs font-bold text-muted">
              {pendentes.length} {pendentes.length === 1 ? 'pendente' : 'pendentes'}
            </span>
          </div>

          {atividades.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-xs font-bold text-muted">Nenhuma atividade da sua turma por enquanto.</p>
              <button
                type="button"
                onClick={() => navigate('/aluno/turmas')}
                className="mt-1 text-xs font-bold text-ink underline underline-offset-2 hover:text-orange cursor-pointer"
              >
                Ver minhas turmas
              </button>
            </Card>
          ) : (
            <>
              {pendentes.length === 0 && (
                <Card className="p-4 text-center">
                  <p className="text-xs font-bold text-muted">Tudo em dia: nenhuma atividade pendente.</p>
                </Card>
              )}
              {pendentes.map((a) => (
                <ItemAtividade key={a.id} atividade={a} />
              ))}

              {anteriores.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setVerAnteriores((v) => !v)}
                    aria-expanded={verAnteriores}
                    className="self-start text-xs font-bold text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                  >
                    {verAnteriores ? 'Esconder' : 'Ver'} concluídas e encerradas ({anteriores.length})
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', verAnteriores && 'rotate-180')} />
                  </button>
                  {verAnteriores && anteriores.map((a) => <ItemAtividade key={a.id} atividade={a} />)}
                </>
              )}
            </>
          )}
        </section>

        {/* Estudo individual */}
        <section className="flex flex-col gap-2.5" aria-labelledby="titulo-estudo">
          <h3 id="titulo-estudo" className="text-xs font-bold uppercase tracking-wider text-muted">
            Estudo individual
          </h3>

          {provaEmAndamento && !provaNoDestaque && (
            <Card
              color="yellow"
              interactive
              onClick={() => navigate(`/aluno/provas/${provaEmAndamento.id}`)}
              className="p-4 flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-paper border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
                <History className="w-5 h-5 text-ink" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-ink">Continuar prova</h4>
                <p className="text-xs text-ink/80 mt-0.5 truncate">
                  {provaEmAndamento.nome} · {provaEmAndamento.respondidas} de {provaEmAndamento.total} respondidas
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-ink flex-none" />
            </Card>
          )}

          <Card color="green" interactive onClick={() => navigate('/aluno/pratica')} className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-paper border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
              <Play className="w-5 h-5 text-ink fill-ink" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-ink">Monte sua prova</h4>
              <p className="text-xs text-ink/80 mt-0.5">
                Escolha temas e questões do ENADE, ou sorteie. Só para você: nada vai para a turma.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-ink flex-none" />
          </Card>

          {fracos.length > 0 && (
            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-ink" aria-hidden />
                <h4 className="font-bold text-sm text-ink">Temas para reforçar</h4>
              </div>
              <ul className="flex flex-col gap-2.5">
                {fracos.slice(0, MAXIMO_TEMAS_NO_INICIO).map((t) => (
                  <li key={t.temaId} className="flex flex-col gap-1">
                    <div className="flex justify-between gap-2 text-xs font-bold text-ink">
                      <span className="truncate">{t.tema}</span>
                      <span className="shrink-0">
                        {t.percentual}% <span className="text-muted font-medium">({t.acertos} de {t.respondidas})</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-ink/10 overflow-hidden" aria-hidden>
                      <div className="h-full rounded-full bg-pink border-r-2 border-ink" style={{ width: `${Math.max(t.percentual, 2)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              {fracos.length > MAXIMO_TEMAS_NO_INICIO && (
                <p className="text-[11px] text-muted">
                  E mais {fracos.length - MAXIMO_TEMAS_NO_INICIO} em Desempenho.
                </p>
              )}
              <Button variant="secondary" size="sm" onClick={() => navigate(LINK_TEMAS_FRACOS)}>
                <TrendingDown className="w-3.5 h-3.5" />
                Praticar temas fracos
              </Button>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function Numero({ valor, rotulo, destaque = false }: { valor: string; rotulo: string; destaque?: boolean }) {
  return (
    <div
      className={cn(
        'border-2 border-ink rounded-xl px-3 py-2.5 shadow-brutal-sm transition-transform group-hover:-translate-y-0.5',
        destaque ? 'bg-pink' : 'bg-paper'
      )}
    >
      <div className="text-xl font-extrabold font-title text-ink leading-none">{valor}</div>
      <div className="text-[11px] font-bold text-ink/70 mt-1 leading-tight">{rotulo}</div>
    </div>
  );
}

function ItemAtividade({ atividade: a }: { atividade: AtividadeAluno }) {
  const navigate = useNavigate();
  const s = situacao(a);
  const destino =
    s === 'andamento'
      ? `/aluno/tentativa/${a.tentativaAbertaId}`
      : (s === 'concluida' || s === 'encerrada') && a.melhorTentativaId
        ? `/aluno/tentativa/${a.melhorTentativaId}/resultado`
        : `/aluno/atividade/${a.id}`;

  return (
    <Card interactive onClick={() => navigate(destino)} className={cn('p-3.5 flex items-center gap-3.5', s === 'encerrada' && 'opacity-80')}>
      <div
        className={cn(
          'w-11 h-11 rounded-xl border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm',
          a.tipo === 'SIMULADO' ? 'bg-yellow' : 'bg-blue'
        )}
      >
        <ClipboardList className="w-5 h-5 text-ink" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-ink truncate">{a.titulo}</h4>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted mt-0.5">
          <span className="truncate max-w-[12rem]">{a.turma.nome}</span>
          <span aria-hidden>•</span>
          <span>{a.totalQuestoes} questões</span>
          <span aria-hidden>•</span>
          <span>{formatarDuracao(a)}</span>
          {a.melhorAcertos != null && (
            <>
              <span aria-hidden>•</span>
              <span>
                Melhor: {a.melhorAcertos}/{a.totalQuestoes} ({percentual(a.melhorAcertos, a.totalQuestoes)}%)
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-none">
        {s === 'andamento' && <Tag color="yellow">Em andamento</Tag>}
        {s === 'afazer' && <Tag color="orange">Nova</Tag>}
        {s === 'refazer' && <Tag color="paper">Pode refazer</Tag>}
        {s === 'concluida' && <Tag color="green">Concluída</Tag>}
        {s === 'encerrada' && <Tag color="paper">Encerrada</Tag>}
        <ArrowRight className="w-4 h-4 text-muted flex-none" />
      </div>
    </Card>
  );
}

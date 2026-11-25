import { useEffect, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '@/api/client';
import type { Curso, StatusQuestao, Tema } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface ValorFiltroQuestoes {
  /** `''` enquanto o curso não foi escolhido (ou "Todos os cursos", com `todosOsCursos`). */
  cursoId: string;
  temaId: string | null;
  ano: number | null;
  status: StatusQuestao | null;
  apenasMinhas: boolean;
  apenasSinalizadas: boolean;
  /** Trecho do enunciado; `''` não filtra. */
  busca: string;
}

export function filtroVazio(cursoId = ''): ValorFiltroQuestoes {
  return { cursoId, temaId: null, ano: null, status: null, apenasMinhas: false, apenasSinalizadas: false, busca: '' };
}

function mesmoFiltro(a: ValorFiltroQuestoes, b: ValorFiltroQuestoes): boolean {
  return (Object.keys(a) as (keyof ValorFiltroQuestoes)[]).every((k) => a[k] === b[k]);
}

const ROTULO_STATUS: Record<StatusQuestao, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADA: 'Publicada',
  OCULTA: 'Oculta',
};

interface FiltroQuestoesProps {
  /** Filtro aplicado: é ele que a tela usa para buscar as questões. */
  valor: ValorFiltroQuestoes;
  /** Chamado só ao clicar em Filtrar (ou na lupa / Enter na pesquisa) e em "Limpar filtros". */
  aoMudar: (valor: ValorFiltroQuestoes) => void;
  /** Anos com questão no curso; cada tela usa a rota do seu papel. */
  obterAnos: (cursoId: string) => Promise<number[]>;
  /** Status, "Minhas" e "Sinalizadas": só no banco do professor. */
  filtrosDoBanco?: boolean;
  /** Total de questões encontradas; `null` esconde a contagem. */
  total?: number | null;
  /** `compacto` empilha as etapas, para caber em modal ou coluna estreita. */
  layout?: 'largo' | 'compacto';
  /**
   * Começa recolhido, mostrando só o resumo. Padrão: recolhido quando o curso já vem escolhido
   * (ex.: curso da turma na montagem de atividade) e aberto quando ainda falta escolher.
   */
  iniciarRecolhido?: boolean;
  /**
   * Oferece "Todos os cursos" (cursoId `''`) e já permite filtrar sem escolher curso. O tema só aparece com
   * um curso escolhido, porque o mesmo nome de tema pode existir em cursos diferentes.
   */
  todosOsCursos?: boolean;
  className?: string;
}

function Etapa({ numero, titulo, ativa }: { numero: number; titulo: string; ativa: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'w-6 h-6 rounded-full border-2 border-ink flex items-center justify-center text-xs font-extrabold shrink-0',
          ativa ? 'bg-orange text-white' : 'bg-paper text-ink'
        )}
      >
        {numero}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-ink">{titulo}</span>
    </div>
  );
}

/**
 * Filtro de questões em duas etapas: ① escolher o curso; ② refinar (opcional) por pesquisa no enunciado,
 * tema, ano e, no banco do professor, status, "Minhas" e "Sinalizadas". Trocar o curso limpa tema e ano,
 * porque os dois dependem dele.
 *
 * Os campos editam um rascunho; a busca de questões só acontece ao clicar em Filtrar (ou na lupa / Enter
 * na pesquisa), que aplica tudo de uma vez. Usado no banco de questões, na prática do aluno e na montagem de atividade.
 */
export function FiltroQuestoes({
  valor,
  aoMudar,
  obterAnos,
  filtrosDoBanco = false,
  total = null,
  layout = 'largo',
  iniciarRecolhido,
  todosOsCursos = false,
  className,
}: FiltroQuestoesProps) {
  const [expandido, setExpandido] = useState(() => !(iniciarRecolhido ?? !!valor.cursoId));
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [anos, setAnos] = useState<number[]>([]);

  useEffect(() => {
    if (iniciarRecolhido === false && valor.cursoId) {
      setExpandido(true);
    }
  }, [valor.cursoId, iniciarRecolhido]);

  // O que está nos campos; vira filtro aplicado só ao clicar em Filtrar
  const [rascunho, setRascunho] = useState<ValorFiltroQuestoes>(valor);
  useEffect(() => {
    setRascunho(valor);
  }, [valor]);

  useEffect(() => {
    api.catalogo
      .obterCursos()
      .then(setCursos)
      .catch((err) => console.error('Erro ao carregar cursos:', err));
  }, []);

  // Tema e ano dependem do curso escolhido nos campos (catálogo, não é a busca de questões)
  useEffect(() => {
    setTemas([]);
    setAnos([]);
    if (!rascunho.cursoId && !todosOsCursos) return;

    let ativo = true;
    Promise.all([
      rascunho.cursoId ? api.catalogo.obterTemas(rascunho.cursoId) : Promise.resolve([]),
      obterAnos(rascunho.cursoId),
    ])
      .then(([listaTemas, listaAnos]) => {
        if (!ativo) return;
        setTemas(listaTemas);
        setAnos(listaAnos);
      })
      .catch((err) => console.error('Erro ao carregar temas e anos do curso:', err));
    return () => {
      ativo = false;
    };
    // Só o curso dispara a recarga: obterAnos pode ser uma função nova a cada render
  }, [rascunho.cursoId]);

  function mudar(parcial: Partial<ValorFiltroQuestoes>) {
    setRascunho((r) => ({ ...r, ...parcial }));
  }

  function trocarCurso(cursoId: string) {
    if (cursoId === rascunho.cursoId) return;
    // Mantém os filtros que não dependem do curso
    setRascunho((r) => ({ ...r, cursoId, temaId: null, ano: null }));
  }

  function aplicar() {
    if (!rascunho.cursoId && !todosOsCursos) return;
    aoMudar({ ...rascunho, busca: rascunho.busca.trim() });
  }

  function limpar() {
    const vazio = filtroVazio(rascunho.cursoId);
    setRascunho(vazio);
    aoMudar(vazio);
  }

  const temCursoAplicado = !!valor.cursoId || todosOsCursos;
  const temCurso = !!rascunho.cursoId;
  // Com "Todos os cursos", dá para pesquisar e refinar sem escolher um curso
  const podeFiltrar = temCurso || todosOsCursos;
  const pendente = !mesmoFiltro({ ...rascunho, busca: rascunho.busca.trim() }, valor);
  const refinado =
    !!rascunho.temaId || !!rascunho.ano || !!rascunho.status || rascunho.apenasMinhas ||
    rascunho.apenasSinalizadas || !!rascunho.busca.trim() ||
    !!valor.temaId || !!valor.ano || !!valor.status || valor.apenasMinhas || valor.apenasSinalizadas || !!valor.busca;

  // O resumo do cabeçalho mostra o filtro aplicado, que é o que a lista exibe
  const resumo = [
    valor.cursoId ? cursos.find((c) => c.id === valor.cursoId)?.nome : 'Todos os cursos',
    valor.busca ? `"${valor.busca}"` : null,
    temas.find((t) => t.id === valor.temaId)?.nome,
    valor.ano ? String(valor.ano) : null,
    valor.status ? ROTULO_STATUS[valor.status] : null,
    valor.apenasMinhas ? 'Minhas' : null,
    valor.apenasSinalizadas ? 'Sinalizadas' : null,
  ].filter(Boolean);

  const largo = layout === 'largo';

  return (
    // Sem overflow-hidden: a lista dos selects precisa poder passar da borda do card
    <Card className={cn('p-0 bg-paper', className)}>
      {/* Cabeçalho: sempre visível, com o resumo do filtro aplicado; clicar recolhe ou expande */}
      <button
        type="button"
        onClick={() => setExpandido((e) => !e)}
        aria-expanded={expandido}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-bg/60',
          expandido ? 'rounded-t-2xl' : 'rounded-2xl'
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="w-4 h-4 shrink-0 text-ink" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink shrink-0">Filtros</span>
          <span className="text-xs font-bold text-muted truncate">
            {temCursoAplicado ? `· ${resumo.join(' · ')}` : '· Escolha o curso'}
          </span>
        </span>
        <span className="flex items-center gap-3 shrink-0">
          {temCursoAplicado && total !== null && (
            <span className="text-xs font-bold text-ink">
              {total} {total === 1 ? 'questão' : 'questões'}
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-ink transition-transform', expandido && 'rotate-180')} />
        </span>
      </button>

      {expandido && (
        <div className="px-4 pb-4 pt-3 flex flex-col gap-4 border-t-2 border-ink/20">
          <div className={cn('grid gap-4', largo && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]')}>
            {/* ① Curso */}
            <div className="flex flex-col gap-2">
              <Etapa numero={1} titulo="Curso" ativa={!podeFiltrar} />
              <Combobox
                tamanho="sm"
                placeholder={todosOsCursos ? 'Todos os cursos' : 'Selecione o curso'}
                opcoes={[
                  ...(todosOsCursos ? [{ valor: '', rotulo: 'Todos os cursos' }] : []),
                  ...cursos.map((c) => ({ valor: c.id, rotulo: c.nome })),
                ]}
                valor={rascunho.cursoId}
                aoMudar={trocarCurso}
                mensagemVazia="Nenhum curso cadastrado"
              />
              {!podeFiltrar && (
                <p className="text-xs text-muted">Escolha o curso para pesquisar e refinar por tema e ano.</p>
              )}
            </div>

            {/* ② Refinar (opcional) */}
            {podeFiltrar && (
              <div className={cn('flex flex-col gap-2', largo && 'lg:pl-4 lg:border-l-2 lg:border-ink/20')}>
                <Etapa numero={2} titulo="Refinar (opcional)" ativa />

                {/* Pesquisa no enunciado: a lupa e o Enter aplicam o filtro inteiro */}
                <div className="relative">
                  <input
                    type="search"
                    aria-label="Pesquisar no enunciado"
                    placeholder="Pesquisar no enunciado"
                    maxLength={200}
                    value={rascunho.busca}
                    onChange={(e) => mudar({ busca: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        aplicar();
                      }
                    }}
                    className="w-full bg-paper text-ink text-sm font-bold border-[2.5px] border-ink rounded-xl pl-3.5 pr-11 py-2 placeholder:text-muted/60 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-orange/40"
                  />
                  <button
                    type="button"
                    onClick={aplicar}
                    aria-label="Pesquisar"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-ink hover:text-orange cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>

                <div className={cn('grid gap-2', filtrosDoBanco ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                  <Combobox
                    tamanho="sm"
                    disabled={!temCurso}
                    placeholder={temCurso ? 'Todos os temas' : 'Tema: escolha um curso'}
                    opcoes={[
                      { valor: '', rotulo: 'Todos os temas' },
                      ...temas.map((t) => ({ valor: t.id, rotulo: t.nome })),
                    ]}
                    valor={rascunho.temaId ?? ''}
                    aoMudar={(id) => mudar({ temaId: id || null })}
                    mensagemVazia="Nenhum tema neste curso"
                  />
                  <Combobox
                    tamanho="sm"
                    placeholder="Todos os anos"
                    opcoes={[
                      { valor: '', rotulo: 'Todos os anos' },
                      ...anos.map((a) => ({ valor: String(a), rotulo: String(a) })),
                    ]}
                    valor={rascunho.ano ? String(rascunho.ano) : ''}
                    aoMudar={(a) => mudar({ ano: a ? Number(a) : null })}
                    mensagemVazia="Nenhum ano com questão"
                  />
                  {filtrosDoBanco && (
                    <Combobox
                      tamanho="sm"
                      placeholder="Todos os status"
                      opcoes={[
                        { valor: '', rotulo: 'Todos os status' },
                        ...(Object.keys(ROTULO_STATUS) as StatusQuestao[]).map((st) => ({
                          valor: st,
                          rotulo: ROTULO_STATUS[st],
                        })),
                      ]}
                      valor={rascunho.status ?? ''}
                      aoMudar={(st) => mudar({ status: (st || null) as StatusQuestao | null })}
                    />
                  )}
                </div>
                {filtrosDoBanco && (
                  <div className="flex gap-2 flex-wrap">
                    <Chip active={rascunho.apenasMinhas} onClick={() => mudar({ apenasMinhas: !rascunho.apenasMinhas })}>
                      Minhas
                    </Chip>
                    <Chip
                      active={rascunho.apenasSinalizadas}
                      onClick={() => mudar({ apenasSinalizadas: !rascunho.apenasSinalizadas })}
                    >
                      Sinalizadas
                    </Chip>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ações: Filtrar aplica tudo (curso, pesquisa e refinamentos) de uma vez */}
          <div className="flex items-center justify-end gap-3 flex-wrap pt-3 border-t-2 border-ink/20">
            {pendente && podeFiltrar && (
              <span className="text-xs font-bold text-muted mr-auto">Alterações ainda não aplicadas</span>
            )}
            {refinado && (
              <button
                type="button"
                onClick={limpar}
                className="text-xs font-bold text-muted hover:text-ink underline flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
                Limpar filtros
              </button>
            )}
            <Button
              type="button"
              variant={pendente ? 'primary' : 'secondary'}
              size="sm"
              disabled={!podeFiltrar}
              onClick={aplicar}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtrar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

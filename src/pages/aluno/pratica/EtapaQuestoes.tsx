import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { HistoricoPratica, QuestaoAluno } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ItemQuestaoSelecionavel } from '@/components/ItemQuestaoSelecionavel';
import { ArrowRight, GraduationCap, Play, Search, Shuffle } from 'lucide-react';
import { MAXIMO_POR_SORTEIO, QUANTIDADES_SUGERIDAS, QUESTOES_SIMULADO_ENADE } from './estado';

const POR_PAGINA = 20;

interface EtapaQuestoesProps {
  cursoId: string;
  temaIds: string[];
  anos: number[];
  historico: HistoricoPratica;
  prova: QuestaoAluno[];
  aoMudarProva: (prova: QuestaoAluno[]) => void;
  aoRevisar: () => void;
  /** Começa direto com a prova dada (atalhos "Sortear e começar" e "Simulado ENADE"). */
  aoComecar: (prova: QuestaoAluno[], nome?: string) => void;
}

/** Passo 2: escolher as questões à mão, sortear, ou os dois. */
export function EtapaQuestoes({ cursoId, temaIds, anos, historico, prova, aoMudarProva, aoRevisar, aoComecar }: EtapaQuestoesProps) {
  const { toast } = useToast();

  // ---------- sorteio ----------
  const [quantidade, setQuantidade] = useState<number>(QUANTIDADES_SUGERIDAS[0]);
  const [quantidadeLivre, setQuantidadeLivre] = useState('');
  const [sorteando, setSorteando] = useState(false);

  const quantidadeEscolhida = quantidadeLivre ? Number(quantidadeLivre) : quantidade;
  const quantidadeValida =
    Number.isInteger(quantidadeEscolhida) && quantidadeEscolhida >= 1 && quantidadeEscolhida <= MAXIMO_POR_SORTEIO;

  /**
   * Sorteia e adiciona à prova (ou começa direto). O Simulado ENADE é uma prova nova de 35 questões
   * repartidas igualmente entre os temas escolhidos.
   */
  async function sortear(modo: 'adicionar' | 'comecar' | 'simulado') {
    const simulado = modo === 'simulado';
    const quantidadePedida = simulado ? QUESTOES_SIMULADO_ENADE : quantidadeEscolhida;
    if (!simulado && !quantidadeValida) {
      toast(`Escolha de 1 a ${MAXIMO_POR_SORTEIO} questões.`);
      return;
    }
    setSorteando(true);
    try {
      const base = simulado ? [] : prova;
      const novas = await api.aluno.sortearPratica({
        cursoId,
        temaIds,
        anos,
        historico,
        equilibrar: simulado,
        quantidade: quantidadePedida,
        excluirIds: base.map((q) => q.id),
      });
      if (novas.length === 0) {
        toast(base.length ? 'Não há mais questões para sortear com esse conteúdo.' : 'Nenhuma questão encontrada.');
        return;
      }
      if (novas.length < quantidadePedida) {
        toast(`Só havia ${novas.length} ${novas.length === 1 ? 'questão disponível' : 'questões disponíveis'}.`);
      }
      const atualizada = [...base, ...novas];
      if (modo === 'adicionar') {
        aoMudarProva(atualizada);
      } else {
        aoComecar(atualizada, simulado ? 'Simulado ENADE' : undefined);
      }
    } catch (err: any) {
      toast(err.mensagem || 'Não foi possível sortear as questões.');
    } finally {
      setSorteando(false);
    }
  }

  // ---------- escolha à mão ----------
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [lista, setLista] = useState<QuestaoAluno[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [carregando, setCarregando] = useState(false);

  async function carregar(numeroPagina: number) {
    setCarregando(true);
    try {
      const res = await api.aluno.obterQuestoesPratica({
        cursoId,
        temaIds,
        anos,
        historico,
        busca: buscaAplicada || undefined,
        pagina: numeroPagina,
        tamanho: POR_PAGINA,
      });
      setLista((atual) => (numeroPagina === 0 ? res.itens : [...atual, ...res.itens]));
      setTotal(res.total);
      setPagina(numeroPagina);
    } catch {
      toast('Não foi possível carregar as questões.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar(0);
    // Recarrega quando muda o conteúdo ou a pesquisa aplicada (listas entram pela chave)
  }, [cursoId, temaIds.join(','), anos.join(','), historico, buscaAplicada]);

  const idsNaProva = new Set(prova.map((q) => q.id));

  function alternar(q: QuestaoAluno) {
    aoMudarProva(idsNaProva.has(q.id) ? prova.filter((p) => p.id !== q.id) : [...prova, q]);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Atalho: simulado no formato do ENADE */}
      <Card color="lilac" className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold font-title flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" />
            Simulado ENADE
          </h3>
          <p className="text-xs text-ink/80">
            {QUESTOES_SIMULADO_ENADE} questões objetivas, como na prova, repartidas igualmente entre os temas escolhidos.
          </p>
        </div>
        <Button variant="primary" size="md" disabled={sorteando} onClick={() => sortear('simulado')}>
          <Play className="w-4 h-4" />
          Começar simulado
        </Button>
      </Card>

      {/* Sortear */}
      <Card className="p-4 bg-paper flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-bold font-title flex items-center gap-1.5">
            <Shuffle className="w-4 h-4" />
            Sortear questões
          </h3>
          <p className="text-xs text-muted">Sorteia entre os temas e anos escolhidos, sem repetir as que já estão na prova.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {QUANTIDADES_SUGERIDAS.map((n) => (
            <Chip
              key={n}
              active={!quantidadeLivre && quantidade === n}
              aria-pressed={!quantidadeLivre && quantidade === n}
              onClick={() => {
                setQuantidade(n);
                setQuantidadeLivre('');
              }}
              className="text-xs"
            >
              {n}
            </Chip>
          ))}
          <div className="w-40">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAXIMO_POR_SORTEIO}
              aria-label="Outra quantidade"
              placeholder="Outra quantidade"
              value={quantidadeLivre}
              onChange={(e) => setQuantidadeLivre(e.target.value)}
              className="py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="secondary" size="md" className="flex-1" carregando={sorteando} onClick={() => sortear('adicionar')}>
            <Shuffle className="w-4 h-4" />
            {prova.length ? 'Sortear e adicionar' : 'Sortear'}
          </Button>
          <Button variant="primary" size="md" className="flex-1" disabled={sorteando} onClick={() => sortear('comecar')}>
            <Play className="w-4 h-4" />
            Sortear e começar
          </Button>
        </div>
      </Card>

      {/* Escolher à mão */}
      <Card className="p-4 bg-paper flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold font-title">Escolher à mão</h3>
          <span className="text-xs text-muted">
            {total} {total === 1 ? 'questão' : 'questões'}
          </span>
        </div>

        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            setBuscaAplicada(busca.trim());
          }}
        >
          <Input
            type="search"
            aria-label="Pesquisar no enunciado"
            placeholder="Pesquisar no enunciado"
            maxLength={200}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pr-11 py-2 text-sm"
          />
          <button
            type="submit"
            aria-label="Pesquisar"
            className="absolute inset-y-0 right-0 px-3 flex items-center text-ink hover:text-orange cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {lista.length === 0 && !carregando ? (
            <p className="text-xs text-muted text-center p-4">Nenhuma questão com esse conteúdo e pesquisa.</p>
          ) : (
            lista.map((q) => (
              <ItemQuestaoSelecionavel
                key={q.id}
                questao={q}
                marcada={idsNaProva.has(q.id)}
                aoAlternar={() => alternar(q)}
                expansivel
              />
            ))
          )}
          {carregando && <p className="text-xs text-muted text-center p-2">Carregando questões...</p>}
          {!carregando && lista.length < total && (
            <Button variant="ghost" size="sm" onClick={() => carregar(pagina + 1)}>
              Carregar mais
            </Button>
          )}
        </div>
      </Card>

      {/*
        Barra com o tamanho da prova. No celular fica fixa acima do menu inferior (quem rola é a janela, não o
        <main>, então `sticky` não funciona ali); o espaçador deixa a última questão rolar até acima dela.
        No desktop o <main> é o contêiner de rolagem e a barra fica presa ao pé dele.
      */}
      <div className="h-24 lg:hidden" aria-hidden />
      <div className="fixed inset-x-4 bottom-24 lg:sticky lg:inset-x-auto lg:bottom-4 z-20 bg-paper border-[2.5px] border-ink rounded-2xl shadow-brutal px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-ink min-w-0">
            {prova.length} {prova.length === 1 ? 'questão' : 'questões'} na prova
          </span>
          <Button variant="primary" size="md" className="shrink-0 whitespace-nowrap" disabled={prova.length === 0} onClick={aoRevisar}>
            Revisar prova
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

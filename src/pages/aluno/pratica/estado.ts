import type { Gabarito, HistoricoPratica, QuestaoAluno } from '@/api/models';

/**
 * Montagem da prova na prática livre (passos 1 a 3). Fica só neste navegador (sessionStorage) até o aluno
 * clicar em "Começar": aí a prova é salva no servidor (`/aluno/provas`) e pode ser retomada em qualquer
 * aparelho. Nada disso vai para a turma.
 */
export type Fase = 'conteudo' | 'questoes' | 'revisao';

export interface Resposta {
  /** Nula se a alternativa marcada deixou de existir (o autor editou a questão). */
  alternativaId: string | null;
  gabarito: Gabarito;
}

export interface EstadoMontagem {
  fase: Fase;
  cursoId: string;
  temaIds: string[];
  anos: number[];
  /** Filtro pelo que o aluno já respondeu. */
  historico: HistoricoPratica;
  /** Questões escolhidas, na ordem em que serão respondidas. */
  prova: QuestaoAluno[];
}

export const QUANTIDADES_SUGERIDAS = [10, 20, 35];
/** Questões objetivas do ENADE (formação geral + componente específico). */
export const QUESTOES_SIMULADO_ENADE = 35;

/** Tema fraco: o aluno já respondeu o bastante para medir e acerta menos que isto. */
export const MINIMO_RESPOSTAS_TEMA_FRACO = 3;
export const PERCENTUAL_TEMA_FRACO = 60;

export function temaFraco(t: { respondidas: number; acertos: number }): boolean {
  return t.respondidas >= MINIMO_RESPOSTAS_TEMA_FRACO && percentual(t.acertos, t.respondidas) < PERCENTUAL_TEMA_FRACO;
}
/** Mesmo teto do sorteio na API. */
export const MAXIMO_POR_SORTEIO = 100;

const CHAVE = 'estuda-enade:pratica-montagem';
const FASES: Fase[] = ['conteudo', 'questoes', 'revisao'];

export function estadoInicial(cursoId = ''): EstadoMontagem {
  return { fase: 'conteudo', cursoId, temaIds: [], anos: [], historico: 'TODAS', prova: [] };
}

export function carregarEstado(): EstadoMontagem {
  try {
    const salvo = sessionStorage.getItem(CHAVE);
    if (salvo) {
      const estado = { ...estadoInicial(), ...(JSON.parse(salvo) as EstadoMontagem) };
      return FASES.includes(estado.fase) ? estado : { ...estado, fase: 'conteudo' };
    }
  } catch {
    // estado corrompido: começa de novo
  }
  return estadoInicial();
}

export function salvarEstado(estado: EstadoMontagem) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // sem espaço ou modo privado: segue só em memória
  }
}

export function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export interface ResumoTema {
  tema: string;
  total: number;
  respondidas: number;
  acertos: number;
}

/** Acertos por tema, na ordem em que o tema aparece na prova. */
export function resumoPorTema(prova: QuestaoAluno[], respostas: Record<string, Resposta>): ResumoTema[] {
  const porTema = new Map<string, ResumoTema>();
  for (const q of prova) {
    const item = porTema.get(q.tema.id) ?? { tema: q.tema.nome, total: 0, respondidas: 0, acertos: 0 };
    item.total++;
    const r = respostas[q.id];
    if (r) {
      item.respondidas++;
      if (r.gabarito.acertou) item.acertos++;
    }
    porTema.set(q.tema.id, item);
  }
  return [...porTema.values()];
}

export function percentual(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100);
}

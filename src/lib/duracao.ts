import type { UnidadeTempo } from '@/api/models';

/**
 * Duração de atividades. A API guarda o valor inteiro na unidade escolhida pelo professor (`duracao` +
 * `unidadeTempo`) e devolve o total já convertido (`duracaoMinutos`). A tela mostra sempre as duas
 * unidades: a escolhida primeiro e a outra entre parênteses, sem decimais ("90 min (1h30)").
 */

export const MINUTOS_POR_HORA = 60;
export const CODIGO_MINUTOS = 'min';
export const CODIGO_HORAS = 'h';
/** Mesmo limite do backend, já convertido para minutos. */
export const DURACAO_MAXIMA_MINUTOS = 600;

/** Campos de duração presentes nas respostas de atividade. */
export interface ComDuracao {
  duracao: number | null;
  duracaoMinutos: number | null;
  unidadeTempo: UnidadeTempo | null;
}

/** Hora → minuto. Só para o formulário, antes de existir `duracaoMinutos`. */
export function paraMinutos(valor: number, codigo: string): number {
  switch (codigo) {
    case CODIGO_MINUTOS:
      return valor;
    case CODIGO_HORAS:
      return valor * MINUTOS_POR_HORA;
    default:
      throw new Error(`Unidade de tempo desconhecida: ${codigo}`);
  }
}

/** Minuto → hora, sem fração: 90 → { horas: 1, minutos: 30 }. */
export function emHoras(totalMinutos: number): { horas: number; minutos: number } {
  return {
    horas: Math.floor(totalMinutos / MINUTOS_POR_HORA),
    minutos: totalMinutos % MINUTOS_POR_HORA
  };
}

function plural(valor: number, singular: string, pluralTexto: string): string {
  return `${valor} ${valor === 1 ? singular : pluralTexto}`;
}

/** "2 h", "1h30", "1h05", "0h45". */
export function horasCompacto(totalMinutos: number): string {
  const { horas, minutos } = emHoras(totalMinutos);
  if (horas > 0 && minutos === 0) return `${horas} h`;
  return `${horas}h${String(minutos).padStart(2, '0')}`;
}

/** "2 horas", "1 hora e 30 minutos", "menos de 1 hora". */
export function horasPorExtenso(totalMinutos: number): string {
  const { horas, minutos } = emHoras(totalMinutos);
  if (horas === 0) return 'menos de 1 hora';
  const textoHoras = plural(horas, 'hora', 'horas');
  return minutos === 0 ? textoHoras : `${textoHoras} e ${plural(minutos, 'minuto', 'minutos')}`;
}

export function minutosPorExtenso(totalMinutos: number): string {
  return plural(totalMinutos, 'minuto', 'minutos');
}

/** "hora"/"horas"/"minuto"/"minutos", conforme o valor e a unidade. */
export function rotuloUnidade(valor: number, codigo: string): string {
  if (codigo === CODIGO_HORAS) return valor === 1 ? 'hora' : 'horas';
  return valor === 1 ? 'minuto' : 'minutos';
}

/** Valor e código como o professor escolheu. Sem unidade (não deveria ocorrer), cai para minutos. */
function escolhido(a: ComDuracao): { valor: number; codigo: string; total: number } | null {
  if (a.duracaoMinutos === null) return null;
  if (a.duracao === null || !a.unidadeTempo) {
    return { valor: a.duracaoMinutos, codigo: CODIGO_MINUTOS, total: a.duracaoMinutos };
  }
  return { valor: a.duracao, codigo: a.unidadeTempo.codigo, total: a.duracaoMinutos };
}

/** Abreviado, para listas e cards: "2 h (120 min)", "90 min (1h30)" ou "Sem tempo". */
export function formatarDuracao(a: ComDuracao): string {
  const d = escolhido(a);
  if (!d) return 'Sem tempo';
  if (d.codigo === CODIGO_HORAS) return `${d.valor} h (${d.total} min)`;
  return `${d.total} min (${horasCompacto(d.total)})`;
}

/** Por extenso, para frases: "2 horas (120 minutos)", "90 minutos (1 hora e 30 minutos)" ou "sem tempo". */
export function duracaoPorExtenso(a: ComDuracao): string {
  const d = escolhido(a);
  if (!d) return 'sem tempo';
  if (d.codigo === CODIGO_HORAS) {
    return `${plural(d.valor, 'hora', 'horas')} (${minutosPorExtenso(d.total)})`;
  }
  return `${minutosPorExtenso(d.total)} (${horasPorExtenso(d.total)})`;
}

/** A outra unidade, para a linha de apoio: "120 minutos" (se em horas) ou "1h30" (se em minutos). */
export function outraUnidade(a: ComDuracao): string {
  const d = escolhido(a);
  if (!d) return '';
  return d.codigo === CODIGO_HORAS ? minutosPorExtenso(d.total) : horasCompacto(d.total);
}

/** Prévia do formulário: "= 120 minutos" (horas) ou "= 1h30" (minutos). */
export function previaConversao(valor: number, codigo: string): string {
  const total = paraMinutos(valor, codigo);
  return codigo === CODIGO_HORAS ? `= ${minutosPorExtenso(total)}` : `= ${horasCompacto(total)}`;
}

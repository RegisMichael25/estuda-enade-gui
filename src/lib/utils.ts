import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Cronômetro no formato horas:minutos:segundos, sempre com as horas: 7200 → "02:00:00", 90 → "00:01:30". */
export function formatarTempo(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined || segundos < 0) return '00:00:00';
  const total = Math.floor(segundos);
  const horas = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return [horas, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}


/**
 * Coloca o item na lista em ordem de nome, como a API devolve. Se o item já estiver
 * na lista (a API devolve o existente quando o nome se repete), a lista não muda.
 */
export function adicionarOrdenado<T extends { id: string; nome: string }>(lista: T[], item: T): T[] {
  if (lista.some((i) => i.id === item.id)) return lista;
  return [...lista, item].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

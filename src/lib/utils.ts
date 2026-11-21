import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarTempo(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined || segundos < 0) return '00:00';
  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}


/**
 * Coloca o item na lista em ordem de nome, como a API devolve. Se o item já estiver
 * na lista (a API devolve o existente quando o nome se repete), a lista não muda.
 */
export function adicionarOrdenado<T extends { id: string; nome: string }>(lista: T[], item: T): T[] {
  if (lista.some((i) => i.id === item.id)) return lista;
  return [...lista, item].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

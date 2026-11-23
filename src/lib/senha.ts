/** Espelha a política do backend, só para mostrar as regras enquanto o usuário digita. */

export const MINIMO_CARACTERES = 8;
/** Limite do BCrypt no backend. */
export const MAXIMO_BYTES = 72;

export interface RegraSenha {
  id: 'tamanho' | 'letra' | 'numero' | 'bytes';
  texto: string;
  ok: boolean;
}

export function regrasSenha(senha: string): RegraSenha[] {
  const caracteres = Array.from(senha).length;
  const bytes = new TextEncoder().encode(senha).length;
  const regras: RegraSenha[] = [
    { id: 'tamanho', texto: `Pelo menos ${MINIMO_CARACTERES} caracteres`, ok: caracteres >= MINIMO_CARACTERES },
    { id: 'letra', texto: 'Pelo menos uma letra', ok: /\p{L}/u.test(senha) },
    { id: 'numero', texto: 'Pelo menos um número', ok: /\p{Nd}/u.test(senha) }
  ];
  // Só aparece quando estoura (com acentos, 72 bytes podem ser menos de 72 caracteres)
  if (bytes > MAXIMO_BYTES) {
    regras.push({ id: 'bytes', texto: 'Senha longa demais', ok: false });
  }
  return regras;
}

export function senhaValida(senha: string): boolean {
  return regrasSenha(senha).every((r) => r.ok);
}

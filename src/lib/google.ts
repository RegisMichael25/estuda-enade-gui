/**
 * Login com Google — ADIADO. Fica desligado enquanto VITE_GOOGLE_CLIENT_ID não estiver definido:
 * o botão não renderiza e a tela /cadastro/google não tem como ser aberta.
 */

export const GOOGLE_CLIENT_ID: string = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

export const googleHabilitado = GOOGLE_CLIENT_ID.length > 0;

export interface PerfilGoogle {
  email: string | null;
  nome: string | null;
  foto: string | null;
}

/**
 * Lê o payload do ID token só para exibir (nome, e-mail e foto na tela de cadastro).
 * Não confere a assinatura: quem valida o token é o backend. Devolve null se o token estiver malformado.
 */
export function lerPerfilDoIdToken(idToken: string): PerfilGoogle | null {
  try {
    const payload = idToken.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
    const dados = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    return { email: texto(dados.email), nome: texto(dados.name), foto: texto(dados.picture) };
  } catch {
    return null;
  }
}

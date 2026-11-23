/** Login com Google (adiado): desligado sem VITE_GOOGLE_CLIENT_ID. */

export const GOOGLE_CLIENT_ID: string = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

export const googleHabilitado = GOOGLE_CLIENT_ID.length > 0;

export interface PerfilGoogle {
  email: string | null;
  nome: string | null;
  foto: string | null;
}

/** Só para exibir: não confere a assinatura (quem valida é o backend). */
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

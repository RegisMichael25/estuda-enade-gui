import { ApiException } from '@/api/client';

export function mensagemDeErro(err: unknown, generica: string): string {
  return err instanceof ApiException ? err.mensagem : generica;
}

/** Campos do `400 VALIDACAO`. */
export function camposDeErro(err: unknown): Record<string, string> {
  return err instanceof ApiException && err.campos ? err.campos : {};
}

export function codigoDeErro(err: unknown): string | null {
  return err instanceof ApiException ? err.codigo : null;
}

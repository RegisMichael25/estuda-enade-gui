import { ApiException } from '@/api/client';

/** Mensagem para mostrar ao usuário: a do backend, ou a genérica quando não é erro da API (ex.: rede). */
export function mensagemDeErro(err: unknown, generica: string): string {
  return err instanceof ApiException ? err.mensagem : generica;
}

/** Erros por campo do `400 VALIDACAO` (campo → mensagem); vazio nos outros erros. */
export function camposDeErro(err: unknown): Record<string, string> {
  return err instanceof ApiException && err.campos ? err.campos : {};
}

export function codigoDeErro(err: unknown): string | null {
  return err instanceof ApiException ? err.codigo : null;
}

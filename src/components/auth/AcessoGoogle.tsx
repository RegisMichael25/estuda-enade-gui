import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { BotaoGoogle } from '@/components/auth/BotaoGoogle';
import { DivisorOu } from '@/components/auth/AuthShell';
import { codigoDeErro, mensagemDeErro } from '@/lib/erros';
import { googleHabilitado } from '@/lib/google';
import type { Papel } from '@/api/models';

/** O que a tela /cadastro/google recebe por location.state. */
export interface EstadoCadastroGoogle {
  idToken: string;
  papel?: Papel | null;
  codigoConvite?: string;
}

/**
 * Login com Google — ADIADO (não renderiza sem VITE_GOOGLE_CLIENT_ID).
 * Mesmo fluxo em /login e /cadastro: se a conta existe, entra (inclusive conta criada com senha); se não existe,
 * abre /cadastro/google com o mesmo token, levando o papel e o convite já escolhidos em /cadastro.
 */
export function AcessoGoogle({
  origem,
  papel,
  codigoConvite,
  aoErro
}: {
  origem: 'login' | 'cadastro';
  papel?: Papel | null;
  codigoConvite?: string;
  aoErro: (mensagem: string | null) => void;
}) {
  const { entrarComGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [indisponivel, setIndisponivel] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const aoReceberToken = useCallback(
    async (idToken: string) => {
      aoErro(null);
      setEnviando(true);
      try {
        const resultado = await entrarComGoogle(idToken);
        if (resultado.tipo === 'sessao') {
          toast(origem === 'cadastro' ? 'Você já tinha uma conta, entramos nela.' : 'Login realizado com sucesso!');
          navigate('/', { replace: true });
        } else {
          const estado: EstadoCadastroGoogle = { idToken, papel, codigoConvite };
          navigate('/cadastro/google', { state: estado });
        }
      } catch (err) {
        if (codigoDeErro(err) === 'GOOGLE_DESABILITADO') {
          setIndisponivel(true);
          aoErro('Login com Google indisponível no momento. Use e-mail e senha.');
        } else if (codigoDeErro(err) === 'GOOGLE_TOKEN_INVALIDO') {
          aoErro('Não foi possível confirmar sua conta Google. Tente de novo.');
        } else {
          aoErro(mensagemDeErro(err, 'Erro ao entrar com Google. Tente novamente.'));
        }
      } finally {
        setEnviando(false);
      }
    },
    [entrarComGoogle, navigate, toast, origem, papel, codigoConvite, aoErro]
  );

  if (!googleHabilitado || indisponivel) return null;

  return (
    <>
      <DivisorOu />
      <BotaoGoogle
        aoReceberToken={aoReceberToken}
        texto={origem === 'cadastro' ? 'signup_with' : 'signin_with'}
        desabilitado={enviando}
      />
    </>
  );
}

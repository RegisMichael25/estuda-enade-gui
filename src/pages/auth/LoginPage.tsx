import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { CampoSenha } from '@/components/auth/CampoSenha';
import { AcessoGoogle } from '@/components/auth/AcessoGoogle';
import { codigoDeErro, mensagemDeErro } from '@/lib/erros';
import { googleHabilitado } from '@/lib/google';

export interface EstadoLogin {
  email?: string;
}

export function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const estado = (useLocation().state ?? {}) as EstadoLogin;

  const [email, setEmail] = useState(estado.email ?? '');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<React.ReactNode>(null);

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }

    setCarregando(true);
    setErro(null);
    try {
      await entrar(email.trim(), senha);
      toast('Login realizado com sucesso!');
      navigate('/', { replace: true });
    } catch (err) {
      const codigo = codigoDeErro(err);
      if (codigo === 'CREDENCIAIS_INVALIDAS') {
        setErro(
          <>
            E-mail ou senha incorretos.
            <span className="block mt-1 font-semibold">
              Primeiro acesso depois da atualização? Crie sua senha em{' '}
              <Link to="/esqueci-senha" state={{ email: email.trim() }} className="underline">
                Esqueci minha senha
              </Link>
              {googleHabilitado ? ' ou entre com Google' : ''}.
            </span>
          </>
        );
      } else if (codigo === 'MUITAS_TENTATIVAS') {
        setErro(
          <>
            {mensagemDeErro(err, '')}{' '}
            <Link to="/esqueci-senha" state={{ email: email.trim() }} className="underline">
              Redefinir senha
            </Link>
          </>
        );
      } else {
        setErro(mensagemDeErro(err, 'Não foi possível entrar. Tente novamente.'));
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell
      erro={erro}
      rodape={
        <>
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-bold text-ink underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleEntrar} className="flex flex-col gap-4" noValidate>
        <div>
          <h2 className="text-xl font-bold font-title">Entrar</h2>
          <p className="text-sm text-muted">Use o e-mail e a senha da sua conta.</p>
        </div>

        <Input
          id="login-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="exemplo@faculdade.edu.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus={!estado.email}
        />

        <div className="flex flex-col gap-1.5">
          <CampoSenha
            id="login-senha"
            label="Senha"
            autoComplete="current-password"
            value={senha}
            onChange={setSenha}
            required
            autoFocus={!!estado.email}
          />
          <Link
            to="/esqueci-senha"
            state={{ email: email.trim() }}
            className="self-end text-xs font-bold text-muted hover:text-ink"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth carregando={carregando}>
          <LogIn className="w-5 h-5" />
          Entrar
        </Button>

        <AcessoGoogle origem="login" aoErro={setErro} />
      </form>
    </AuthShell>
  );
}

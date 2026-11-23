import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { CamposNovaSenha, SENHAS_NAO_CONFEREM } from '@/components/auth/CamposCadastro';
import type { EstadoLogin } from '@/pages/auth/LoginPage';
import { codigoDeErro, mensagemDeErro } from '@/lib/erros';
import { senhaValida } from '@/lib/senha';

type Erros = Partial<Record<'codigo' | 'senha' | 'confirmacao', string>>;

/** Também cria a senha de contas antigas, que não têm. */
export function EsqueciSenhaPage() {
  const { solicitarCodigoSenha, redefinirSenha } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const estado = (useLocation().state ?? {}) as EstadoLogin;

  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState(estado.email ?? '');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<React.ReactNode>(null);
  const [erros, setErros] = useState<Erros>({});

  async function handlePedirCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErro('Informe um e-mail válido.');
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      await solicitarCodigoSenha(email.trim());
      toast('Se houver uma conta com este e-mail, enviamos um código.');
      setCodigo('');
      setEtapa('codigo');
    } catch (err) {
      setErro(mensagemDeErro(err, 'Não foi possível enviar o código. Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  function voltarParaEmail() {
    setEtapa('email');
    setErro(null);
    setErros({});
  }

  async function handleRedefinir(e: React.FormEvent) {
    e.preventDefault();
    const locais: Erros = {};
    if (!codigo.trim()) locais.codigo = 'Informe o código recebido.';
    if (!senhaValida(senha)) locais.senha = 'A senha não atende às regras.';
    if (confirmacao !== senha) locais.confirmacao = SENHAS_NAO_CONFEREM;
    setErros(locais);
    if (Object.keys(locais).length) return;

    setCarregando(true);
    setErro(null);
    try {
      await redefinirSenha({ email: email.trim(), codigo: codigo.trim(), novaSenha: senha });
      toast('Senha alterada. Entre com a nova senha.');
      const destino: EstadoLogin = { email: email.trim() };
      navigate('/login', { replace: true, state: destino });
    } catch (err) {
      const codigoErro = codigoDeErro(err);
      if (codigoErro === 'CODIGO_INVALIDO') {
        setErros({ codigo: 'Código inválido ou expirado.' });
        setErro(
          <>
            Código inválido ou expirado.{' '}
            <button type="button" onClick={voltarParaEmail} className="underline cursor-pointer">
              Reenviar código
            </button>
          </>
        );
      } else if (codigoErro === 'SENHA_FRACA') {
        setErros({ senha: mensagemDeErro(err, '') });
      } else {
        setErro(mensagemDeErro(err, 'Não foi possível redefinir a senha. Tente novamente.'));
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell
      erro={erro}
      rodape={
        <Link to="/login" state={{ email: email.trim() }} className="font-bold text-ink underline">
          Voltar para o login
        </Link>
      }
    >
      {etapa === 'email' ? (
        <form onSubmit={handlePedirCodigo} className="flex flex-col gap-4" noValidate>
          <div>
            <h2 className="text-xl font-bold font-title">Esqueci minha senha</h2>
            <p className="text-sm text-muted">
              Informe o e-mail da conta. Enviaremos um código para você criar uma nova senha.
            </p>
          </div>
          <Input
            id="esqueci-email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="exemplo@faculdade.edu.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" variant="primary" size="lg" fullWidth carregando={carregando}>
            <Mail className="w-5 h-5" />
            Enviar código
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRedefinir} className="flex flex-col gap-4" noValidate>
          <div>
            <h2 className="text-xl font-bold font-title">Crie a nova senha</h2>
            <p className="text-sm text-muted">
              Se houver uma conta com <b>{email.trim()}</b>, enviamos um código para ela.
            </p>
          </div>
          <Input
            id="esqueci-codigo"
            label="Código de 6 dígitos"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            error={erros.codigo}
            className="text-center text-2xl tracking-[0.25em] font-title font-bold"
            required
            autoFocus
          />
          <CamposNovaSenha
            senha={senha}
            aoMudarSenha={setSenha}
            confirmacao={confirmacao}
            aoMudarConfirmacao={setConfirmacao}
            erroSenha={erros.senha}
            erroConfirmacao={erros.confirmacao}
            rotulo="Nova senha"
          />
          <Button type="submit" variant="primary" size="lg" fullWidth carregando={carregando}>
            <KeyRound className="w-5 h-5" />
            Salvar nova senha
          </Button>
          <button
            type="button"
            onClick={voltarParaEmail}
            className="text-xs font-bold text-muted hover:text-ink text-center cursor-pointer"
          >
            ← Usar outro e-mail ou reenviar o código
          </button>
        </form>
      )}
    </AuthShell>
  );
}

import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { AuthShell } from '@/components/auth/AuthShell';
import {
  CamposNovaSenha,
  CamposPapelConvite,
  DICA_PROFESSOR_SEM_CONVITE,
  SENHAS_NAO_CONFEREM
} from '@/components/auth/CamposCadastro';
import type { EstadoCadastroGoogle } from '@/components/auth/AcessoGoogle';
import type { EstadoCadastro } from '@/pages/auth/CadastroPage';
import { camposDeErro, codigoDeErro, mensagemDeErro } from '@/lib/erros';
import { googleHabilitado, lerPerfilDoIdToken } from '@/lib/google';
import { senhaValida } from '@/lib/senha';
import type { Papel } from '@/api/models';

type Erros = Partial<Record<'nome' | 'senha' | 'confirmacao' | 'codigoConvite', string>>;

const AVISO_REFAZER = 'Clique em "Cadastrar com Google" de novo para continuar.';

/**
 * Login com Google — ADIADO. Completa o cadastro de quem entrou com Google e ainda não tem conta.
 * Tudo numa tela só: nome (preenchido com o do Google e editável), papel, convite e senha obrigatória.
 * O idToken chega só por location.state (não é gravado): recarregar a página volta para /cadastro.
 */
export function CadastroGooglePage() {
  const estado = useLocation().state as EstadoCadastroGoogle | null;
  if (!googleHabilitado || !estado?.idToken) {
    const aviso: EstadoCadastro = { aviso: googleHabilitado ? AVISO_REFAZER : undefined };
    return <Navigate to="/cadastro" replace state={aviso} />;
  }
  return <FormularioCadastroGoogle estado={estado} />;
}

function FormularioCadastroGoogle({ estado }: { estado: EstadoCadastroGoogle }) {
  const { cadastrarComGoogle, entrarComGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const perfil = useMemo(() => lerPerfilDoIdToken(estado.idToken), [estado.idToken]);

  const [papel, setPapel] = useState<Papel | null>(estado.papel ?? null);
  const [nome, setNome] = useState(perfil?.nome ?? '');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [convite, setConvite] = useState(estado.papel === 'PROFESSOR' ? estado.codigoConvite ?? '' : '');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<React.ReactNode>(null);
  const [erros, setErros] = useState<Erros>({});

  function voltarParaCadastro() {
    const aviso: EstadoCadastro = { aviso: `Sua sessão do Google expirou. ${AVISO_REFAZER}` };
    navigate('/cadastro', { replace: true, state: aviso });
  }

  async function entrarNaContaExistente() {
    try {
      const resultado = await entrarComGoogle(estado.idToken);
      if (resultado.tipo === 'sessao') navigate('/', { replace: true });
    } catch {
      voltarParaCadastro();
    }
  }

  async function handleConcluir(e: React.FormEvent) {
    e.preventDefault();
    if (!papel) return;
    const locais: Erros = {};
    if (!nome.trim()) locais.nome = 'Informe seu nome.';
    if (!senhaValida(senha)) locais.senha = 'A senha não atende às regras.';
    if (confirmacao !== senha) locais.confirmacao = SENHAS_NAO_CONFEREM;
    setErros(locais);
    if (Object.keys(locais).length) return;

    setCarregando(true);
    setErro(null);
    try {
      await cadastrarComGoogle({
        idToken: estado.idToken,
        nome: nome.trim(),
        senha,
        papel,
        codigoConvite: papel === 'PROFESSOR' && convite.trim() ? convite.trim() : undefined
      });
      toast('Conta criada com sucesso!');
      navigate('/', { replace: true });
    } catch (err) {
      const codigo = codigoDeErro(err);
      if (codigo === 'GOOGLE_TOKEN_INVALIDO') {
        voltarParaCadastro();
      } else if (codigo === 'EMAIL_EM_USO') {
        // A conta foi criada no meio do caminho (ex.: em outra aba): entrar nela com o mesmo token
        setErro(
          <>
            Este e-mail já tem conta.{' '}
            <button type="button" onClick={entrarNaContaExistente} className="underline cursor-pointer">
              Entrar com Google
            </button>
          </>
        );
      } else if (codigo === 'SENHA_FRACA') {
        setErros({ senha: mensagemDeErro(err, '') });
      } else if (codigo === 'CONVITE_INVALIDO') {
        setErros({ codigoConvite: mensagemDeErro(err, '') });
      } else if (codigo === 'VALIDACAO') {
        setErros(camposDeErro(err));
      } else {
        setErro(mensagemDeErro(err, 'Erro ao criar a conta. Tente novamente.'));
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell erro={erro}>
      <form onSubmit={handleConcluir} className="flex flex-col gap-4" noValidate>
        <div className="flex items-center gap-3">
          {perfil?.foto && (
            <img
              src={perfil.foto}
              alt=""
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full border-2 border-ink flex-none"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-bold font-title">Complete seu cadastro</h2>
            <p className="text-sm text-muted">Falta pouco para usar sua conta Google.</p>
          </div>
        </div>

        <Input id="google-email" label="E-mail do Google" type="email" value={perfil?.email ?? ''} readOnly disabled />

        <Input
          id="google-nome"
          label="Seu nome"
          type="text"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={erros.nome}
          required
          autoFocus
        />

        <CamposPapelConvite
          papel={papel}
          aoMudarPapel={setPapel}
          convite={convite}
          aoMudarConvite={setConvite}
          erroConvite={erros.codigoConvite}
          dicaProfessor={DICA_PROFESSOR_SEM_CONVITE}
        />

        <div className="flex flex-col gap-1.5">
          <CamposNovaSenha
            senha={senha}
            aoMudarSenha={setSenha}
            confirmacao={confirmacao}
            aoMudarConfirmacao={setConfirmacao}
            erroSenha={erros.senha}
            erroConfirmacao={erros.confirmacao}
            rotulo="Crie uma senha"
          />
          <p className="text-xs text-muted">Com ela você também pode entrar usando e-mail e senha.</p>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth carregando={carregando} disabled={!papel}>
          <CheckCircle2 className="w-5 h-5" />
          {papel ? 'Concluir cadastro' : 'Escolha aluno ou professor'}
        </Button>
      </form>
    </AuthShell>
  );
}

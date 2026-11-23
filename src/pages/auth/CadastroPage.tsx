import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { AcessoGoogle } from '@/components/auth/AcessoGoogle';
import {
  CamposNovaSenha,
  CamposPapelConvite,
  DICA_PROFESSOR_SEM_CONVITE,
  SENHAS_NAO_CONFEREM
} from '@/components/auth/CamposCadastro';
import { camposDeErro, codigoDeErro, mensagemDeErro } from '@/lib/erros';
import { senhaValida } from '@/lib/senha';
import type { Papel } from '@/api/models';

/** Aviso que /cadastro/google deixa ao voltar para cá (ex.: token expirado ou página recarregada). */
export interface EstadoCadastro {
  aviso?: string;
}

type Erros = Partial<Record<'nome' | 'email' | 'senha' | 'confirmacao' | 'codigoConvite', string>>;

export function CadastroPage() {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const estado = (useLocation().state ?? {}) as EstadoCadastro;

  const [papel, setPapel] = useState<Papel | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [convite, setConvite] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<React.ReactNode>(estado.aviso ?? null);
  const [erros, setErros] = useState<Erros>({});

  function validar(): Erros {
    const e: Erros = {};
    if (!nome.trim()) e.nome = 'Informe seu nome.';
    if (!email.trim() || !email.includes('@')) e.email = 'Informe um e-mail válido.';
    if (!senhaValida(senha)) e.senha = 'A senha não atende às regras.';
    if (confirmacao !== senha) e.confirmacao = SENHAS_NAO_CONFEREM;
    return e;
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!papel) return;
    const locais = validar();
    setErros(locais);
    if (Object.keys(locais).length) return;

    setCarregando(true);
    setErro(null);
    try {
      await cadastrar({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        papel,
        codigoConvite: papel === 'PROFESSOR' && convite.trim() ? convite.trim() : undefined
      });
      toast('Conta criada com sucesso!');
      // O RootRedirect decide: aluno → /aluno; professor aprovado → /professor; pendente → /professor/pendente
      navigate('/', { replace: true });
    } catch (err) {
      const codigo = codigoDeErro(err);
      if (codigo === 'EMAIL_EM_USO') {
        setErro(
          <>
            Este e-mail já tem conta.{' '}
            <Link to="/login" state={{ email: email.trim() }} className="underline">
              Entrar
            </Link>{' '}
            ou{' '}
            <Link to="/esqueci-senha" state={{ email: email.trim() }} className="underline">
              Esqueci minha senha
            </Link>
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
    <AuthShell
      erro={erro}
      rodape={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-bold text-ink underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleCadastrar} className="flex flex-col gap-4" noValidate>
        <div>
          <h2 className="text-xl font-bold font-title">Criar conta</h2>
          <p className="text-sm text-muted">Escolha como vai usar e preencha seus dados.</p>
        </div>

        <CamposPapelConvite
          papel={papel}
          aoMudarPapel={setPapel}
          convite={convite}
          aoMudarConvite={setConvite}
          erroConvite={erros.codigoConvite}
          dicaProfessor={DICA_PROFESSOR_SEM_CONVITE}
        />

        <Input
          id="cadastro-nome"
          label="Seu nome completo"
          type="text"
          autoComplete="name"
          placeholder="Nome e Sobrenome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={erros.nome}
          required
        />

        <Input
          id="cadastro-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="exemplo@faculdade.edu.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={erros.email}
          required
        />

        <CamposNovaSenha
          senha={senha}
          aoMudarSenha={setSenha}
          confirmacao={confirmacao}
          aoMudarConfirmacao={setConfirmacao}
          erroSenha={erros.senha}
          erroConfirmacao={erros.confirmacao}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth carregando={carregando} disabled={!papel}>
          <CheckCircle2 className="w-5 h-5" />
          {papel ? 'Criar conta' : 'Escolha aluno ou professor'}
        </Button>

        <AcessoGoogle origem="cadastro" papel={papel} codigoConvite={convite.trim() || undefined} aoErro={setErro} />
      </form>
    </AuthShell>
  );
}

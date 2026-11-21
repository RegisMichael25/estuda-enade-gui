import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { ApiException } from '@/api/client';
import type { Papel } from '@/api/models';
import { Mail, KeyRound, User, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const { solicitarCodigo, entrar } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [etapa, setEtapa] = useState<'perfil' | 'email' | 'codigo' | 'cadastro'>('perfil');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState<Papel>('ALUNO');

  function escolherPerfil(escolhido: Papel) {
    setPapel(escolhido);
    setErro(null);
    setEtapa('email');
  }
  const [codigoConvite, setCodigoConvite] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSolicitarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErro('Informe um e-mail válido.');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      await solicitarCodigo(email.trim());
      toast('Código de acesso enviado!');
      setEtapa('codigo');
    } catch (err) {
      if (err instanceof ApiException) {
        setErro(err.mensagem);
      } else {
        setErro('Não foi possível enviar o código. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  async function handleVerificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) {
      setErro('Informe o código recebido.');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const usuario = await entrar({
        email: email.trim(),
        codigo: codigo.trim()
      });
      // A conta já tem um papel: se for diferente do perfil escolhido, entra na área certa e avisa.
      if (usuario.papel !== papel) {
        toast(
          usuario.papel === 'PROFESSOR'
            ? 'Esta conta é de professor. Abrimos a área do professor.'
            : 'Esta conta é de aluno. Abrimos a área do aluno.'
        );
      } else {
        toast('Login realizado com sucesso!');
      }
      redirecionarAposLogin();
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.codigo === 'CADASTRO_NECESSARIO') {
          setEtapa('cadastro');
          toast('Quase lá! Complete seus dados para o primeiro acesso.');
        } else {
          setErro(err.mensagem);
        }
      } else {
        setErro('Erro ao verificar o código. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  async function handleCompletarCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe seu nome completo.');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      await entrar({
        email: email.trim(),
        codigo: codigo.trim(),
        nome: nome.trim(),
        papel,
        codigoConvite: codigoConvite.trim() || undefined
      });
      toast('Conta criada com sucesso!');
      redirecionarAposLogin();
    } catch (err) {
      if (err instanceof ApiException) {
        setErro(err.mensagem);
      } else {
        setErro('Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  function redirecionarAposLogin() {
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange border-[3px] border-ink flex items-center justify-center text-white font-title font-extrabold text-2xl shadow-brutal">
            e
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-title tracking-tight text-ink">
              estuda<span className="text-orange">.enade</span>
            </h1>
            <p className="text-xs font-bold text-muted uppercase tracking-wider">
              Sistema de Estudos & Prática
            </p>
          </div>
        </div>

        {/* Card do formulário */}
        <Card className="p-6 md:p-8 bg-paper">
          {erro && (
            <div className="mb-4 p-3 bg-pink/20 border-2 border-ink rounded-xl text-xs font-bold text-ink">
              {erro}
            </div>
          )}

          {etapa === 'perfil' && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold font-title">Como você vai usar?</h2>
                <p className="text-sm text-muted">Escolha seu perfil para entrar.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => escolherPerfil('ALUNO')}
                  className="border-[2.5px] border-ink rounded-xl p-4 text-left cursor-pointer transition-all bg-paper hover:bg-yellow hover:shadow-brutal-sm"
                >
                  <GraduationCap className="w-7 h-7 mb-2 text-ink" />
                  <div className="font-bold">Sou aluno</div>
                  <div className="text-xs text-muted">Pratico questões e faço atividades</div>
                </button>

                <button
                  type="button"
                  onClick={() => escolherPerfil('PROFESSOR')}
                  className="border-[2.5px] border-ink rounded-xl p-4 text-left cursor-pointer transition-all bg-paper hover:bg-lilac hover:shadow-brutal-sm"
                >
                  <User className="w-7 h-7 mb-2 text-ink" />
                  <div className="font-bold">Sou professor</div>
                  <div className="text-xs text-muted">Gerencio turmas, questões e atividades</div>
                </button>
              </div>
            </div>
          )}

          {etapa === 'email' && (
            <form onSubmit={handleSolicitarCodigo} className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold font-title">
                  {papel === 'PROFESSOR' ? 'Entrar como professor' : 'Entrar como aluno'}
                </h2>
                <p className="text-sm text-muted">
                  Acesso rápido sem senha. Digite seu e-mail institucional ou pessoal.
                </p>
              </div>

              <Input
                label="Seu e-mail"
                type="email"
                placeholder="exemplo@faculdade.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                carregando={carregando}
              >
                <Mail className="w-5 h-5" />
                Receber código de acesso
              </Button>

              <button
                type="button"
                onClick={() => {
                  setEtapa('perfil');
                  setErro(null);
                }}
                className="text-xs font-bold text-muted hover:text-ink text-center mt-2 cursor-pointer"
              >
                ← Trocar perfil
              </button>
            </form>
          )}

          {etapa === 'codigo' && (
            <form onSubmit={handleVerificarCodigo} className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold font-title">Informe o código</h2>
                <p className="text-sm text-muted">
                  Enviamos um código de acesso para <b>{email}</b>.
                </p>
              </div>

              <Input
                label="Código de 6 dígitos"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="text-center text-2xl tracking-[0.25em] font-title font-bold"
                required
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                carregando={carregando}
              >
                <KeyRound className="w-5 h-5" />
                Confirmar e Entrar
              </Button>

              <button
                type="button"
                onClick={() => {
                  setEtapa('email');
                  setErro(null);
                }}
                className="text-xs font-bold text-muted hover:text-ink text-center mt-2 cursor-pointer"
              >
                ← Usar outro e-mail
              </button>
            </form>
          )}

          {etapa === 'cadastro' && (
            <form onSubmit={handleCompletarCadastro} className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold font-title">Complete seu cadastro</h2>
                <p className="text-sm text-muted">
                  Este é seu primeiro acesso com <b>{email}</b>.
                </p>
              </div>

              <Input
                label="Seu nome completo"
                type="text"
                placeholder="Nome e Sobrenome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoFocus
              />

              <div
                className={`flex items-center gap-2 border-[2.5px] border-ink rounded-xl p-3 ${
                  papel === 'PROFESSOR' ? 'bg-lilac' : 'bg-yellow'
                }`}
              >
                {papel === 'PROFESSOR' ? (
                  <User className="w-5 h-5 text-ink" />
                ) : (
                  <GraduationCap className="w-5 h-5 text-ink" />
                )}
                <span className="text-sm font-bold">
                  Conta de {papel === 'PROFESSOR' ? 'professor' : 'aluno'}
                </span>
              </div>

              {papel === 'PROFESSOR' && (
                <Input
                  label="Código de convite docente (opcional)"
                  type="text"
                  placeholder="Se recebeu convite de outro professor"
                  value={codigoConvite}
                  onChange={(e) => setCodigoConvite(e.target.value)}
                />
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                carregando={carregando}
              >
                <CheckCircle2 className="w-5 h-5" />
                Concluir cadastro
              </Button>
            </form>
          )}
        </Card>

      </div>
    </div>
  );
}


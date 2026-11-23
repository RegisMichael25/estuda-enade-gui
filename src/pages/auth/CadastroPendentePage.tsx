import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Clock, RefreshCw, LogOut, KeyRound } from 'lucide-react';
import { api, tokenStorage } from '@/api/client';
import { ModalSenha } from '@/components/auth/ModalSenha';
import { AvisoSemSenha } from '@/components/auth/AvisoSemSenha';

export function CadastroPendentePage() {
  const { usuario, sair } = useAuth();
  const { toast } = useToast();
  const [verificando, setVerificando] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);

  // Esta rota fica fora do PrivateRoute: sem sessão (por exemplo, depois de sair), volta para o login.
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (usuario.papel !== 'PROFESSOR' || usuario.aprovado) {
    return <Navigate to="/" replace />;
  }

  async function handleVerificarAprovacao() {
    setVerificando(true);
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        await sair();
        return;
      }

      const sessao = await api.auth.renovar(refreshToken);
      tokenStorage.salvarSessao(sessao);

      if (sessao.usuario.aprovado) {
        toast('Seu cadastro foi aprovado! Bem-vindo.');
        window.location.href = '/professor';
      } else {
        toast('Seu cadastro ainda está aguardando liberação de outro professor.');
      }
    } catch {
      toast('Não foi possível verificar. Tente novamente mais tarde.');
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md flex flex-col gap-4">
        <AvisoSemSenha aoCriarSenha={() => setModalSenha(true)} />

        <Card className="p-6 md:p-8 text-center bg-paper">
          <div className="w-16 h-16 rounded-2xl bg-yellow border-[3px] border-ink mx-auto flex items-center justify-center text-ink shadow-brutal mb-4">
            <Clock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold font-title text-ink mb-2">Cadastro em Análise</h2>

          <p className="text-sm text-muted mb-6">
            Olá, <b>{usuario.nome || 'Professor'}</b>! Como você se cadastrou sem um código de convite, seu perfil
            precisa ser liberado por um professor já aprovado na instituição antes de acessar o banco e as turmas.
          </p>

          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" fullWidth carregando={verificando} onClick={handleVerificarAprovacao}>
              <RefreshCw className="w-4 h-4" />
              Verificar se fui aprovado
            </Button>

            <Button variant="secondary" size="md" fullWidth onClick={() => setModalSenha(true)}>
              <KeyRound className="w-4 h-4" />
              {usuario.temSenha ? 'Trocar senha' : 'Criar senha'}
            </Button>

            <Button variant="ghost" size="md" fullWidth onClick={sair}>
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </div>
        </Card>
      </div>

      <ModalSenha aberto={modalSenha} aoFechar={() => setModalSenha(false)} />
    </div>
  );
}

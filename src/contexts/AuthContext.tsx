import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  Usuario,
  Sessao,
  CadastrarRequest,
  GoogleCadastrarRequest,
  RedefinirSenhaRequest
} from '@/api/models';
import { api, tokenStorage, ApiException } from '@/api/client';

export type ResultadoGoogle =
  | { tipo: 'sessao'; usuario: Usuario }
  | { tipo: 'cadastro-necessario'; idToken: string };

interface AuthContextType {
  usuario: Usuario | null;
  autenticado: boolean;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  cadastrar: (dados: CadastrarRequest) => Promise<Usuario>;
  entrarComGoogle: (idToken: string) => Promise<ResultadoGoogle>;
  cadastrarComGoogle: (dados: GoogleCadastrarRequest) => Promise<Usuario>;
  solicitarCodigoSenha: (email: string) => Promise<void>;
  /** Também limpa a sessão local (o backend encerra todas). */
  redefinirSenha: (dados: RedefinirSenhaRequest) => Promise<void>;
  solicitarCodigoTrocaSenha: () => Promise<void>;
  trocarSenha: (codigo: string, novaSenha: string) => Promise<Usuario>;
  sair: () => Promise<void>;
  atualizarNome: (nome: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => tokenStorage.getUsuario());
  const [carregando, setCarregando] = useState<boolean>(true);

  const sincronizar = useCallback(() => {
    const user = tokenStorage.getUsuario();
    setUsuario(user);
  }, []);

  useEffect(() => {
    window.addEventListener('estuda-enade-auth-change', sincronizar);

    async function verificarSessao() {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setCarregando(false);
        return;
      }

      try {
        const dados = await api.auth.obterEu();
        tokenStorage.atualizarUsuario(dados);
        setUsuario(dados);
      } catch (err) {
        if (err instanceof ApiException && err.status === 401) {
          tokenStorage.limpar();
          setUsuario(null);
        }
      } finally {
        setCarregando(false);
      }
    }

    verificarSessao();

    return () => {
      window.removeEventListener('estuda-enade-auth-change', sincronizar);
    };
  }, [sincronizar]);

  function aplicarSessao(sessao: Sessao): Usuario {
    tokenStorage.salvarSessao(sessao);
    setUsuario(sessao.usuario);
    return sessao.usuario;
  }

  const entrar = async (email: string, senha: string) =>
    aplicarSessao(await api.auth.entrar({ email, senha }));

  const cadastrar = async (dados: CadastrarRequest) => aplicarSessao(await api.auth.cadastrar(dados));

  const entrarComGoogle = async (idToken: string): Promise<ResultadoGoogle> => {
    try {
      return { tipo: 'sessao', usuario: aplicarSessao(await api.auth.entrarComGoogle(idToken)) };
    } catch (err) {
      if (err instanceof ApiException && err.codigo === 'CONTA_NAO_ENCONTRADA') {
        return { tipo: 'cadastro-necessario', idToken };
      }
      throw err;
    }
  };

  const cadastrarComGoogle = async (dados: GoogleCadastrarRequest) =>
    aplicarSessao(await api.auth.cadastrarComGoogle(dados));

  const solicitarCodigoSenha = async (email: string) => {
    await api.auth.solicitarCodigoSenha(email);
  };

  const redefinirSenha = async (dados: RedefinirSenhaRequest) => {
    await api.auth.redefinirSenha(dados);
    tokenStorage.limpar();
    setUsuario(null);
  };

  const solicitarCodigoTrocaSenha = async () => {
    await api.auth.solicitarCodigoTrocaSenha();
  };

  const trocarSenha = async (codigo: string, novaSenha: string) =>
    aplicarSessao(await api.auth.trocarSenha({ codigo, novaSenha }));

  const sair = async () => {
    try {
      await api.auth.sair();
    } finally {
      tokenStorage.limpar();
      setUsuario(null);
    }
  };

  const atualizarNome = async (nome: string) => {
    const atualizado = await api.auth.atualizarEu(nome);
    tokenStorage.atualizarUsuario(atualizado);
    setUsuario(atualizado);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: !!usuario && !!tokenStorage.getAccessToken(),
        carregando,
        entrar,
        cadastrar,
        entrarComGoogle,
        cadastrarComGoogle,
        solicitarCodigoSenha,
        redefinirSenha,
        solicitarCodigoTrocaSenha,
        trocarSenha,
        sair,
        atualizarNome
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

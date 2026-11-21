import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Usuario, Papel } from '@/api/models';
import { api, tokenStorage, ApiException } from '@/api/client';

interface AuthContextType {
  usuario: Usuario | null;
  autenticado: boolean;
  carregando: boolean;
  solicitarCodigo: (email: string) => Promise<void>;
  entrar: (payload: {
    email: string;
    codigo: string;
    nome?: string;
    papel?: Papel;
    codigoConvite?: string;
  }) => Promise<Usuario>;
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

  const solicitarCodigo = async (email: string) => {
    await api.auth.solicitarCodigo(email);
  };

  const entrar = async (payload: {
    email: string;
    codigo: string;
    nome?: string;
    papel?: Papel;
    codigoConvite?: string;
  }) => {
    const sessao = await api.auth.entrar(payload);
    tokenStorage.salvarSessao(sessao);
    setUsuario(sessao.usuario);
    return sessao.usuario;
  };

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
        solicitarCodigo,
        entrar,
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


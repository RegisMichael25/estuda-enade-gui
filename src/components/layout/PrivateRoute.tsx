import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Papel } from '@/api/models';
import { Loader2 } from 'lucide-react';

export function PrivateRoute({ papel }: { papel?: Papel }) {
  const { usuario, autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (!autenticado || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.papel === 'PROFESSOR' && !usuario.aprovado) {
    return <Navigate to="/professor/pendente" replace />;
  }

  if (papel && usuario.papel !== papel) {
    return <Navigate to={usuario.papel === 'ALUNO' ? '/aluno' : '/professor'} replace />;
  }

  return <Outlet />;
}


import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** Telas de quem ainda não entrou (login, cadastro, esqueci a senha): quem já tem sessão vai para a própria área. */
export function RotaPublica() {
  const { autenticado, carregando } = useAuth();
  if (carregando) return null;
  if (autenticado) return <Navigate to="/" replace />;
  return <Outlet />;
}

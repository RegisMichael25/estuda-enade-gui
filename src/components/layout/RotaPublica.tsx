import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** Quem já tem sessão vai para a própria área. */
export function RotaPublica() {
  const { autenticado, carregando } = useAuth();
  if (carregando) return null;
  if (autenticado) return <Navigate to="/" replace />;
  return <Outlet />;
}

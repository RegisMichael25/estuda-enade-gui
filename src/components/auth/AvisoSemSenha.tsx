import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const chave = (usuarioId: string) => `estuda_enade_aviso_sem_senha_dispensado_${usuarioId}`;

export function AvisoSemSenha({ aoCriarSenha, className }: { aoCriarSenha: () => void; className?: string }) {
  const { usuario } = useAuth();
  const [dispensado, setDispensado] = useState(() => !!usuario && localStorage.getItem(chave(usuario.id)) === '1');

  if (!usuario || usuario.temSenha || dispensado) return null;

  function dispensar() {
    if (usuario) localStorage.setItem(chave(usuario.id), '1');
    setDispensado(true);
  }

  return (
    <div
      role="status"
      className={`flex items-center gap-3 p-3 bg-yellow/40 border-2 border-ink rounded-xl text-sm text-ink ${className ?? ''}`}
    >
      <KeyRound className="w-4 h-4 flex-none" aria-hidden />
      <span className="flex-1">
        Sua conta ainda não tem senha.{' '}
        <button type="button" onClick={aoCriarSenha} className="font-bold underline cursor-pointer">
          Criar senha
        </button>
      </span>
      <button
        type="button"
        onClick={dispensar}
        className="p-1 rounded-lg hover:bg-ink/10 cursor-pointer"
        aria-label="Dispensar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ApiException } from '@/api/client';
import type { Curso } from '@/api/models';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface NovoItemCatalogoProps {
  /** Texto do link, por exemplo "Novo curso". */
  rotulo: string;
  placeholder: string;
  /** Chama a API. Se já existir um item com o mesmo nome, a API devolve o existente. */
  criar: (nome: string) => Promise<Curso>;
  onCriado: (item: Curso) => void;
}

/**
 * Link "+ Novo ..." que abre um campo para criar curso ou tema sem sair da tela.
 * Não usa <form> porque costuma ficar dentro de outro formulário (ex.: criar turma).
 */
export function NovoItemCatalogo({ rotulo, placeholder, criar, onCriado }: NovoItemCatalogoProps) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    setAberto(false);
    setNome('');
    setErro(null);
  }

  async function handleCriar() {
    const limpo = nome.trim();
    if (!limpo) {
      setErro('Informe o nome.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const item = await criar(limpo);
      onCriado(item);
      fechar();
    } catch (err) {
      setErro(err instanceof ApiException ? err.mensagem : 'Não foi possível criar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Enter cria o item em vez de enviar o formulário em volta
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCriar();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      fechar();
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="self-end -mt-0.5 text-xs font-bold text-ink underline hover:text-orange cursor-pointer flex items-center gap-0.5"
      >
        <Plus className="w-3 h-3" />
        {rotulo}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <Input
          placeholder={placeholder}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={120}
          error={erro ?? undefined}
          autoFocus
        />
        <Button type="button" variant="primary" size="md" carregando={salvando} onClick={handleCriar}>
          Criar
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={fechar} aria-label="Cancelar">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

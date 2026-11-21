import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboboxOpcao<V extends string | number = string> {
  valor: V;
  rotulo: string;
}

export interface ComboboxProps<V extends string | number = string> {
  opcoes: ComboboxOpcao<V>[];
  /** Valor selecionado; `null`, `undefined` ou `''` significam nenhum. */
  valor: V | null | undefined | '';
  aoMudar: (valor: V) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** `sm` segue os seletores compactos (texto menor, em negrito). */
  tamanho?: 'md' | 'sm';
  mensagemVazia?: string;
  className?: string;
}

/** Quantas opções vão para a tela de uma vez; o resto aparece ao refinar a busca. */
const LIMITE_VISIVEL = 200;

/** Minúsculas e sem acento, para "matematica" encontrar "Matemática". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Campo de seleção com busca: abre a lista ao clicar e filtra pelo que é digitado.
 * Só aceita opções da lista; ao sair sem escolher, volta a mostrar a opção atual.
 */
export function Combobox<V extends string | number = string>({
  opcoes,
  valor,
  aoMudar,
  label,
  placeholder = 'Selecione ou digite para buscar',
  error,
  id,
  name,
  required,
  disabled,
  tamanho = 'md',
  mensagemVazia = 'Nenhum resultado',
  className,
}: ComboboxProps<V>) {
  const idGerado = useId();
  const inputId = id || name || idGerado;
  const listaId = `${inputId}-opcoes`;

  const raizRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [indiceAtivo, setIndiceAtivo] = useState(0);

  const selecionada = opcoes.find((o) => o.valor === valor) ?? null;

  const filtradas = useMemo(() => {
    if (!busca.trim()) return opcoes;
    const termo = normalizar(busca);
    return opcoes.filter((o) => normalizar(o.rotulo).includes(termo));
  }, [opcoes, busca]);

  const visiveis = filtradas.slice(0, LIMITE_VISIVEL);

  function abrir() {
    if (disabled) return;
    setAberto(true);
    setBusca('');
    const indiceAtual = selecionada ? opcoes.indexOf(selecionada) : 0;
    setIndiceAtivo(indiceAtual >= 0 && indiceAtual < LIMITE_VISIVEL ? indiceAtual : 0);
  }

  function fechar() {
    setAberto(false);
    setBusca('');
  }

  function escolher(opcao: ComboboxOpcao<V>) {
    aoMudar(opcao.valor);
    fechar();
  }

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: PointerEvent) {
      if (!raizRef.current?.contains(e.target as Node)) fechar();
    }
    document.addEventListener('pointerdown', aoClicarFora);
    return () => document.removeEventListener('pointerdown', aoClicarFora);
  }, [aberto]);

  // Mantém a opção ativa à vista ao navegar pelo teclado.
  useEffect(() => {
    if (!aberto) return;
    const item = listaRef.current?.querySelector<HTMLElement>(`[data-indice="${indiceAtivo}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  }, [indiceAtivo, aberto]);

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!aberto) return abrir();
        setIndiceAtivo((i) => Math.min(i + 1, visiveis.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!aberto) return abrir();
        setIndiceAtivo((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        if (aberto) {
          e.preventDefault();
          setIndiceAtivo(0);
        }
        break;
      case 'End':
        if (aberto) {
          e.preventDefault();
          setIndiceAtivo(Math.max(visiveis.length - 1, 0));
        }
        break;
      case 'Enter':
        if (aberto) {
          // Não envia o formulário enquanto a lista está aberta.
          e.preventDefault();
          const opcao = visiveis[indiceAtivo];
          if (opcao) escolher(opcao);
        }
        break;
      case 'Escape':
        if (aberto) {
          // Fecha só a lista, não o modal em volta.
          e.preventDefault();
          e.stopPropagation();
          fechar();
        }
        break;
      case 'Tab':
        fechar();
        break;
    }
  }

  // Aberto, o campo fica livre para a busca e a opção atual aparece como dica.
  const textoDoCampo = aberto ? busca : selecionada?.rotulo ?? '';
  const pequeno = tamanho === 'sm';

  return (
    <div ref={raizRef} className={cn('w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold uppercase tracking-wider text-muted select-none"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-expanded={aberto}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={
            aberto && visiveis[indiceAtivo] ? `${listaId}-${indiceAtivo}` : undefined
          }
          aria-invalid={!!error || undefined}
          required={required}
          disabled={disabled}
          placeholder={selecionada && aberto ? selecionada.rotulo : placeholder}
          value={textoDoCampo}
          onClick={() => (aberto ? undefined : abrir())}
          onChange={(e) => {
            if (!aberto) setAberto(true);
            setBusca(e.target.value);
            setIndiceAtivo(0);
          }}
          onKeyDown={aoTeclar}
          className={cn(
            'w-full bg-paper text-ink border-[2.5px] border-ink rounded-xl pr-10 cursor-pointer',
            pequeno ? 'px-3 py-2 text-xs font-bold' : 'px-3.5 py-2.5 font-medium',
            'placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-ink focus:cursor-text',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            error && 'border-pink bg-pink/10'
          )}
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label={aberto ? 'Fechar opções' : 'Abrir opções'}
          disabled={disabled}
          onClick={() => {
            if (aberto) return fechar();
            abrir();
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-100', aberto && 'rotate-180')}
          />
        </button>

        {aberto && (
          <ul
            ref={listaRef}
            id={listaId}
            role="listbox"
            className={cn(
              'absolute z-30 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto',
              'bg-paper border-[2.5px] border-ink rounded-xl shadow-brutal-md py-1',
              pequeno ? 'text-xs' : 'text-sm'
            )}
          >
            {visiveis.length === 0 && (
              <li className="px-3.5 py-2.5 text-muted font-medium select-none">{mensagemVazia}</li>
            )}

            {visiveis.map((opcao, indice) => {
              const ativa = indice === indiceAtivo;
              const marcada = opcao.valor === valor;
              return (
                <li
                  key={String(opcao.valor)}
                  id={`${listaId}-${indice}`}
                  data-indice={indice}
                  role="option"
                  aria-selected={marcada}
                  // Evita tirar o foco do campo antes do clique valer.
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => escolher(opcao)}
                  onPointerMove={() => setIndiceAtivo(indice)}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3.5 py-2 cursor-pointer text-ink',
                    marcada ? 'font-bold' : 'font-medium',
                    ativa && 'bg-yellow/60'
                  )}
                >
                  <span className="truncate">{opcao.rotulo}</span>
                  {marcada && <Check className="w-4 h-4 shrink-0" />}
                </li>
              );
            })}

            {filtradas.length > LIMITE_VISIVEL && (
              <li className="px-3.5 py-2 text-xs text-muted border-t-2 border-ink/20 select-none">
                Mostrando {LIMITE_VISIVEL} de {filtradas.length}. Digite para refinar.
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <span className="text-xs font-bold text-red-600">{error}</span>}
    </div>
  );
}

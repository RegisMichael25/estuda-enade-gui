import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, googleHabilitado } from '@/lib/google';

// Login com Google (adiado): sem VITE_GOOGLE_CLIENT_ID, não renderiza nem carrega o script. Não testado com client real.

const SCRIPT_GSI = 'https://accounts.google.com/gsi/client';
let carregamento: Promise<void> | null = null;

function carregarGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!carregamento) {
    carregamento = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_GSI;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        carregamento = null;
        reject(new Error('Não foi possível carregar o login com Google.'));
      };
      document.head.appendChild(script);
    });
  }
  return carregamento;
}

/** O GIS guarda um callback só: o último botão montado recebe o token. */
let receptorAtual: ((idToken: string) => void) | null = null;
let inicializado = false;

function inicializar() {
  if (inicializado || !window.google) return;
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (resposta) => receptorAtual?.(resposta.credential),
    ux_mode: 'popup',
    use_fedcm_for_button: true
  });
  inicializado = true;
}

interface BotaoGoogleProps {
  aoReceberToken: (idToken: string) => void;
  texto?: 'signin_with' | 'signup_with' | 'continue_with';
  aoFalhar?: (mensagem: string) => void;
  desabilitado?: boolean;
}

export function BotaoGoogle({ aoReceberToken, texto = 'signin_with', aoFalhar, desabilitado }: BotaoGoogleProps) {
  const conteiner = useRef<HTMLDivElement>(null);
  const [falhou, setFalhou] = useState(false);
  const receptor = useRef(aoReceberToken);
  receptor.current = aoReceberToken;

  useEffect(() => {
    if (!googleHabilitado) return;
    let ativo = true;
    const meuReceptor = (idToken: string) => receptor.current(idToken);
    receptorAtual = meuReceptor;

    carregarGsi()
      .then(() => {
        if (!ativo || !conteiner.current || !window.google) return;
        inicializar();
        window.google.accounts.id.renderButton(conteiner.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: texto,
          shape: 'pill',
          logo_alignment: 'center',
          width: Math.min(conteiner.current.offsetWidth || 320, 400),
          locale: 'pt-BR'
        });
      })
      .catch((e: Error) => {
        if (!ativo) return;
        setFalhou(true);
        aoFalhar?.(e.message);
      });

    return () => {
      ativo = false;
      if (receptorAtual === meuReceptor) receptorAtual = null;
    };
  }, [texto, aoFalhar]);

  if (!googleHabilitado || falhou) return null;

  return (
    <div
      ref={conteiner}
      className={desabilitado ? 'w-full flex justify-center pointer-events-none opacity-60' : 'w-full flex justify-center'}
      aria-busy={desabilitado}
    />
  );
}

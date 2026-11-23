/**
 * Tipos mínimos do Google Identity Services (https://accounts.google.com/gsi/client) usados pelo BotaoGoogle.
 * Só o necessário para initialize + renderButton com o ID token (credential).
 */
declare namespace google.accounts.id {
  interface CredentialResponse {
    /** ID token (JWT) que o backend valida. */
    credential: string;
    select_by?: string;
  }

  interface IdConfiguration {
    client_id: string;
    callback: (resposta: CredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_button?: boolean;
  }

  interface GsiButtonConfiguration {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: number;
    locale?: string;
  }

  function initialize(config: IdConfiguration): void;
  function renderButton(elemento: HTMLElement, opcoes: GsiButtonConfiguration): void;
  function disableAutoSelect(): void;
}

interface Window {
  google?: { accounts: { id: typeof google.accounts.id } };
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Client ID web do Google (login com Google, adiado). Vazio = login com Google desligado. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Vazio = login com Google desligado. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

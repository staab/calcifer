/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JEV_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

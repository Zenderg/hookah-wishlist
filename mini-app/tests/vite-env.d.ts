/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API origin the admin dashboard calls (e.g. https://akai-api.cjs.vn) */
  readonly VITE_API_BASE_URL?: string
  /** Shared app_key header value — must match `app_key` in the backend config */
  readonly VITE_APP_KEY?: string
}

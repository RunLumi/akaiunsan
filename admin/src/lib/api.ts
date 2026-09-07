import { toast } from 'sonner'
import { useAuthStore, type AdminUser } from '@/stores/auth-store'

// Backend API (Express). The API base is inlined at build time by Vite —
// set VITE_API_BASE_URL / VITE_APP_KEY in the build environment (see
// .env.example and the Dockerfile ARGs).
const API_BASE: string =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://akai-api.cjs.vn')

// Every route group on the backend checks this header (middlewares/validator.ts
// headerValidator). The value must match `app_key` in the backend config.
const APP_KEY: string = import.meta.env.VITE_APP_KEY ?? ''

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  { authenticated = true }: { authenticated?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  // Some proxies (e.g. Caddy >= 2.8) strip underscore header names, so send
  // both spellings; the backend accepts either (middlewares/validator.ts).
  headers.set('app_key', APP_KEY)
  headers.set('x-app-key', APP_KEY)
  if (authenticated) {
    const token = useAuthStore.getState().auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection.')
  }

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    const message =
      (data as { message?: string } | null)?.message ??
      `Request failed (${res.status})`
    if (res.status === 401 && authenticated) handleSessionExpired()
    throw new ApiError(res.status, message)
  }
  return data as T
}

function handleSessionExpired() {
  const { auth } = useAuthStore.getState()
  if (!auth.accessToken) return
  auth.reset()
  toast.error('Session expired! Please sign in again.')
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

interface SignInResponse {
  id: number
  firstname: string
  lastname: string
  username: string
  email: string
  phone_number?: string
  role: string
  line_id?: string
  profile_image_url?: string
  permission: string[]
  _token: string
}

/** POST /auth/admin/signin — public tier (app_key only, no Bearer). */
export async function signInAdmin(
  username: string,
  password: string,
): Promise<AdminUser & { accessToken: string }> {
  const data = await apiFetch<SignInResponse>(
    '/auth/admin/signin',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    { authenticated: false },
  )
  return {
    id: data.id,
    firstname: data.firstname,
    lastname: data.lastname,
    username: data.username,
    email: data.email,
    phone_number: data.phone_number,
    role: data.role,
    permission: data.permission,
    profile_image_url: data.profile_image_url,
    accessToken: data._token,
  }
}

/** GET /back-office/verify-token — validates the Bearer JWT server-side. */
export function verifyAdminToken(): Promise<boolean> {
  return apiFetch<boolean>('/back-office/verify-token')
}

/** Client-side JWT expiry check (payload exp, seconds epoch). */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''))
    return typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

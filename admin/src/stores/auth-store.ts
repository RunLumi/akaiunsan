import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

// Session persists in a cookie so a refresh keeps the admin signed in.
// The cookie holds the whole session ({user, accessToken}) — the token is a
// 30-day JWT from the backend, checked for expiry by the route guard.
const SESSION_COOKIE = 'akai_admin_session'

export interface AdminUser {
  id: number
  firstname: string
  lastname: string
  username: string
  email: string
  phone_number?: string
  role: string
  permission: string[]
  profile_image_url?: string
}

interface AuthState {
  auth: {
    user: AdminUser | null
    accessToken: string
    setSession: (user: AdminUser, accessToken: string) => void
    setUser: (user: AdminUser | null) => void
    setAccessToken: (accessToken: string) => void
    reset: () => void
  }
}

interface StoredSession {
  user: AdminUser | null
  accessToken: string
}

const readSession = (): StoredSession => {
  try {
    const raw = getCookie(SESSION_COOKIE)
    if (!raw) return { user: null, accessToken: '' }
    const parsed = JSON.parse(raw)
    return {
      user: parsed?.user ?? null,
      accessToken: parsed?.accessToken ?? '',
    }
  } catch {
    return { user: null, accessToken: '' }
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  const initial = readSession()
  const write = (user: AdminUser | null, accessToken: string) => {
    setCookie(SESSION_COOKIE, JSON.stringify({ user, accessToken }))
    return { user, accessToken }
  }
  return {
    auth: {
      user: initial.user,
      accessToken: initial.accessToken,
      setSession: (user, accessToken) =>
        set((state) => ({
          ...state,
          auth: { ...state.auth, ...write(user, accessToken) },
        })),
      setUser: (user) =>
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            ...write(user, state.auth.accessToken),
          },
        })),
      setAccessToken: (accessToken) =>
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            ...write(state.auth.user, accessToken),
          },
        })),
      reset: () =>
        set((state) => {
          removeCookie(SESSION_COOKIE)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
    },
  }
})

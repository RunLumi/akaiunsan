import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'
import { isTokenExpired } from '@/lib/api'

export const Route = createFileRoute('/_authenticated')({
  // Auth guard: every /_authenticated route requires a session whose JWT has
  // not expired; otherwise bounce to sign-in preserving the intended URL.
  beforeLoad: ({ location }) => {
    const { auth } = useAuthStore.getState()
    if (!auth.accessToken || isTokenExpired(auth.accessToken)) {
      auth.reset()
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})

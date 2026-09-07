import { clearCookies } from '@/test-utils/cookies'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AdminUser } from './auth-store'

async function importAuthStore() {
  const { useAuthStore } = await import('./auth-store')
  return useAuthStore
}

const sampleUser: AdminUser = {
  id: 1,
  firstname: 'Akai',
  lastname: 'Unsan',
  username: 'admin@akaiunsan.com',
  email: 'admin@akaiunsan.com',
  role: 'admin',
  permission: ['User', 'Banner'],
}

describe('useAuthStore', () => {
  beforeEach(() => {
    clearCookies()
    vi.resetModules()
  })

  it('starts with an empty session when nothing is persisted', async () => {
    const useAuthStore = await importAuthStore()

    expect(useAuthStore.getState().auth.accessToken).toBe('')
    expect(useAuthStore.getState().auth.user).toBeNull()
  })

  it('setSession persists user and token so a new store instance reads them back', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setSession({ ...sampleUser }, 'jwt-token')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().auth.accessToken).toBe(
      'jwt-token'
    )
    expect(useAuthStoreAfterReload.getState().auth.user).toEqual(sampleUser)
  })

  it('setAccessToken keeps the signed-in user while rotating the token', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setSession({ ...sampleUser }, 'old-token')

    useAuthStore.getState().auth.setAccessToken('new-token')

    expect(useAuthStore.getState().auth.accessToken).toBe('new-token')
    expect(useAuthStore.getState().auth.user).toEqual(sampleUser)
  })

  it('updates the signed-in user via setUser', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setSession({ ...sampleUser }, 'jwt-token')

    const updated = { ...sampleUser, firstname: 'Renamed' }
    useAuthStore.getState().auth.setUser(updated)

    expect(useAuthStore.getState().auth.user).toEqual(updated)
  })

  it('reset clears user and access token and drops persistence', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setSession({ ...sampleUser }, 'will-be-cleared')

    useAuthStore.getState().auth.reset()

    expect(useAuthStore.getState().auth.user).toBeNull()
    expect(useAuthStore.getState().auth.accessToken).toBe('')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().auth.user).toBeNull()
    expect(useAuthStoreAfterReload.getState().auth.accessToken).toBe('')
  })
})

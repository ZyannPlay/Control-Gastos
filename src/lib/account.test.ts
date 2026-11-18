import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
const signOut = vi.fn()

vi.mock('./supabase', () => ({
  supabaseConfigured: true,
  supabase: { rpc: (...a: unknown[]) => rpc(...a), auth: { signOut: () => signOut() } },
}))

import { deleteMyAccount } from './account'

describe('deleteMyAccount', () => {
  beforeEach(() => {
    rpc.mockReset()
    signOut.mockReset()
  })

  it('éxito: llama signOut y devuelve null', async () => {
    rpc.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({ error: null })
    expect(await deleteMyAccount()).toBeNull()
    expect(rpc).toHaveBeenCalledWith('delete_my_account')
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('error de rpc: devuelve mensaje en español y no llama signOut', async () => {
    rpc.mockResolvedValue({ error: { message: 'Failed to fetch' } })
    expect(await deleteMyAccount()).toBe('Sin conexión. Revisá tu internet.')
    expect(signOut).not.toHaveBeenCalled()
  })
})

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserForm } from '../composables/useUserForm'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
vi.mock('@/lib/api', () => ({ api: apiMock }))

beforeEach(() => apiMock.mockReset())

describe('admin-created password accounts', () => {
  it.each(['', 'Short1', 'lowercase123', 'UPPERCASE123', 'NoDigitsHere', 'Aa1' + 'x'.repeat(1022)])(
    'rejects invalid password %s',
    async (password) => {
      const form = useUserForm(ref(null), ref([]))
      form.username.value = 'reader'
      form.password.value = password
      expect(await form.save()).toEqual({ ok: false, section: 'profile' })
      expect(apiMock).not.toHaveBeenCalled()
    },
  )

  it.each([true, false, 'network'])('clears password after submission outcome %s', async (outcome) => {
    if (outcome === 'network') apiMock.mockRejectedValueOnce(new Error('Offline'))
    else apiMock.mockResolvedValueOnce({ ok: outcome, json: async () => ({ message: 'Rejected' }) })
    const form = useUserForm(ref(null), ref([]))
    form.username.value = 'reader'
    form.password.value = 'ValidPassword123'
    try {
      await form.save()
    } catch {
      // network failures throw; password must still be scrubbed
    }
    expect(form.password.value).toBe('')
    expect(String(form.error.value)).not.toContain('ValidPassword123')
  })

  it('preserves shared account creation without sending a password', async () => {
    apiMock.mockResolvedValue({ ok: true })
    const form = useUserForm(ref(null), ref([]))
    form.isSharedAccount.value = true
    form.username.value = 'shared'
    form.name.value = 'Shared reader'
    expect(await form.save()).toEqual({ ok: true })
    expect(apiMock.mock.calls[0][0]).toBe('/api/v1/users/shared')
    expect(JSON.parse(apiMock.mock.calls[0][1].body)).not.toHaveProperty('password')
  })
})

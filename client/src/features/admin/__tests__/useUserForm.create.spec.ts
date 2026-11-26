import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserForm } from '../composables/useUserForm'

const { apiMock } = vi.hoisted(() => ({
  apiMock: vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(),
}))
vi.mock('@/lib/api', () => ({ api: apiMock }))

function makeResponse(data?: unknown, ok = true): Response {
  return {
    ok,
    json: async () => data,
  } as Response
}

beforeEach(() => apiMock.mockReset())

describe('admin-created password accounts', () => {
  it.each([
    '',
    'Short1',
    'lowercase123',
    'UPPERCASE123',
    'NoDigitsHere',
    'Aa1' + 'x'.repeat(1022),
    'ValidPass1\n',
    'ValidPass1\r',
    'Valid\nPass1',
    'Valid\r\nPass1',
  ])('rejects invalid password %j', async (password) => {
    const form = useUserForm(ref(null), ref([]))
    form.username.value = 'reader'
    form.password.value = password
    expect(await form.save()).toEqual({ ok: false, section: 'profile' })
    expect(apiMock).not.toHaveBeenCalled()
  })

  it.each([
    'ValidPass1',
    'Aa1!' + 'x'.repeat(4),
    'Aa1' + 'x'.repeat(1021),
    'P@ssw0rd!#$%',
  ])('accepts valid password %j matching backend policy', async (password) => {
    apiMock.mockResolvedValueOnce(makeResponse({ id: 42 }))
    const form = useUserForm(ref(null), ref([]))
    form.username.value = 'reader'
    form.password.value = password
    expect(await form.save()).toEqual({ ok: true })
    expect(apiMock).toHaveBeenCalledTimes(1)
  })

  it.each([true, false, 'network'] as const)('clears password after submission outcome %s', async (outcome) => {
    if (outcome === 'network') apiMock.mockRejectedValueOnce(new Error('Offline'))
    else apiMock.mockResolvedValueOnce(makeResponse({ message: 'Rejected' }, outcome))
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
    apiMock.mockResolvedValue(makeResponse())
    const form = useUserForm(ref(null), ref([]))
    form.isSharedAccount.value = true
    form.username.value = 'shared'
    form.name.value = 'Shared reader'
    expect(await form.save()).toEqual({ ok: true })
    expect(apiMock.mock.calls[0]?.[0]).toBe('/api/v1/users/shared')
    const body = String(apiMock.mock.calls[0]?.[1]?.body ?? '{}')
    expect(JSON.parse(body)).not.toHaveProperty('password')
  })
})

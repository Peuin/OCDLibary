import { afterEach, describe, expect, it, vi } from 'vitest'

type Listener = () => void

function stubServiceWorker(controller: object | null) {
  const listeners: Listener[] = []
  const register = vi
    .fn<() => Promise<{ update: () => Promise<void> }>>()
    .mockResolvedValue({ update: vi.fn<() => Promise<void>>().mockResolvedValue() })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller,
      register,
      addEventListener: (_type: string, listener: Listener) => listeners.push(listener),
    },
  })
  return { fireControllerChange: () => listeners.forEach((listener) => listener()), register }
}

describe('registerServiceWorker', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('reloads once when a new build replaces the controlling worker', async () => {
    const reload = vi.fn<() => void>()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload })
    const { fireControllerChange } = stubServiceWorker({})
    const { registerServiceWorker } = await import('../service-worker')

    registerServiceWorker()
    fireControllerChange()
    fireControllerChange()

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does not reload on the very first install', async () => {
    const reload = vi.fn<() => void>()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload })
    const { fireControllerChange } = stubServiceWorker(null)
    const { registerServiceWorker } = await import('../service-worker')

    registerServiceWorker()
    fireControllerChange()

    expect(reload).not.toHaveBeenCalled()
  })
})

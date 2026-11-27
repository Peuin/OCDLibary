import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReaderProgress } from '../useReaderProgress'

const api = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>())
vi.mock('@/lib/api', () => ({ api }))

describe('reader progress exit flush', () => {
  const wrappers: ReturnType<typeof mount>[] = []
  beforeEach(() => {
    vi.useFakeTimers()
    api.mockReset()
    api.mockResolvedValue({ ok: true })
  })
  afterEach(() => {
    wrappers.forEach((wrapper) => wrapper.unmount())
    wrappers.length = 0
    vi.useRealTimers()
  })

  function setup(trackingEnabled = ref(true)) {
    let progress!: ReturnType<typeof useReaderProgress>
    const beforeExitFlush = vi.fn<() => void>(() => progress.onRelocate({ cfi: 'epubcfi(/6/8)', fraction: 0.45 }))
    const wrapper = mount(
      defineComponent({
        setup() {
          progress = useReaderProgress(1, 2, ref(0), 0, { trackingEnabled, beforeExitFlush })
          return () => null
        },
      }),
    )
    wrappers.push(wrapper)
    return { progress, beforeExitFlush, wrapper }
  }

  it('captures the latest renderer location and sends it with keepalive before the 2s timer', async () => {
    const { progress, beforeExitFlush } = setup()
    progress.onRelocate({ cfi: 'epubcfi(/6/4)', fraction: 0.2 })
    await vi.advanceTimersByTimeAsync(50)
    window.dispatchEvent(new Event('pagehide'))
    expect(beforeExitFlush).toHaveBeenCalledOnce()
    expect(api).toHaveBeenCalledOnce()
    const options = api.mock.calls[0]![1] as RequestInit
    expect(options.keepalive).toBe(true)
    expect(JSON.parse(options.body as string)).toMatchObject({ cfi: 'epubcfi(/6/8)', percentage: 45 })
    await vi.advanceTimersByTimeAsync(2100)
    expect(api).toHaveBeenCalledOnce()
  })

  it('flushes before unmount and removes its pagehide listener', () => {
    const { wrapper, beforeExitFlush } = setup()
    wrapper.unmount()
    expect(beforeExitFlush).toHaveBeenCalledOnce()
    expect(api).toHaveBeenCalledOnce()
    window.dispatchEvent(new Event('pagehide'))
    expect(api).toHaveBeenCalledOnce()
  })

  it('does not flush when tracking is disabled (peek mode)', () => {
    const { progress, beforeExitFlush, wrapper } = setup(ref(false))
    progress.onRelocate({ cfi: 'epubcfi(/6/4)', fraction: 0.2 })
    window.dispatchEvent(new Event('pagehide'))
    wrapper.unmount()
    expect(beforeExitFlush).not.toHaveBeenCalled()
    expect(api).not.toHaveBeenCalled()
  })

  it('does not write an empty location when the renderer is still loading', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          useReaderProgress(1, 2, ref(0), 0, { beforeExitFlush: () => {} })
          return () => null
        },
      }),
    )
    wrappers.push(wrapper)
    window.dispatchEvent(new Event('pagehide'))
    wrapper.unmount()
    expect(api).not.toHaveBeenCalled()
  })
})

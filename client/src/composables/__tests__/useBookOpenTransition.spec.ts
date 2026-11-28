import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, onBeforeRouteLeave, RouterView, type Router } from 'vue-router'
import { createApp, defineComponent, h } from 'vue'
import {
  BOOK_OPEN_TRANSITION_NAME,
  leaveReaderWithTransition,
  openBookWithTransition,
  resetBookOpenTransitionForTests,
  supportsViewTransitions,
  useBookOpenTransition,
} from '../useBookOpenTransition'
import { useDisplaySettings } from '../useDisplaySettings'

type StartViewTransition = (update: () => Promise<void> | void) => { finished: Promise<unknown>; updateCallbackDone: Promise<unknown> }
const doc = document as unknown as { startViewTransition?: StartViewTransition }

const target = { name: 'reader', params: { bookId: 1, fileId: 2 }, query: { format: 'epub' } }

function makeRouter() {
  const push = vi.fn<(to: unknown) => Promise<void>>().mockResolvedValue(undefined)
  return { router: { push } as unknown as Router, push }
}

function setReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn<(query: string) => MediaQueryList>().mockImplementation(
      (query: string) =>
        ({
          matches: reduce && query.includes('reduce'),
          media: query,
          addEventListener: vi.fn<() => void>(),
          removeEventListener: vi.fn<() => void>(),
        }) as unknown as MediaQueryList,
    ),
  )
}

// Runs the update callback like a browser does, and lets the test end the transition.
function installViewTransitions() {
  let finish!: () => void
  const finished = new Promise<void>((resolve) => (finish = resolve))
  const seen: { nameBeforeUpdate?: string; activeDuringUpdate?: boolean } = {}
  const start = vi.fn<StartViewTransition>((update) => {
    seen.nameBeforeUpdate = source.style.getPropertyValue('view-transition-name')
    const updateCallbackDone = Promise.resolve(update()).then(() => {
      seen.activeDuringUpdate = useBookOpenTransition().coverTransitionActive.value
    })
    return { finished: updateCallbackDone.then(() => finished), updateCallbackDone }
  })
  doc.startViewTransition = start
  return { start, finish, seen }
}

let source: HTMLElement

describe('useBookOpenTransition', () => {
  beforeEach(() => {
    source = document.createElement('div')
    document.body.append(source)
    setReducedMotion(false)
    useDisplaySettings().lightReaderEffects.value = false
  })

  afterEach(() => {
    delete doc.startViewTransition
    source.remove()
    resetBookOpenTransitionForTests()
    useDisplaySettings().lightReaderEffects.value = false
    vi.unstubAllGlobals()
  })

  it('detects View Transitions support', () => {
    expect(supportsViewTransitions()).toBe(false)
    installViewTransitions()
    expect(supportsViewTransitions()).toBe(true)
  })

  it('falls back to a plain navigation when the browser has no View Transitions', async () => {
    const { router, push } = makeRouter()

    await openBookWithTransition(router, target, source)

    expect(push).toHaveBeenCalledWith(target)
    expect(source.style.getPropertyValue('view-transition-name')).toBe('')
  })

  it('morphs the clicked cover into the reader through a view transition', async () => {
    const { start, finish, seen } = installViewTransitions()
    const { router, push } = makeRouter()

    await openBookWithTransition(router, target, source)

    expect(start).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith(target)
    expect(seen.nameBeforeUpdate).toBe(BOOK_OPEN_TRANSITION_NAME)
    expect(seen.activeDuringUpdate).toBe(true)

    expect(useBookOpenTransition().veilVisible.value).toBe(true)

    // the veil lifts only once the transition has finished and the reader is mounted
    const shell = document.createElement('div')
    shell.className = 'reader-shell'
    document.body.append(shell)
    finish()
    await vi.waitFor(() => expect(useBookOpenTransition().coverTransitionActive.value).toBe(false))
    await vi.waitFor(() => expect(useBookOpenTransition().veilVisible.value).toBe(false))
    expect(source.style.getPropertyValue('view-transition-name')).toBe('')
    shell.remove()
  })

  it('does not raise the veil or the transition flag without View Transitions', async () => {
    const { router } = makeRouter()

    await openBookWithTransition(router, target, source)

    expect(useBookOpenTransition().veilVisible.value).toBe(false)
    expect(useBookOpenTransition().coverTransitionActive.value).toBe(false)
  })

  it('opens instantly when the user turned on light effects', async () => {
    const { start } = installViewTransitions()
    const { router, push } = makeRouter()
    useDisplaySettings().lightReaderEffects.value = true

    await openBookWithTransition(router, target, source)

    expect(start).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith(target)
  })

  it('opens instantly when the device asks for reduced motion', async () => {
    const { start } = installViewTransitions()
    const { router, push } = makeRouter()
    setReducedMotion(true)

    await openBookWithTransition(router, target, source)

    expect(start).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith(target)
  })

  it('opens without a transition when there is no cover to morph from', async () => {
    const { start } = installViewTransitions()
    const { router, push } = makeRouter()

    await openBookWithTransition(router, target, null)

    expect(start).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith(target)
  })

  it('still navigates when starting the transition throws', async () => {
    doc.startViewTransition = vi.fn<StartViewTransition>(() => {
      throw new Error('InvalidStateError')
    })
    const { router, push } = makeRouter()

    await openBookWithTransition(router, target, source)

    expect(push).toHaveBeenCalledWith(target)
    expect(source.style.getPropertyValue('view-transition-name')).toBe('')
  })

  it('reports light effects from the setting', () => {
    const { lightEffects } = useBookOpenTransition()
    expect(lightEffects.value).toBe(false)
    useDisplaySettings().lightReaderEffects.value = true
    expect(lightEffects.value).toBe(true)
  })

  it('pairs the outgoing reader with the destination cover when leaving', async () => {
    const { start, finish } = installViewTransitions()
    const readerShell = document.createElement('div')
    readerShell.className = 'reader-shell'
    document.body.append(readerShell)
    const targetCover = document.createElement('div')
    targetCover.dataset.bookCoverId = '1'
    vi.spyOn(targetCover, 'getBoundingClientRect').mockReturnValue({ width: 90, height: 140, left: 20, top: 30 } as DOMRect)

    const guard = leaveReaderWithTransition(1, { targetTimeoutMs: 120 })
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
    expect(readerShell.style.getPropertyValue('view-transition-name')).toBe(BOOK_OPEN_TRANSITION_NAME)

    await expect(guard).resolves.toBe(true)
    readerShell.remove()
    document.body.append(targetCover)

    await vi.waitFor(() => expect(targetCover.style.getPropertyValue('view-transition-name')).toBe(BOOK_OPEN_TRANSITION_NAME))

    finish()
    await vi.waitFor(() => expect(targetCover.style.getPropertyValue('view-transition-name')).toBe(''))
    expect(useBookOpenTransition().veilVisible.value).toBe(false)
    targetCover.remove()
  })

  it('uses the cover remembered from opening when it is visible again', async () => {
    vi.spyOn(source, 'getBoundingClientRect').mockReturnValue({ width: 90, height: 140, left: 20, top: 30 } as DOMRect)
    const { router } = makeRouter()
    await openBookWithTransition(router, target, source)
    const { start, finish } = installViewTransitions()
    const readerShell = document.createElement('div')
    readerShell.className = 'reader-shell'
    document.body.append(readerShell)

    const guard = leaveReaderWithTransition(1, { targetTimeoutMs: 120 })
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
    await expect(guard).resolves.toBe(true)
    readerShell.remove()

    await vi.waitFor(() => expect(source.style.getPropertyValue('view-transition-name')).toBe(BOOK_OPEN_TRANSITION_NAME))
    finish()
    await vi.waitFor(() => expect(source.style.getPropertyValue('view-transition-name')).toBe(''))
    readerShell.remove()
  })

  it('lets a real router back navigation finish through the leave guard', async () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 90, height: 140, left: 20, top: 30 } as DOMRect)
    const { start, finish } = installViewTransitions()
    const TargetPage = defineComponent({
      setup: () => () => h('div', { 'data-book-cover-id': '1' }),
    })
    const ReaderPage = defineComponent({
      setup() {
        onBeforeRouteLeave(() => leaveReaderWithTransition(1, { targetTimeoutMs: 120 }))
        return () => h('div', { class: 'reader-shell' })
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: TargetPage },
        { path: '/read/:bookId', component: ReaderPage },
      ],
    })
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(RouterView)
    app.use(router)
    app.mount(host)

    try {
      await router.push('/')
      await router.isReady()
      await router.push('/read/1')
      expect(host.querySelector('.reader-shell')).not.toBeNull()

      router.back()

      await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
      expect(start).toHaveBeenCalledTimes(1)
      const cover = host.querySelector<HTMLElement>('[data-book-cover-id="1"]')
      expect(cover).not.toBeNull()
      await vi.waitFor(() => expect(cover?.style.getPropertyValue('view-transition-name')).toBe(BOOK_OPEN_TRANSITION_NAME))
      finish()
      await vi.waitFor(() => expect(cover?.style.getPropertyValue('view-transition-name')).toBe(''))
    } finally {
      app.unmount()
      host.remove()
      rectSpy.mockRestore()
    }
  })

  it('uses the CSS veil fallback when leaving without View Transitions', async () => {
    vi.useFakeTimers()
    try {
      const targetCover = document.createElement('div')
      targetCover.dataset.bookCoverId = '1'
      vi.spyOn(targetCover, 'getBoundingClientRect').mockReturnValue({ width: 90, height: 140, left: 20, top: 30 } as DOMRect)
      document.body.append(targetCover)

      const guard = leaveReaderWithTransition(1, { targetTimeoutMs: 20 })
      await vi.advanceTimersByTimeAsync(0)
      await expect(guard).resolves.toBe(true)
      expect(useBookOpenTransition().veilVisible.value).toBe(true)
      expect(useBookOpenTransition().backFallbackActive.value).toBe(true)

      await vi.advanceTimersByTimeAsync(0)
      expect(useBookOpenTransition().backFallbackStyle.value?.transform).toContain('scale(')
      await vi.advanceTimersByTimeAsync(450)
      expect(useBookOpenTransition().veilVisible.value).toBe(false)
      expect(useBookOpenTransition().backFallbackActive.value).toBe(false)
      targetCover.remove()
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaves instantly with light effects even when View Transitions are available', async () => {
    const { start } = installViewTransitions()
    useDisplaySettings().lightReaderEffects.value = true

    await expect(leaveReaderWithTransition(1, { targetTimeoutMs: 10 })).resolves.toBe(true)

    expect(start).not.toHaveBeenCalled()
    expect(useBookOpenTransition().veilVisible.value).toBe(false)
  })
})

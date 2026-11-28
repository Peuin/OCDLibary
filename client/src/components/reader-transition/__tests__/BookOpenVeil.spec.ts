import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { Router } from 'vue-router'
import BookOpenVeil from '../BookOpenVeil.vue'
import { BOOK_OPEN_TRANSITION_NAME, openBookWithTransition, resetBookOpenTransitionForTests } from '@/composables/useBookOpenTransition'

type StartViewTransition = (update: () => Promise<void> | void) => { finished: Promise<unknown>; updateCallbackDone: Promise<unknown> }
const doc = document as unknown as { startViewTransition?: StartViewTransition }

describe('BookOpenVeil', () => {
  afterEach(() => {
    delete doc.startViewTransition
    resetBookOpenTransitionForTests()
  })

  it('renders nothing while no book is opening', () => {
    const wrapper = mount(BookOpenVeil)
    expect(wrapper.find('.book-open-veil').exists()).toBe(false)
  })

  it('covers the screen under the shared transition name while a cover opens', async () => {
    const wrapper = mount(BookOpenVeil, { attachTo: document.body })
    let seenName = ''
    doc.startViewTransition = vi.fn<StartViewTransition>((update) => {
      const updateCallbackDone = Promise.resolve(update()).then(async () => {
        await nextTick()
        seenName = (wrapper.find('.book-open-veil').element as HTMLElement | undefined)?.style.viewTransitionName ?? ''
      })
      return { finished: new Promise(() => {}), updateCallbackDone }
    })
    const source = document.createElement('div')
    const push = vi.fn<(to: unknown) => Promise<void>>().mockResolvedValue(undefined)

    await openBookWithTransition({ push } as unknown as Router, { name: 'reader' }, source)
    await nextTick()

    expect(wrapper.find('.book-open-veil').exists()).toBe(true)
    expect(seenName).toBe(BOOK_OPEN_TRANSITION_NAME)
    wrapper.unmount()
  })
})

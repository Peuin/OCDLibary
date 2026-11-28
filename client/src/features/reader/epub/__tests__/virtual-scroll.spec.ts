import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

type Section = { load: () => Promise<string | null>; unload?: () => void; linear?: string }
type LayoutState = { height: number; textShift: number }
type Layout = { states: Map<number, LayoutState>; vertical?: boolean; blockedFrames?: Set<number>; releaseFrames?: Map<number, () => void> }
const resizeCallbacks = new Map<Element, () => void>()

type Content = { index: number; doc?: Document; overlayer?: unknown }
type PaginatorEl = HTMLElement & {
  sections: Section[]
  open: (book: { dir?: string; sections: Section[] }) => void
  goTo: (target: { index: number; anchor?: unknown }) => Promise<void>
  getContents: () => Content[]
  setStyles: (styles: string | [string, string]) => void
  flushRelocate: () => void
  render: () => void
  destroy: () => void
  next: (distance?: number) => Promise<void>
  prev: (distance?: number) => Promise<void>
  snap: (vx: number, vy: number) => void
  scrollToAnchor: (anchor: number) => Promise<void>
}

type IndexBox = { index: number; top: number; bottom: number }
type VirtualScroller = {
  MAX_MOUNTED_SECTIONS: number
  computeSectionWindow: (options: {
    sections: { linear?: string }[]
    activeIndex: number
    radius?: number
    maxSections?: number
    heights?: Map<number, number>
    viewportSize?: number
  }) => number[]
  orderMounts: (target: number[], activeIndex: number) => number[]
  diffSectionWindow: (mounted: number[], target: number[]) => { toUnmount: number[]; toMount: number[] }
  orderContents: <T extends { index: number }>(contents: T[], activeIndex: number) => T[]
  findActiveSection: (boxes: IndexBox[], readingPoint: number) => number | undefined
}

const virtualScrollerModulePath = '../../../../../public/assets/foliate/virtual-scroller.js'
const paginatorModulePath = '../../../../../public/assets/foliate/paginator.js'

let vs: VirtualScroller

function installBrowserGlobals() {
  globalThis.ResizeObserver = class {
    private targets = new Set<Element>()
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) {
      this.targets.add(target)
      resizeCallbacks.set(target, () => this.callback([], this))
    }
    unobserve(target: Element) {
      this.targets.delete(target)
      resizeCallbacks.delete(target)
    }
    disconnect() {
      for (const target of this.targets) resizeCallbacks.delete(target)
      this.targets.clear()
    }
  }
  globalThis.matchMedia ??= () =>
    ({
      matches: false,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    }) as unknown as MediaQueryList
  // jsdom has no layout: ranges report empty geometry
  Range.prototype.getBoundingClientRect ??= () => new DOMRect()
  Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
}

// jsdom never navigates iframes: give each one a document that "loads" its section src.
function mockSectionIframes(layout?: Layout) {
  const originalCreateElement = document.createElement.bind(document)
  return vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
    const element = originalCreateElement(tagName, options)
    if (tagName !== 'iframe') return element
    let doc: Document | null = null
    Object.defineProperty(element, 'contentDocument', { configurable: true, get: () => doc })
    Object.defineProperty(element, 'src', {
      configurable: true,
      get() {
        return this.getAttribute('src') ?? ''
      },
      set(value: string) {
        this.setAttribute('src', value)
        const frameDoc = document.implementation.createHTMLDocument(value)
        frameDoc.body.innerHTML = `<p>${layout ? 'reader text '.repeat(500) : value}</p>`
        if (layout) {
          const index = Number(value.match(/section-(\d+)/)?.[1] ?? 0)
          const state = layout.states.get(index) ?? { height: 2000, textShift: 0 }
          layout.states.set(index, state)
          if (layout.vertical) frameDoc.body.style.writingMode = 'vertical-rl'
          frameDoc.documentElement.getBoundingClientRect = () => new DOMRect(0, 0, 800, state.height)
          frameDoc.body.getBoundingClientRect = () => new DOMRect(0, 0, 800, state.height)
          const paragraph = frameDoc.querySelector('p')!
          paragraph.getBoundingClientRect = () => new DOMRect(0, state.textShift, 700, 1800)
          const nativeCreateRange = frameDoc.createRange.bind(frameDoc)
          frameDoc.createRange = () => {
            const range = nativeCreateRange()
            const bounds = () => {
              const length = paragraph.textContent!.length
              const start = range.startContainer.nodeType === Node.TEXT_NODE ? range.startOffset / length : 0
              const end = range.endContainer.nodeType === Node.TEXT_NODE ? range.endOffset / length : 1
              return new DOMRect(0, state.textShift + start * 1800, 700, Math.max(1, (end - start) * 1800))
            }
            range.getBoundingClientRect = bounds
            range.getClientRects = () => [bounds()] as unknown as DOMRectList
            const clone = range.cloneRange.bind(range)
            range.cloneRange = () => {
              const cloned = frameDoc.createRange()
              const original = clone()
              cloned.setStart(original.startContainer, original.startOffset)
              cloned.setEnd(original.endContainer, original.endOffset)
              return cloned
            }
            return range
          }
        }
        Object.defineProperty(frameDoc, 'defaultView', { configurable: true, value: window })
        Object.defineProperty(frameDoc, 'fonts', { configurable: true, value: { ready: Promise.resolve() } })
        doc = frameDoc
        const dispatchLoad = () => this.dispatchEvent(new window.Event('load'))
        const index = Number(value.match(/section-(\d+)/)?.[1] ?? 0)
        if (layout?.blockedFrames?.has(index)) layout.releaseFrames?.set(index, dispatchLoad)
        else queueMicrotask(dispatchLoad)
      },
    })
    return element
  })
}

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  for (let i = 0; i < 20; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}

function makeSections(count: number, nonLinear: number[] = []) {
  return Array.from({ length: count }, (_, i) => ({
    load: vi.fn<() => Promise<string | null>>().mockResolvedValue(`section-${i}.xhtml`),
    unload: vi.fn<() => void>(),
    ...(nonLinear.includes(i) ? { linear: 'no' } : {}),
  }))
}

describe('virtual scroller window helpers', () => {
  beforeAll(async () => {
    vs = (await import(virtualScrollerModulePath)) as VirtualScroller
  })

  const sections = (n: number, nonLinear: number[] = []) => Array.from({ length: n }, (_, i) => (nonLinear.includes(i) ? { linear: 'no' } : {}))

  it('keeps the active section and one neighbour on each side by default', () => {
    expect(vs.computeSectionWindow({ sections: sections(10), activeIndex: 4 })).toEqual([3, 4, 5])
  })

  it('clips the window at the start and end of the spine', () => {
    expect(vs.computeSectionWindow({ sections: sections(10), activeIndex: 0 })).toEqual([0, 1])
    expect(vs.computeSectionWindow({ sections: sections(10), activeIndex: 9 })).toEqual([8, 9])
  })

  it('skips non-linear neighbours but keeps a non-linear active section', () => {
    expect(vs.computeSectionWindow({ sections: sections(10, [3, 5]), activeIndex: 4 })).toEqual([2, 4, 6])
    expect(vs.computeSectionWindow({ sections: sections(10, [4]), activeIndex: 4 })).toEqual([3, 4, 5])
  })

  it('widens the window past short sections but never above the hard cap of 5', () => {
    const heights = new Map([
      [3, 100],
      [4, 100],
      [5, 100],
      [2, 100],
      [6, 100],
      [1, 100],
      [7, 100],
    ])
    const window = vs.computeSectionWindow({ sections: sections(20), activeIndex: 4, heights, viewportSize: 1000 })
    expect(window).toEqual([2, 3, 4, 5, 6])
    expect(window.length).toBe(vs.MAX_MOUNTED_SECTIONS)
  })

  it('does not widen the window around long sections', () => {
    const heights = new Map([
      [3, 4000],
      [4, 4000],
      [5, 4000],
    ])
    expect(vs.computeSectionWindow({ sections: sections(20), activeIndex: 4, heights, viewportSize: 1000 })).toEqual([3, 4, 5])
  })

  it('returns no window for an unknown active section', () => {
    expect(vs.computeSectionWindow({ sections: sections(3), activeIndex: 7 })).toEqual([])
    expect(vs.computeSectionWindow({ sections: [], activeIndex: 0 })).toEqual([])
  })

  it('mounts sections below the reader before the ones above it, nearest first', () => {
    expect(vs.orderMounts([2, 3, 4, 5, 6], 4)).toEqual([5, 6, 3, 2])
  })

  it('diffs mounted sections against the target window', () => {
    expect(vs.diffSectionWindow([1, 2, 3], [2, 3, 4])).toEqual({ toUnmount: [1], toMount: [4] })
  })

  it('orders contents with the active section first', () => {
    const contents = [{ index: 5 }, { index: 3 }, { index: 4 }]
    expect(vs.orderContents(contents, 4).map((c) => c.index)).toEqual([4, 3, 5])
  })

  it('finds the section under the reading point', () => {
    const boxes = [
      { index: 3, top: 0, bottom: 500 },
      { index: 4, top: 500, bottom: 1500 },
      { index: 5, top: 1500, bottom: 1800 },
    ]
    expect(vs.findActiveSection(boxes, 10)).toBe(3)
    expect(vs.findActiveSection(boxes, 501)).toBe(4)
    expect(vs.findActiveSection(boxes, 5000)).toBe(5)
  })
})

describe('Paginator windowed scrolled mode', () => {
  let createElementSpy: ReturnType<typeof mockSectionIframes> | undefined
  let paginator: PaginatorEl | undefined

  beforeAll(async () => {
    installBrowserGlobals()
    await import(paginatorModulePath)
  })

  afterEach(() => {
    paginator?.destroy()
    paginator?.remove()
    paginator = undefined
    createElementSpy?.mockRestore()
    resizeCallbacks.clear()
  })

  let container: HTMLElement

  async function openPaginator(sections: Section[], flow: 'scrolled' | 'paginated', layout?: Layout) {
    createElementSpy = mockSectionIframes(layout)
    const attach = HTMLElement.prototype.attachShadow
    let root: ShadowRoot
    const spy = vi.spyOn(HTMLElement.prototype, 'attachShadow').mockImplementation(function (this: HTMLElement, init: ShadowRootInit) {
      root = attach.call(this, init)
      return root
    })
    const el = document.createElement('foliate-paginator') as PaginatorEl
    spy.mockRestore()
    container = root!.getElementById('container')!
    if (layout) {
      container.getBoundingClientRect = () => new DOMRect(0, 0, 800, 600)
      const top = root!.getElementById('top')!
      for (const [key, value] of Object.entries({ gap: '7%', margin: '48px', 'max-inline-size': '720px', 'max-column-count-spread': '1' }))
        top.style.setProperty(`--_${key}`, value)
      const insertBefore = container.insertBefore.bind(container)
      container.insertBefore = <T extends Node>(node: T, child: Node | null) => {
        const element = node as unknown as HTMLElement
        element.getBoundingClientRect = () => {
          let y = 0
          for (const sibling of container.children) {
            if (sibling === element) break
            y += sibling.getBoundingClientRect().height
          }
          return new DOMRect(0, y - container.scrollTop, 800, (parseFloat(element.style.height) || 600) + 96)
        }
        return insertBefore(node, child)
      }
    }
    el.setAttribute('flow', flow)
    document.body.append(el)
    el.open({ sections })
    paginator = el
    return el
  }

  it('mounts the active section and its neighbours and lists the active one first', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'scrolled')

    await el.goTo({ index: 4 })
    await flush()

    const contents = el.getContents()
    expect(contents.map((c) => c.index)).toEqual([4, 3, 5])
    expect(contents.every((c) => c.doc?.body)).toBe(true)
    expect(sections[3]!.load).toHaveBeenCalledTimes(1)
    expect(sections[5]!.load).toHaveBeenCalledTimes(1)
    expect(sections[6]!.load).not.toHaveBeenCalled()
  })

  it('keeps mounted sections when moving inside the window and unloads the one that leaves it', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    await flush()

    await el.goTo({ index: 5 })
    await flush()

    expect(el.getContents().map((c) => c.index)).toEqual([5, 4, 6])
    expect(sections[5]!.load).toHaveBeenCalledTimes(1)
    expect(sections[3]!.unload).toHaveBeenCalledTimes(1)
    expect(sections[4]!.unload).not.toHaveBeenCalled()
  })

  it('resets the window on a long jump and unloads every old section', async () => {
    const sections = makeSections(20)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    await flush()

    await el.goTo({ index: 15 })
    await flush()

    expect(el.getContents().map((c) => c.index)).toEqual([15, 14, 16])
    for (const i of [3, 4, 5]) expect(sections[i]!.unload).toHaveBeenCalledTimes(1)
  })

  it('does not mount a section whose load resolves after destroy() during a long jump', async () => {
    const sections = makeSections(20)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    await flush()

    let resolveLoad!: (src: string) => void
    sections[9]!.load.mockImplementationOnce(() => new Promise((resolve) => (resolveLoad = resolve)))
    void el.goTo({ index: 9 })
    await flush()
    el.destroy()
    resolveLoad('section-9.xhtml')
    await flush()

    expect(el.getContents()).toEqual([])
    expect(container.querySelectorAll('iframe')).toHaveLength(0)
    expect(sections[9]!.unload).toHaveBeenCalledTimes(1)
    for (const i of [8, 10]) expect(sections[i]!.load).not.toHaveBeenCalled()
  })

  it('emits load and create-overlayer for every mounted section', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'scrolled')
    const loads: number[] = []
    const overlayers: number[] = []
    el.addEventListener('load', (e) => loads.push((e as CustomEvent).detail.index))
    el.addEventListener('create-overlayer', (e) => overlayers.push((e as CustomEvent).detail.index))

    await el.goTo({ index: 4 })
    await flush()

    expect(loads.sort()).toEqual([3, 4, 5])
    expect(overlayers.sort()).toEqual([3, 4, 5])
  })

  it('applies reader styles to every mounted section', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    await flush()

    el.setStyles(['before-css', 'body { color: red }'])

    for (const { doc } of el.getContents()) expect(doc!.head.lastElementChild?.textContent).toBe('body { color: red }')
  })

  it('keeps a single section in paginated mode', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'paginated')

    await el.goTo({ index: 4 })
    await flush()

    expect(el.getContents().map((c) => c.index)).toEqual([4])
    expect(sections[3]!.load).not.toHaveBeenCalled()
    expect(sections[5]!.load).not.toHaveBeenCalled()
  })

  it('drops the neighbours when switching from scrolled to paginated', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    await flush()

    el.setAttribute('flow', 'paginated')
    await flush()

    expect(el.getContents().map((c) => c.index)).toEqual([4])
    expect(sections[3]!.unload).toHaveBeenCalledTimes(1)
    expect(sections[5]!.unload).toHaveBeenCalledTimes(1)
    expect(sections[4]!.unload).not.toHaveBeenCalled()
  })

  it('mounts the neighbours when switching from paginated to scrolled', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'paginated')
    await el.goTo({ index: 4 })
    await flush()

    el.setAttribute('flow', 'scrolled')
    await flush()

    expect(el.getContents().map((c) => c.index)).toEqual([4, 3, 5])
    expect(sections[4]!.load).toHaveBeenCalledTimes(1)
  })

  it('pages through section boundaries with next()/prev() (keyboard navigation) without reloading mounted sections', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'scrolled', { states: new Map() })
    let top = 0
    Object.defineProperty(container, 'scrollTop', {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        const max = Math.max(0, [...container.children].reduce((height, child) => height + child.getBoundingClientRect().height, 0) - 600)
        top = Math.min(max, Math.max(0, value))
      },
    })
    Object.defineProperty(container, 'scrollHeight', {
      configurable: true,
      get: () => [...container.children].reduce((height, child) => height + child.getBoundingClientRect().height, 0),
    })
    await el.goTo({ index: 4 })
    await flush()
    const startTop = top
    const visited = new Set<number>()
    const fractions: Array<[number, number]> = []
    el.addEventListener('relocate', (event) => {
      const { index, fraction } = (event as CustomEvent).detail
      visited.add(index)
      fractions.push([index, fraction])
    })

    for (let i = 0; i < 6; i++) {
      await el.next()
      await flush()
    }
    expect(top).toBeGreaterThan(startTop)
    expect(visited.has(5)).toBe(true)
    expect(sections[5]!.load).toHaveBeenCalledTimes(1)

    const position = ([index, fraction]: [number, number]) => index + fraction
    const afterNext = position(fractions.at(-1)!)
    for (let i = 0; i < 3; i++) {
      await el.prev()
      await flush()
    }
    expect(position(fractions.at(-1)!)).toBeLessThan(afterNext)
    expect(sections[4]!.load).toHaveBeenCalledTimes(1)
  })

  it('stays on the last section when next() is pressed at the end of the book', async () => {
    const sections = makeSections(3)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 2 })
    await flush()
    const before = el.getContents().map((c) => c.index)

    await el.next()
    await flush()
    await el.next()
    await flush()

    expect(el.getContents().map((c) => c.index)).toEqual(before)
    expect(sections[2]!.unload).not.toHaveBeenCalled()
    await el.prev()
    await flush()
    expect(el.getContents().length).toBeGreaterThan(0)
  })

  it('ignores a paginated touch snap past the last page of the book', async () => {
    const rejections: unknown[] = []
    const onRejection = (reason: unknown) => rejections.push(reason)
    process.on('unhandledRejection', onRejection)
    try {
      const sections = makeSections(3)
      const el = await openPaginator(sections, 'paginated', { states: new Map() })
      await el.goTo({ index: 2 })
      await flush()
      // two-page section; snap() reads the page bounds recorded by the last scroll
      let left = 0
      Object.defineProperty(container, 'scrollLeft', { configurable: true, get: () => left, set: (value: number) => (left = value) })
      const twoPages = () => {
        for (const child of container.children) (child as HTMLElement).getBoundingClientRect = () => new DOMRect(0, 0, 1600, 600)
      }
      twoPages()
      // lands on the last page of the last section
      await el.scrollToAnchor(0)
      el.snap(1, 0)
      await flush()
      expect(el.getContents().map((c) => c.index)).toEqual([2])

      await flush()
      expect(rejections).toEqual([])
    } finally {
      process.off('unhandledRejection', onRejection)
    }
  })

  describe('paginated page flip and flow switching (SCRUM-104)', () => {
    type FakeAnimation = {
      cancel: ReturnType<typeof vi.fn<() => void>>
      addEventListener: ReturnType<typeof vi.fn<(type: string, listener: () => void) => void>>
    }
    function stubAnimate() {
      const animations: FakeAnimation[] = []
      const animate = vi.fn<(keyframes: Keyframe[], options: KeyframeAnimationOptions) => Animation>(() => {
        const animation: FakeAnimation = { cancel: vi.fn<() => void>(), addEventListener: vi.fn<(type: string, listener: () => void) => void>() }
        animations.push(animation)
        return animation as unknown as Animation
      })
      ;(container as HTMLElement & { animate: typeof animate }).animate = animate
      return { animate, animations }
    }
    async function openTwoPageBook(flow: 'paginated' | 'scrolled') {
      const sections = makeSections(5)
      const el = await openPaginator(sections, flow, { states: new Map() })
      let left = 0
      Object.defineProperty(container, 'scrollLeft', { configurable: true, get: () => left, set: (value: number) => (left = value) })
      await el.goTo({ index: 2 })
      await flush()
      for (const child of container.children) (child as HTMLElement).getBoundingClientRect = () => new DOMRect(0, 0, 3200, 600)
      return { el, sections }
    }

    it('tilts the page with a light 3D flip when turning pages in paginated mode', async () => {
      const { el } = await openTwoPageBook('paginated')
      const { animate } = stubAnimate()

      await el.next()
      expect(animate).toHaveBeenCalledTimes(1)
      const [keyframes, options] = animate.mock.calls[0]!
      expect(keyframes[0]).toEqual({ transform: 'perspective(1800px) rotateY(-5deg)', filter: 'brightness(0.85)' })
      expect(keyframes[1]).toEqual({ transform: 'perspective(1800px) rotateY(0deg)', filter: 'brightness(1)' })
      expect(options).toEqual({ duration: 450, easing: 'cubic-bezier(0.42, 0.03, 0.21, 0.98)' })

      await el.prev()
      expect(animate.mock.calls[1]![0][0]).toMatchObject({ transform: 'perspective(1800px) rotateY(5deg)' })
    })

    it('does not flip when a two-page spread snaps to its current offset', async () => {
      const { el } = await openTwoPageBook('paginated')
      const { animate } = stubAnimate()
      await el.scrollToAnchor(0)
      container.scrollLeft = 800

      el.snap(0, 0)
      await flush()

      expect(container.scrollLeft).toBe(800)
      expect(animate).not.toHaveBeenCalled()
    })

    it('skips the flip in scrolled mode and when reduced motion is requested', async () => {
      const { el } = await openTwoPageBook('scrolled')
      const { animate } = stubAnimate()
      await el.next()
      expect(animate).not.toHaveBeenCalled()

      el.setAttribute('flow', 'paginated')
      await flush()
      el.setAttribute('reduced-motion', '')
      await el.next()
      expect(animate).not.toHaveBeenCalled()

      const matchMedia = vi.spyOn(globalThis, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
      el.removeAttribute('reduced-motion')
      await el.next()
      expect(animate).not.toHaveBeenCalled()
      matchMedia.mockRestore()
    })

    it('cancels a running flip and resets the cross axis when switching flow, without getting stuck', async () => {
      const { el, sections } = await openTwoPageBook('paginated')
      const { animations } = stubAnimate()
      await el.next()
      container.scrollLeft = 1600

      el.setAttribute('flow', 'scrolled')
      await flush()
      expect(animations[0]!.cancel).toHaveBeenCalled()
      expect(container.scrollLeft).toBe(0)
      expect(el.getContents().map((c) => c.index)).toEqual([2, 1, 3])

      container.scrollTop = 900
      el.setAttribute('flow', 'paginated')
      await flush()
      expect(container.scrollTop).toBe(0)
      expect(el.getContents().map((c) => c.index)).toEqual([2])

      el.setAttribute('flow', 'scrolled')
      await flush()
      expect(el.getContents().map((c) => c.index)).toEqual([2, 1, 3])
      expect(sections[2]!.unload).not.toHaveBeenCalled()
    })

    it('cancels the flip on destroy', async () => {
      const { el } = await openTwoPageBook('paginated')
      const { animations } = stubAnimate()
      await el.next()
      el.destroy()
      expect(animations[0]!.cancel).toHaveBeenCalled()
    })

    it('lays out two columns side by side on a wide paginated viewport', async () => {
      const { el } = await openTwoPageBook('paginated')
      el.setAttribute('max-column-count', '2')
      el.setAttribute('max-inline-size', '720px')
      const top = container.parentElement!
      expect(top.style.getPropertyValue('--_max-column-count')).toBe('2')
      // jsdom cannot resolve the landscape container query, so mirror what it yields: spread = column count
      top.style.setProperty('--_max-column-count-spread', top.style.getPropertyValue('--_max-column-count'))
      el.render()
      const doc = el.getContents()[0]!.doc!
      // container is 800px wide in the layout mock: two columns of (800 / 2 - gap)
      const columnWidth = parseFloat(doc.documentElement.style.columnWidth)
      expect(columnWidth).toBeGreaterThan(300)
      expect(columnWidth).toBeLessThan(400)
    })
  })

  it('retries an anchor clamped by the viewport once the next section supplies scroll space', async () => {
    const el = await openPaginator(makeSections(10), 'scrolled', { states: new Map() })
    let top = 0
    Object.defineProperty(container, 'scrollTop', {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        const max = Math.max(0, [...container.children].reduce((height, child) => height + child.getBoundingClientRect().height, 0) - 600)
        top = Math.min(max, Math.max(0, value))
      },
    })
    const relocated: number[] = []
    el.addEventListener('relocate', (event) => relocated.push((event as CustomEvent).detail.fraction))
    await el.goTo({ index: 4, anchor: 0.95 })
    expect(relocated.at(-1)).toBeLessThan(0.95)
    await flush()
    expect(relocated.at(-1)).toBeCloseTo(0.95)
  })

  it('uses caret hit testing for synchronous scroll anchoring instead of walking the whole chapter', async () => {
    const el = await openPaginator(makeSections(10), 'scrolled', { states: new Map() })
    await el.goTo({ index: 4 })
    await flush()
    const doc = el.getContents()[0]!.doc!
    const text = doc.querySelector('p')!.firstChild!
    const caret = vi.fn<(x: number, y: number) => Range>(() => {
      const range = doc.createRange()
      range.setStart(text, 100)
      range.collapse(true)
      return range
    })
    Object.assign(doc, { caretRangeFromPoint: caret })
    const walk = vi.spyOn(doc, 'createTreeWalker')
    for (let i = 0; i < 50; i++) {
      container.scrollTop += 1
      container.dispatchEvent(new Event('scroll'))
    }
    expect(caret).toHaveBeenCalledTimes(50)
    expect(walk).not.toHaveBeenCalled()
    el.flushRelocate()
    expect(walk).toHaveBeenCalledTimes(1)
  })

  it('does not rewrite unchanged styles or schedule redundant section reflows', async () => {
    const el = await openPaginator(makeSections(10), 'scrolled', { states: new Map() })
    await el.goTo({ index: 4 })
    await flush()
    el.setStyles('p { font-size: 21px }')
    await flush()
    const doc = el.getContents()[0]!.doc!
    const observer = new MutationObserver(() => {})
    observer.observe(doc.head, { subtree: true, childList: true, characterData: true })
    for (let i = 0; i < 20; i++) el.setStyles('p { font-size: 21px }')
    expect(observer.takeRecords()).toHaveLength(0)
    observer.disconnect()
  })

  it('keeps iframe and observer counts bounded across one hundred section windows', async () => {
    const sections = makeSections(300)
    const el = await openPaginator(sections, 'scrolled', { states: new Map() })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      for (let index = 1; index <= 100; index++) {
        await el.goTo({ index })
        await vi.advanceTimersByTimeAsync(81)
        expect(el.getContents()).toHaveLength(3)
        expect(container.querySelectorAll('iframe')).toHaveLength(3)
        expect(resizeCallbacks.size).toBe(4)
      }
      el.destroy()
      el.destroy()
      expect(container.querySelectorAll('iframe')).toHaveLength(0)
      expect(resizeCallbacks.size).toBe(0)
      for (const section of sections) expect(section.unload.mock.calls.length).toBeLessThanOrEqual(1)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('removes renderer document listeners when a slot leaves the window', async () => {
    const el = await openPaginator(makeSections(10), 'scrolled', { states: new Map() })
    await el.goTo({ index: 4 })
    await flush()
    const oldDoc = el.getContents().find((item) => item.index === 3)!.doc!
    const remove = vi.spyOn(oldDoc, 'removeEventListener')
    await el.goTo({ index: 5 })
    await flush()
    const events = remove.mock.calls.map(([type]) => type)
    for (const event of [
      'touchstart',
      'touchmove',
      'touchend',
      'pointerdown',
      'pointerup',
      'keydown',
      'keyup',
      'selectionchange',
      'focusin',
      'load',
      'error',
    ])
      expect(events).toContain(event)
    expect(el.getContents().some((item) => item.doc === oldDoc)).toBe(false)
  })

  it('emits one document unload per slot and releases old document input before removal', async () => {
    const el = await openPaginator(makeSections(10), 'scrolled')
    await el.goTo({ index: 4 })
    await flush()
    const original = new Map(el.getContents().map((item) => [item.index, item.doc]))
    const unloaded: { index: number; doc: Document }[] = []
    el.addEventListener('unload', (event) => unloaded.push((event as CustomEvent).detail))
    await el.goTo({ index: 5 })
    await flush()
    expect(unloaded.filter((item) => item.index === 3)).toHaveLength(1)
    expect(unloaded[0]!.doc).toBe(original.get(3))
    el.destroy()
    el.destroy()
    expect(unloaded.map((item) => item.doc).length).toBe(new Set(unloaded.map((item) => item.doc)).size)
    expect(unloaded.map((item) => item.index).sort()).toEqual([3, 4, 5, 6])
  })

  it('unloads every mounted section on destroy', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    await flush()

    el.destroy()

    for (const i of [3, 4, 5]) expect(sections[i]!.unload).toHaveBeenCalledTimes(1)
    expect(el.getContents()).toEqual([])
  })

  it('preserves a restored CFI range through layout and ignores its own navigation scroll', async () => {
    const el = await openPaginator(makeSections(10), 'scrolled', { states: new Map() })
    await el.goTo({ index: 3 })
    await flush()
    const doc = el.getContents()[0]!.doc!
    const anchor = doc.createRange()
    anchor.setStart(doc.querySelector('p')!.firstChild!, 1000)
    anchor.setEnd(doc.querySelector('p')!.firstChild!, 2000)
    const relocated = vi.fn<(event: Event) => void>()
    el.addEventListener('relocate', relocated)
    await el.goTo({ index: 3, anchor })
    container.dispatchEvent(new Event('scroll'))
    el.render()
    el.render()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(anchor.startOffset).toBe(1000)
    expect(anchor.endOffset).toBe(2000)
    for (const [event] of relocated.mock.calls) expect((event as CustomEvent).detail.range).toBe(anchor)
    const count = relocated.mock.calls.length
    el.flushRelocate()
    expect(relocated).toHaveBeenCalledTimes(count)
  })

  it('debounces same-section scroll locations for 200ms and flushes the latest range', async () => {
    const el = await openPaginator(makeSections(10), 'scrolled', { states: new Map() })
    await el.goTo({ index: 3 })
    await flush()
    const relocated = vi.fn<(event: Event) => void>()
    el.addEventListener('relocate', relocated)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      container.scrollTop += 100
      container.dispatchEvent(new Event('scroll'))
      await vi.advanceTimersByTimeAsync(150)
      container.scrollTop += 100
      container.dispatchEvent(new Event('scroll'))
      await vi.advanceTimersByTimeAsync(199)
      expect(relocated).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(relocated).toHaveBeenCalledTimes(1)
      const first = (relocated.mock.calls[0]![0] as CustomEvent).detail
      expect(first.index).toBe(3)
      container.scrollTop += 150
      container.dispatchEvent(new Event('scroll'))
      el.flushRelocate()
      expect(relocated).toHaveBeenCalledTimes(2)
      expect((relocated.mock.calls[1]![0] as CustomEvent).detail.fraction).toBeGreaterThan(first.fraction)
      await vi.advanceTimersByTimeAsync(300)
      expect(relocated).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('emits a section change immediately and cancels the previous section timer', async () => {
    const el = await openPaginator(makeSections(10), 'scrolled', { states: new Map() })
    await el.goTo({ index: 3 })
    await flush()
    const relocated = vi.fn<(event: Event) => void>()
    el.addEventListener('relocate', relocated)
    container.scrollTop += 100
    container.dispatchEvent(new Event('scroll'))
    const frames = [...container.children]
    const next = frames[2]!.getBoundingClientRect()
    container.scrollTop += next.top + 100
    container.dispatchEvent(new Event('scroll'))
    expect(relocated).toHaveBeenCalledTimes(1)
    expect((relocated.mock.calls[0]![0] as CustomEvent).detail.index).toBe(4)
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(relocated).toHaveBeenCalledTimes(1)
  })

  it('coalesces layout relocations within a frame and cancels them on destroy', async () => {
    const el = await openPaginator(makeSections(10), 'scrolled', { states: new Map() })
    await el.goTo({ index: 3 })
    await flush()
    const relocated = vi.fn<(event: Event) => void>()
    el.addEventListener('relocate', relocated)
    el.render()
    el.render()
    el.render()
    expect(relocated).not.toHaveBeenCalled()
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(relocated).toHaveBeenCalledTimes(1)
    container.scrollTop += 100
    container.dispatchEvent(new Event('scroll'))
    el.render()
    el.destroy()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(relocated).toHaveBeenCalledTimes(1)
  })

  it('waits for an 80ms quiet period and skips intermediate navigation windows', async () => {
    const sections = makeSections(12)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    expect(sections[5]!.load).not.toHaveBeenCalled()
    await el.goTo({ index: 8 })
    await flush()

    expect(el.getContents().map((c) => c.index)).toEqual([8, 7, 9])
    expect(sections[3]!.load).not.toHaveBeenCalled()
    expect(sections[5]!.load).not.toHaveBeenCalled()
  })

  it('starts prefetch only after the full 80ms debounce', async () => {
    const sections = makeSections(12)
    const el = await openPaginator(sections, 'scrolled')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      await el.goTo({ index: 4 })
      await vi.advanceTimersByTimeAsync(79)
      expect(sections[5]!.load).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(sections[5]!.load).toHaveBeenCalledTimes(1)
    } finally {
      el.destroy()
      vi.useRealTimers()
    }
  })

  it('settles an iframe load cancelled by a far jump and ignores its late load event', async () => {
    const sections = makeSections(12)
    const releaseFrames = new Map<number, () => void>()
    const el = await openPaginator(sections, 'scrolled', { states: new Map(), blockedFrames: new Set([5]), releaseFrames })
    const loads: number[] = []
    el.addEventListener('load', (e) => loads.push((e as CustomEvent).detail.index))
    await el.goTo({ index: 4 })
    await flush()
    expect(releaseFrames.has(5)).toBe(true)
    await el.goTo({ index: 8 })
    await flush()
    releaseFrames.get(5)!()
    await flush()
    expect(loads).not.toContain(5)
    expect(el.getContents().map((c) => c.index)).toEqual([8, 7, 9])
    expect(sections[5]!.unload).toHaveBeenCalledTimes(1)
  })

  it('does not let an older navigation waiting on prefetch replace a newer destination', async () => {
    const sections = makeSections(12)
    let complete!: (src: string) => void
    sections[5]!.load.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve
        }),
    )
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    await flush()
    const oldNavigation = el.goTo({ index: 5 })
    await el.goTo({ index: 8 })
    complete('section-5.xhtml')
    await oldNavigation
    await flush()
    expect(el.getContents().map((c) => c.index)).toEqual([8, 7, 9])
  })

  it('discards an in-flight neighbour that leaves the window while scrolling', async () => {
    const sections = makeSections(12)
    let complete!: (src: string) => void
    sections[3]!.load.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve
        }),
    )
    const el = await openPaginator(sections, 'scrolled', { states: new Map() })
    const loads: number[] = []
    el.addEventListener('load', (e) => loads.push((e as CustomEvent).detail.index))
    await el.goTo({ index: 4 })
    await flush()
    expect(sections[3]!.load).toHaveBeenCalledTimes(1)

    container.scrollTop = 2200
    container.dispatchEvent(new Event('scroll'))
    await flush()
    expect(sections[6]!.load).toHaveBeenCalledTimes(1)
    complete('section-3.xhtml')
    await flush()

    expect(el.getContents().map((c) => c.index)).toEqual([5, 4, 6])
    expect(loads).not.toContain(3)
    expect(sections[3]!.unload).toHaveBeenCalledTimes(1)
  })

  it('waits for obsolete source cleanup before reopening the same item in paginated mode', async () => {
    const sections = makeSections(12)
    let complete!: (src: string) => void
    sections[5]!.load.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve
        }),
    )
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    await flush()
    el.setAttribute('flow', 'paginated')
    const destination = el.goTo({ index: 5 })
    await Promise.resolve()
    expect(sections[5]!.load).toHaveBeenCalledTimes(1)
    complete('section-5.xhtml')
    await destination
    await flush()
    expect(sections[5]!.load).toHaveBeenCalledTimes(2)
    expect(sections[5]!.unload).toHaveBeenCalledTimes(1)
    expect(el.getContents().map((c) => c.index)).toEqual([5])
  })

  it('cancels pending prefetch when destroyed before its debounce expires', async () => {
    const sections = makeSections(8)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 3 })
    el.destroy()
    await flush()
    expect(sections[2]!.load).not.toHaveBeenCalled()
    expect(sections[4]!.load).not.toHaveBeenCalled()
    expect(el.getContents()).toEqual([])
  })

  it('compensates prepend and removal through repeated reverse scrolling from chapter 3 to 1', async () => {
    const sections = makeSections(8)
    const el = await openPaginator(sections, 'scrolled', { states: new Map() })
    await el.goTo({ index: 2, anchor: 0.2 })
    await flush()

    container.scrollTop = 600
    container.dispatchEvent(new Event('scroll'))
    await flush()
    expect(el.getContents()[0]!.index).toBe(1)
    // Chapter 1 was inserted above chapter 2; its reading offset remains 600px.
    expect(container.scrollTop).toBe(600 + 2096)

    container.scrollTop = 600
    container.dispatchEvent(new Event('scroll'))
    await flush()
    expect(el.getContents().map((c) => c.index)).toEqual([0, 1])
    expect(container.scrollTop).toBe(600)
    expect(sections[2]!.unload).toHaveBeenCalledTimes(1)
    expect(sections[3]!.unload).toHaveBeenCalledTimes(1)
  })

  it('preserves the reading line when a late image grows above it inside the active section', async () => {
    const layout: Layout = { states: new Map() }
    const el = await openPaginator(makeSections(8), 'scrolled', layout)
    await el.goTo({ index: 3, anchor: 0.4 })
    await flush()
    const before = container.scrollTop
    const doc = el.getContents()[0]!.doc!
    const img = doc.createElement('img')
    doc.body.prepend(img)
    layout.states.get(3)!.height += 300
    layout.states.get(3)!.textShift += 300
    img.dispatchEvent(new Event('load'))
    resizeCallbacks.get(doc.body)?.()
    await flush()
    expect(container.scrollTop).toBeCloseTo(before + 300, 2)
  })

  it('does not undo a fresh user scroll when an image finishes in the same frame', async () => {
    const layout: Layout = { states: new Map() }
    const el = await openPaginator(makeSections(8), 'scrolled', layout)
    await el.goTo({ index: 3, anchor: 0.4 })
    await flush()
    container.scrollTop += 200
    container.dispatchEvent(new Event('scroll'))
    const beforeImage = container.scrollTop
    const doc = el.getContents()[0]!.doc!
    const img = doc.createElement('img')
    doc.body.prepend(img)
    layout.states.get(3)!.height += 300
    layout.states.get(3)!.textShift += 300
    img.dispatchEvent(new Event('load'))
    await flush()
    expect(container.scrollTop).toBeCloseTo(beforeImage + 300, 2)
  })

  it('keeps scrollTop unchanged when the late image is below the reading line', async () => {
    const layout: Layout = { states: new Map() }
    const el = await openPaginator(makeSections(8), 'scrolled', layout)
    await el.goTo({ index: 3, anchor: 0.4 })
    await flush()
    const before = container.scrollTop
    const doc = el.getContents()[0]!.doc!
    layout.states.get(3)!.height += 300
    const img = doc.createElement('img')
    doc.body.append(img)
    img.dispatchEvent(new Event('load'))
    await flush()
    expect(container.scrollTop).toBeCloseTo(before, 2)
  })

  it('compensates a preceding section resize and coalesces image/observer updates into one redraw', async () => {
    const layout: Layout = { states: new Map() }
    const el = await openPaginator(makeSections(8), 'scrolled', layout)
    const redraw = vi.fn<() => void>()
    el.addEventListener('create-overlayer', (e) => {
      ;(e as CustomEvent).detail.attach({ element: document.createElement('div'), redraw })
    })
    await el.goTo({ index: 3, anchor: 0.4 })
    await flush()
    const before = container.scrollTop
    redraw.mockClear()
    const doc = el.getContents().find((c) => c.index === 2)!.doc!
    const img = doc.createElement('img')
    doc.body.append(img)
    layout.states.get(2)!.height += 240
    img.dispatchEvent(new Event('load'))
    img.dispatchEvent(new Event('error'))
    resizeCallbacks.get(doc.body)?.()
    resizeCallbacks.get(doc.body)?.()
    await flush()
    expect(container.scrollTop).toBeCloseTo(before + 240, 2)
    expect(redraw).toHaveBeenCalledTimes(1)
  })

  it('removes late-image listeners and observer callbacks when a section is evicted', async () => {
    const layout: Layout = { states: new Map() }
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'scrolled', layout)
    await el.goTo({ index: 3 })
    await flush()
    const oldDoc = el.getContents().find((c) => c.index === 2)!.doc!
    const img = oldDoc.createElement('img')
    oldDoc.body.append(img)
    await el.goTo({ index: 7 })
    await flush()
    const before = container.scrollTop
    expect(resizeCallbacks.has(oldDoc.body)).toBe(false)
    layout.states.get(2)!.height += 500
    img.dispatchEvent(new Event('load'))
    await flush()
    expect(container.scrollTop).toBe(before)
    expect(el.getContents().map((c) => c.index)).toEqual([7, 6, 8])
  })

  it('keeps vertical-rl in the existing single-section mode', async () => {
    const sections = makeSections(8)
    const el = await openPaginator(sections, 'scrolled', { states: new Map(), vertical: true })
    await el.goTo({ index: 3 })
    await flush()
    expect(el.getContents().map((c) => c.index)).toEqual([3])
    expect(sections[2]!.load).not.toHaveBeenCalled()
    expect(sections[4]!.load).not.toHaveBeenCalled()
  })

  it('still rejects a section that produces no source', async () => {
    const sections = makeSections(3)
    sections[1]!.load.mockResolvedValue(null)
    const el = await openPaginator(sections, 'scrolled')

    await expect(el.goTo({ index: 1 })).rejects.toThrow('Failed to load section 1')
  })
})

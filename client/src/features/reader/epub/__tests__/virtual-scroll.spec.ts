import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

type Section = { load: () => Promise<string | null>; unload?: () => void; linear?: string }
type Content = { index: number; doc?: Document; overlayer?: unknown }
type PaginatorEl = HTMLElement & {
  sections: Section[]
  open: (book: { dir?: string; sections: Section[] }) => void
  goTo: (target: { index: number; anchor?: unknown }) => Promise<void>
  getContents: () => Content[]
  setStyles: (styles: string | [string, string]) => void
  destroy: () => void
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
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
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
function mockSectionIframes() {
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
        frameDoc.body.innerHTML = `<p>${value}</p>`
        Object.defineProperty(frameDoc, 'defaultView', { configurable: true, value: window })
        Object.defineProperty(frameDoc, 'fonts', { configurable: true, value: { ready: Promise.resolve() } })
        doc = frameDoc
        queueMicrotask(() => this.dispatchEvent(new window.Event('load')))
      },
    })
    return element
  })
}

const flush = async () => {
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
    paginator?.remove()
    paginator = undefined
    createElementSpy?.mockRestore()
  })

  async function openPaginator(sections: Section[], flow: 'scrolled' | 'paginated') {
    createElementSpy = mockSectionIframes()
    const el = document.createElement('foliate-paginator') as PaginatorEl
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

  it('unloads every mounted section on destroy', async () => {
    const sections = makeSections(10)
    const el = await openPaginator(sections, 'scrolled')
    await el.goTo({ index: 4 })
    await flush()

    el.destroy()

    for (const i of [3, 4, 5]) expect(sections[i]!.unload).toHaveBeenCalledTimes(1)
    expect(el.getContents()).toEqual([])
  })

  it('still rejects a section that produces no source', async () => {
    const sections = makeSections(3)
    sections[1]!.load.mockResolvedValue(null)
    const el = await openPaginator(sections, 'scrolled')

    await expect(el.goTo({ index: 1 })).rejects.toThrow('Failed to load section 1')
  })
})

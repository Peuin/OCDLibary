import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../../public/assets/foliate/paginator.js', () => ({}))

type Layer = { element: SVGElement; add: (key: string, range: Range, draw: unknown) => void; remove: (key: string) => void; redraw: () => void }
type Section = { id: string; size: number; createDocument: () => Promise<Document>; mediaOverlay?: object }
type Book = {
  sections: Section[]
  metadata: { language: string }
  media: { activeClass: string }
  getMediaOverlay: () => EventTarget & { stop: () => void }
  resolveHref: (href: string) => { index: number; anchor: (doc: Document) => Element | null }
  isExternal: () => boolean
}
type Content = { index: number; doc: Document; overlayer?: Layer }
class Renderer extends HTMLElement {
  book!: Book
  contents: Content[] = []
  active = 0
  blocked: (() => Promise<void>) | null = null
  open(book: Book) {
    this.book = book
  }
  getContents() {
    return [...this.contents].sort((a, b) => Number(b.index === this.active) - Number(a.index === this.active))
  }
  async mount(index: number) {
    const doc = await this.book.sections[index]!.createDocument()
    const content: Content = { index, doc }
    this.contents.push(content)
    this.dispatchEvent(new CustomEvent('load', { detail: { doc, index } }))
    this.dispatchEvent(
      new CustomEvent('create-overlayer', {
        detail: {
          doc,
          index,
          attach: (layer: Layer) => {
            content.overlayer = layer
          },
        },
      }),
    )
    return content
  }
  async goTo(target: { index: number }) {
    if (this.blocked) await this.blocked()
    this.active = target.index
  }
  destroy() {
    this.contents = []
  }
}
interface View extends HTMLElement {
  renderer: Renderer
  open: (book: Book) => Promise<void>
  close: () => void
  search: (opts: { query: string }) => AsyncGenerator<unknown>
  clearSearch: () => void
  addAnnotation: (annotation: { value: string }) => Promise<unknown>
  getCFI: (index: number, range: Range) => string
  startMediaOverlay: () => unknown
}
let ViewClass: new () => View
const views: View[] = []
function createDoc(index: number) {
  const doc = document.implementation.createHTMLDocument()
  doc.body.innerHTML = `<p id="same">Section ${index} needle text</p>`
  const native = doc.createRange.bind(doc)
  doc.createRange = () => {
    const range = native()
    range.getClientRects = () => [new DOMRect(10, 20, 100, 20)] as unknown as DOMRectList
    return range
  }
  return doc
}
async function setup() {
  const overlay = Object.assign(new EventTarget(), { stop: vi.fn<() => void>(), start: vi.fn<(index: number) => void>() })
  const book: Book = {
    metadata: { language: 'en' },
    media: { activeClass: 'narrating' },
    isExternal: () => false,
    sections: Array.from({ length: 4 }, (_, index) => ({
      id: `ch${index}.xhtml`,
      size: 1000,
      mediaOverlay: {},
      createDocument: async () => createDoc(index),
    })),
    getMediaOverlay: () => overlay,
    resolveHref: (href) => ({ index: Number(href.match(/ch(\d+)/)![1]), anchor: (doc) => doc.getElementById('same') }),
  }
  const view = new ViewClass()
  views.push(view)
  await view.open(book)
  return { view, renderer: view.renderer, book, overlay }
}
const tick = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}

beforeAll(async () => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList
  customElements.define('foliate-paginator', Renderer)
  const modulePath = '../../../../../public/assets/foliate/view.js'
  ;({ View: ViewClass } = await import(modulePath))
})
afterEach(() => {
  views.forEach((view) => view.close())
  views.length = 0
})

describe('Foliate multi-section overlay integration', () => {
  it('restores search outlines after remount and clears every mounted section without resurrection', async () => {
    const { view, renderer } = await setup()
    const first = await renderer.mount(0),
      second = await renderer.mount(1)
    const results = []
    for await (const result of view.search({ query: 'needle' })) results.push(result)
    await tick()
    expect(results.filter((item) => typeof item === 'object' && item && 'subitems' in item)).toHaveLength(4)
    expect(first.overlayer!.element.childElementCount).toBe(1)
    expect(second.overlayer!.element.childElementCount).toBe(1)
    renderer.contents = renderer.contents.filter((item) => item.index !== 1)
    const remounted = await renderer.mount(1)
    await tick()
    expect(remounted.overlayer!.element.childElementCount).toBe(1)
    view.clearSearch()
    expect(first.overlayer!.element.childElementCount).toBe(0)
    expect(remounted.overlayer!.element.childElementCount).toBe(0)
    renderer.contents = renderer.contents.filter((item) => item.index !== 1)
    const cleared = await renderer.mount(1)
    await tick()
    expect(cleared.overlayer!.element.childElementCount).toBe(0)
  })

  it('attaches the overlayer before publishing its lifecycle event and draws in the CFI owner document', async () => {
    const { view, renderer } = await setup()
    const attached: boolean[] = []
    view.addEventListener('create-overlay', (event) => {
      const index = (event as CustomEvent).detail.index
      attached.push(!!renderer.getContents().find((item) => item.index === index)?.overlayer)
    })
    const first = await renderer.mount(0),
      second = await renderer.mount(1)
    renderer.active = 0
    const range = second.doc.createRange()
    range.selectNodeContents(second.doc.getElementById('same')!.firstChild!)
    const cfi = view.getCFI(1, range)
    const draw = vi.fn<(event: Event) => void>((event) => {
      const { draw, range: drawnRange } = (event as CustomEvent).detail
      expect(drawnRange.startContainer.ownerDocument).toBe(second.doc)
      draw(() => document.createElementNS('http://www.w3.org/2000/svg', 'g'))
    })
    view.addEventListener('draw-annotation', draw)
    await view.addAnnotation({ value: cfi })
    expect(attached).toEqual([true, true])
    expect(draw).toHaveBeenCalledOnce()
    expect(first.overlayer!.element.childElementCount).toBe(0)
    expect(second.overlayer!.element.childElementCount).toBe(1)
  })

  it('does not publish or draw stale search results after clear while a section document is loading', async () => {
    const { view, renderer, book } = await setup()
    const first = await renderer.mount(0)
    let release!: (doc: Document) => void
    book.sections[0]!.createDocument = () =>
      new Promise((resolve) => {
        release = resolve
      })
    const iterator = view.search({ query: 'needle' })
    const next = iterator.next()
    await vi.waitFor(() => expect(release).toBeTypeOf('function'))
    view.clearSearch()
    release(createDoc(0))
    expect((await next).done).toBe(true)
    await tick()
    expect(first.overlayer!.element.childElementCount).toBe(0)
  })

  it('highlights the correct narration section including index zero and cancels a late highlight', async () => {
    const { view, renderer, overlay } = await setup()
    const first = await renderer.mount(0),
      second = await renderer.mount(1)
    renderer.active = 1
    overlay.dispatchEvent(new CustomEvent('highlight', { detail: { text: 'ch0.xhtml#same' } }))
    await tick()
    expect(first.doc.getElementById('same')!.classList.contains('narrating')).toBe(true)
    expect(second.doc.getElementById('same')!.classList.contains('narrating')).toBe(false)
    overlay.dispatchEvent(new CustomEvent('highlight', { detail: { text: 'ch1.xhtml#same' } }))
    await tick()
    expect(first.doc.getElementById('same')!.classList.contains('narrating')).toBe(false)
    expect(second.doc.getElementById('same')!.classList.contains('narrating')).toBe(true)
    let release!: () => void
    renderer.blocked = () =>
      new Promise((resolve) => {
        release = resolve
      })
    overlay.dispatchEvent(new CustomEvent('highlight', { detail: { text: 'ch0.xhtml#same' } }))
    overlay.dispatchEvent(new Event('unhighlight'))
    release()
    await tick()
    expect(first.doc.querySelector('.narrating')).toBeNull()
    expect(second.doc.querySelector('.narrating')).toBeNull()
    renderer.blocked = null
    renderer.active = 1
    view.startMediaOverlay()
    expect(overlay.start).toHaveBeenCalledWith(1)
    view.close()
    overlay.dispatchEvent(new CustomEvent('highlight', { detail: { text: 'ch0.xhtml#same' } }))
    await tick()
    expect(renderer.active).toBe(1)
  })
})

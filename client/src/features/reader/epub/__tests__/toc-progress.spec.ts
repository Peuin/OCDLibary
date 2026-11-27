import { describe, expect, it } from 'vitest'

const progressModulePath = '../../../../../public/assets/foliate/progress.js'

describe('TOCProgress fragments', () => {
  it('inherits the last preceding TOC entry for a spine section without its own entries', async () => {
    const { TOCProgress } = await import(progressModulePath)
    const progress = new TOCProgress()
    await progress.init({
      toc: [{ href: 'a.xhtml#one' }, { href: 'a.xhtml#two' }],
      ids: ['a.xhtml', 'b.xhtml'],
      splitHref: (href: string) => href.split('#'),
      getFragment: (doc: Document, id: string) => doc.getElementById(id),
    })
    const doc = document.implementation.createHTMLDocument()
    doc.body.innerHTML = '<p>Next section</p><h2 id="one">An unrelated ID</h2>'
    const range = doc.createRange()
    range.selectNodeContents(doc.querySelector('p')!)
    expect(progress.getProgress(1, range).href).toBe('a.xhtml#two')
  })

  it('uses the start of the reading range even when the next subheading is visible', async () => {
    const { TOCProgress } = await import(progressModulePath)
    const progress = new TOCProgress()
    const toc = [
      {
        href: 'ch.xhtml',
        label: 'Chapter',
        subitems: [
          { href: 'ch.xhtml#one', label: 'One' },
          { href: 'ch.xhtml#two', label: 'Two' },
        ],
      },
    ]
    await progress.init({
      toc,
      ids: ['ch.xhtml'],
      splitHref: (href: string) => href.split('#'),
      getFragment: (doc: Document, fragment?: string) => (fragment ? doc.getElementById(fragment) : doc.body),
    })
    const doc = document.implementation.createHTMLDocument()
    doc.body.innerHTML = '<h1>Chapter</h1><h2 id="one">One</h2><p id="text">Reading here</p><h2 id="two">Two</h2><p id="end">Last text</p>'
    const range = doc.createRange()
    range.setStart(doc.getElementById('text')!.firstChild!, 0)
    range.setEnd(doc.getElementById('end')!.firstChild!, 4)
    expect(progress.getProgress(0, range).href).toBe('ch.xhtml#one')
    range.setStart(doc.getElementById('end')!.firstChild!, 0)
    expect(progress.getProgress(0, range).href).toBe('ch.xhtml#two')
    range.setStart(doc.querySelector('h1')!.firstChild!, 0)
    expect(progress.getProgress(0, range).href).toBe('ch.xhtml')
  })
})

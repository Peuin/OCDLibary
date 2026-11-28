import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { drawReaderSearchHighlight, resolveCssVariables, resolveReaderSearchHitColor } from '../reader-search-highlight'

function setThemeProperties(properties: Record<string, string>) {
  for (const [name, value] of Object.entries(properties)) document.documentElement.style.setProperty(name, value)
}

afterEach(() => {
  for (const name of ['--reader-search-hit', '--primary', '--tint-c', '--tint-h']) document.documentElement.style.removeProperty(name)
})

describe('reader search highlight tokens', () => {
  it('keeps the shared PDF and EPUB token values exact', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/assets/theme/tokens.css'), 'utf8')

    expect(css).toContain('--reader-search-hit: color-mix(in oklch, var(--primary) 22%, transparent);')
    expect(css).toContain('--reader-search-hit-active: color-mix(in oklch, var(--primary) 40%, transparent);')
    expect(css).toContain('--reader-search-hit-active-outline: color-mix(in oklch, var(--primary) 60%, transparent);')
  })

  it('resolves nested CSS variables when the DOM cannot compute color-mix', () => {
    setThemeProperties({
      '--reader-search-hit': 'color-mix(in oklch, var(--primary) 22%, transparent)',
      '--primary': 'oklch(0.5 var(--tint-c) var(--tint-h))',
      '--tint-c': '0.1',
      '--tint-h': '80',
    })

    expect(resolveReaderSearchHitColor()).toBe('color-mix(in oklch, oklch(0.5 0.1 80) 22%, transparent)')
  })

  it('invalidates the resolved color when the root theme attributes or token value change', () => {
    setThemeProperties({ '--reader-search-hit': 'rgb(1 2 3 / 0.22)' })
    expect(resolveReaderSearchHitColor()).toBe('rgb(1 2 3 / 0.22)')

    setThemeProperties({ '--reader-search-hit': 'rgb(4 5 6 / 0.4)' })
    expect(resolveReaderSearchHitColor()).toBe('rgb(4 5 6 / 0.4)')

    document.documentElement.classList.add('dark')
    expect(resolveReaderSearchHitColor()).toBe('rgb(4 5 6 / 0.4)')
    document.documentElement.classList.remove('dark')
  })

  it('resolves recursive variable references without looping forever', () => {
    const values: Record<string, string> = {
      '--token': 'color-mix(in oklch, var(--primary) 22%, transparent)',
      '--primary': 'oklch(0.5 var(--surface-chroma) 80)',
      '--surface-chroma': 'var(--chroma)',
      '--chroma': '0.1',
    }

    expect(resolveCssVariables(values['--token']!, (name) => values[name] ?? '')).toBe('color-mix(in oklch, oklch(0.5 0.1 80) 22%, transparent)')
  })

  it('draws filled rounded rectangles without adding opacity, stroke, or blending over the token alpha', () => {
    const rects = [{ left: 4, top: 8, width: 30, height: 12 }] as unknown as DOMRectList
    const node = drawReaderSearchHighlight(rects, { color: 'rgb(1 2 3 / 0.22)' })
    const rect = node.querySelector('rect')

    expect(node.getAttribute('fill')).toBe('rgb(1 2 3 / 0.22)')
    expect(node.getAttribute('stroke')).toBeNull()
    expect(node.style.opacity).toBe('')
    expect(node.style.mixBlendMode).toBe('')
    expect(rect?.getAttribute('x')).toBe('4')
    expect(rect?.getAttribute('y')).toBe('8')
    expect(rect?.getAttribute('width')).toBe('30')
    expect(rect?.getAttribute('height')).toBe('12')
    expect(rect?.getAttribute('rx')).toBe('2')
  })
})

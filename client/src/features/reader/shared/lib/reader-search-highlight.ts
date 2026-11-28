export const READER_SEARCH_HIT_TOKEN = '--reader-search-hit'

const FALLBACK_SEARCH_HIT_COLOR = 'color-mix(in oklch, currentColor 22%, transparent)'
const CSS_VARIABLE_REFERENCE = /var\(\s*(--[\w-]+)\s*\)/g
const MAX_VARIABLE_DEPTH = 6

let cachedHitColorKey: string | null = null
let cachedHitColor: string | null = null

export function resolveCssVariables(value: string, readProperty: (name: string) => string, depth = 0): string {
  if (depth >= MAX_VARIABLE_DEPTH) return value
  return value.replace(CSS_VARIABLE_REFERENCE, (match, name: string) => {
    const nested = readProperty(name).trim()
    return nested ? resolveCssVariables(nested, readProperty, depth + 1) : match
  })
}

/** Resolves the app token in the parent document because the Foliate SVG lives inside each EPUB iframe. */
export function resolveReaderSearchHitColor(): string {
  const rootStyle = window.getComputedStyle(document.documentElement)
  const tokenValue = rootStyle.getPropertyValue(READER_SEARCH_HIT_TOKEN).trim()
  const cacheKey = [tokenValue, document.documentElement.className, document.documentElement.getAttribute('style') ?? ''].join('\n')
  if (cachedHitColorKey === cacheKey && cachedHitColor) return cachedHitColor
  if (!tokenValue) return FALLBACK_SEARCH_HIT_COLOR

  let resolved: string | null = null
  const probe = document.createElement('span')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  probe.style.color = `var(${READER_SEARCH_HIT_TOKEN})`
  document.body.appendChild(probe)
  try {
    const computed = window.getComputedStyle(probe).color.trim()
    if (computed && !computed.includes('var(')) resolved = computed
  } finally {
    probe.remove()
  }

  resolved ??= resolveCssVariables(tokenValue, (name) => rootStyle.getPropertyValue(name))
  cachedHitColorKey = cacheKey
  cachedHitColor = resolved
  return resolved
}

/** SVG equivalent of the PDF search hit: the token already carries alpha, so no extra opacity or blend is applied. */
export function drawReaderSearchHighlight(rects: DOMRectList, { color = resolveReaderSearchHitColor() }: { color?: string } = {}): SVGElement {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.setAttribute('fill', color)
  for (const { left, top, height, width } of Array.from(rects)) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    el.setAttribute('x', String(left))
    el.setAttribute('y', String(top))
    el.setAttribute('height', String(height))
    el.setAttribute('width', String(width))
    el.setAttribute('rx', '2')
    g.append(el)
  }
  return g
}

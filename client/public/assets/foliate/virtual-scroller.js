// Pure helpers for the windowed, cross-section scrolled mode of `foliate-paginator`.
// They decide which spine sections stay mounted around the reading position; the
// paginator owns the DOM, iframes and scroll offsets.

export const DEFAULT_WINDOW_RADIUS = 1
export const MAX_MOUNTED_SECTIONS = 5
// A mounted section shorter than this fraction of the viewport lets the window grow
// past `radius` (up to MAX_MOUNTED_SECTIONS) so short chapters never leave a gap.
export const SHORT_SECTION_RATIO = 0.5

const inRange = (sections, index) => Number.isInteger(index) && index >= 0 && index < sections.length

export const adjacentLinearIndex = (sections, index, dir) => {
  for (let i = index + dir; inRange(sections, i); i += dir) if (sections[i]?.linear !== 'no') return i
  return undefined
}

/**
 * Spine indexes to keep mounted, ascending. The active section is always included,
 * even when it is non-linear, because the reader navigated to it explicitly.
 */
export const computeSectionWindow = ({
  sections,
  activeIndex,
  radius = DEFAULT_WINDOW_RADIUS,
  maxSections = MAX_MOUNTED_SECTIONS,
  heights,
  viewportSize = 0,
  shortRatio = SHORT_SECTION_RATIO,
}) => {
  if (!sections?.length || !inRange(sections, activeIndex)) return []
  const max = Math.max(1, Math.floor(maxSections))
  const result = [activeIndex]
  let first = activeIndex
  let last = activeIndex
  const extend = (dir) => {
    if (result.length >= max) return false
    const next = adjacentLinearIndex(sections, dir < 0 ? first : last, dir)
    if (next == null) return false
    if (dir < 0) {
      result.unshift(next)
      first = next
    } else {
      result.push(next)
      last = next
    }
    return true
  }
  for (let step = 0; step < Math.max(0, radius); step++) {
    extend(1)
    extend(-1)
  }
  const isShort = (index) => {
    const height = heights?.get?.(index)
    return viewportSize > 0 && typeof height === 'number' && height < viewportSize * shortRatio
  }
  let grew = true
  while (grew && result.length < max) {
    grew = false
    if (isShort(last) && extend(1)) grew = true
    if (isShort(first) && extend(-1)) grew = true
  }
  return result
}

/**
 * Mount order for a window: sections after the active one first (appending below the
 * reader never moves the text), then the ones before it, nearest first.
 */
export const orderMounts = (target, activeIndex) => [
  ...target.filter((i) => i > activeIndex).sort((a, b) => a - b),
  ...target.filter((i) => i < activeIndex).sort((a, b) => b - a),
]

export const diffSectionWindow = (mounted, target) => {
  const targetSet = new Set(target)
  const mountedSet = new Set(mounted)
  return {
    toUnmount: [...mountedSet].filter((i) => !targetSet.has(i)).sort((a, b) => a - b),
    toMount: target.filter((i) => !mountedSet.has(i)),
  }
}

/**
 * `getContents()` order: the active section first so existing callers that read
 * `getContents()[0]` (TTS, media overlay) keep targeting the section being read,
 * then the other mounted sections in spine order.
 */
export const orderContents = (contents, activeIndex) => {
  const active = contents.filter((c) => c.index === activeIndex)
  const rest = contents.filter((c) => c.index !== activeIndex).sort((a, b) => a.index - b.index)
  return [...active, ...rest]
}

/**
 * Section whose box contains the reading point (top edge of the viewport plus a
 * small margin). `boxes` are `{ index, top, bottom }` in scroll-content coordinates.
 */
export const findActiveSection = (boxes, readingPoint) => {
  const sorted = [...boxes].sort((a, b) => a.top - b.top)
  for (const box of sorted) if (box.bottom > readingPoint) return box.index
  return sorted[sorted.length - 1]?.index
}

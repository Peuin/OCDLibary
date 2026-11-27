import { ref } from 'vue'

export interface TocItem {
  label: string
  href: string
  subitems?: TocItem[]
}

interface RawTocItem {
  label?: string
  title?: string
  href?: string
  subitems?: RawTocItem[]
}

function mapTocItems(items: RawTocItem[]): TocItem[] {
  return items.map((item) => ({
    label: item.label ?? item.title ?? '',
    href: item.href ?? '',
    subitems: item.subitems?.length ? mapTocItems(item.subitems) : undefined,
  }))
}

export function useToc() {
  const chapters = ref<TocItem[]>([])
  const expandedHrefs = ref<Set<string>>(new Set())
  const activeHref = ref<string>('')

  function setChapters(toc: unknown[]) {
    chapters.value = mapTocItems((toc ?? []) as RawTocItem[])
    if (activeHref.value) setActiveHref(activeHref.value)
  }

  function setActiveHref(href: string) {
    activeHref.value = href
    const expandAncestors = (items: TocItem[], ancestors: string[]): boolean => {
      for (const item of items) {
        if (item.href === href) {
          expandedHrefs.value = new Set([...expandedHrefs.value, ...ancestors])
          return true
        }
        if (item.subitems && expandAncestors(item.subitems, [...ancestors, item.href])) return true
      }
      return false
    }
    expandAncestors(chapters.value, [])
  }

  function toggleExpand(href: string) {
    const set = new Set(expandedHrefs.value)
    if (set.has(href)) {
      set.delete(href)
    } else {
      set.add(href)
    }
    expandedHrefs.value = set
  }

  function isExpanded(href: string): boolean {
    return expandedHrefs.value.has(href)
  }

  function isActive(href: string): boolean {
    return !!href && activeHref.value === href
  }

  return {
    chapters,
    expandedHrefs,
    activeHref,
    setChapters,
    setActiveHref,
    toggleExpand,
    isExpanded,
    isActive,
  }
}

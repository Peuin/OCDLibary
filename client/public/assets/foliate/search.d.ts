export interface SearchRange {
  startIndex: number
  startOffset: number
  endIndex: number
  endOffset: number
}

export interface SearchExcerpt {
  pre: string
  match: string
  post: string
}

export interface SearchResult {
  range: SearchRange | Range
  excerpt: SearchExcerpt
}

export interface SearchOptions {
  locales?: string
  granularity?: 'grapheme' | 'word' | 'sentence'
  sensitivity?: 'base' | 'accent' | 'case' | 'variant'
}

export declare function search(strs: string[], query: string, options?: SearchOptions): Generator<SearchResult>

export declare function searchMatcher(
  textWalker: unknown,
  opts: Record<string, unknown>,
): (doc: Document, query: string) => Generator<SearchResult>

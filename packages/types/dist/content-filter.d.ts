export interface ContentFilterRules {
    includeTagIds: number[];
    excludeTagIds: number[];
    includeGenreIds: number[];
    excludeGenreIds: number[];
    /**
     * When set, a book that fulfilled a request this user made or joined is exempt from every rule
     * above.
     * Carried on the rules rather than passed alongside them so the ~30 call sites that already
     * thread a `ContentFilterRules` through need no change; absent means today's behaviour.
     */
    exemptRequestsFromUserId?: number;
}
export interface ContentFilterNamedItem {
    id: number;
    name: string;
}
export interface ContentFilterRulesWithNames {
    includeTags: ContentFilterNamedItem[];
    excludeTags: ContentFilterNamedItem[];
    includeGenres: ContentFilterNamedItem[];
    excludeGenres: ContentFilterNamedItem[];
    seeOwnRequestedBooks: boolean;
}
export declare const EMPTY_CONTENT_FILTER_RULES: ContentFilterRules;
export declare function isContentFilterEmpty(filters: ContentFilterRules): boolean;
//# sourceMappingURL=content-filter.d.ts.map
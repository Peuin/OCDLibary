export declare const SIDEBAR_SECTION_IDS: readonly ["browse", "libraries", "podcasts", "smartScopes", "collections", "podcastScopes", "podcastCollections"];
export type SidebarSectionId = (typeof SIDEBAR_SECTION_IDS)[number];
/** Sections backed by a variable-length entity list, so only these carry a rows-shown cap. */
export declare const SIDEBAR_CAPPED_SECTION_IDS: readonly ["libraries", "podcasts", "smartScopes", "collections", "podcastScopes", "podcastCollections"];
export type SidebarCappedSectionId = (typeof SIDEBAR_CAPPED_SECTION_IDS)[number];
/** How many rows a sidebar entity section renders before the See-all link takes over. */
export declare const SIDEBAR_CAP_OPTIONS: readonly [5, 8, 12, 20, "all"];
export type SidebarCap = (typeof SIDEBAR_CAP_OPTIONS)[number];
export declare const SIDEBAR_DEFAULT_CAP: Extract<SidebarCap, number>;
export interface SidebarSectionState {
    open: boolean;
    cap?: SidebarCap;
}
export interface SidebarConfig {
    sections: Record<SidebarSectionId, SidebarSectionState>;
}
/** Totals behind the sidebar Browse badges, served as one cached payload so the shell needs a single request. */
export interface BrowseCounts {
    authors: number;
    series: number;
    annotations: number;
}
//# sourceMappingURL=sidebar.d.ts.map
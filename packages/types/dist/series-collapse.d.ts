export type SeriesCollapsePreferences = {
    global: boolean;
    libraries: Record<string, boolean>;
    collections: Record<string, boolean>;
    smartScopes?: Record<string, boolean>;
    /**
     * Author pages share one flag instead of a per-author bucket: the bucket would grow with every
     * author browsed, and "collapsed for King but not for Pratchett" is not a distinction anyone
     * asks for. Absent means off, so an upgrade leaves author pages flat even for a user whose
     * {@link SeriesCollapsePreferences.global} is on.
     */
    authorPages?: boolean;
};
export type CollapsedSeriesInfo = {
    bookCount: number;
    readCount: number;
    coverBookIds: number[];
    coverUpdatedAtByBookId?: Record<number, string | null>;
    seriesLatestAddedAt: string | null;
    firstVolumeBookId?: number | null;
    latestVolumeBookId?: number | null;
    firstUnreadBookId?: number | null;
};
export declare function resolveCollapsePreference(prefs: SeriesCollapsePreferences | undefined, ctx: {
    libraryId?: number;
    collectionId?: number;
    smartScopeId?: number;
    authorPages?: boolean;
}): boolean;
//# sourceMappingURL=series-collapse.d.ts.map
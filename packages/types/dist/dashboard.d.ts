import type { BookCard } from "./book";
export declare const SCROLLER_TYPE: {
    readonly RECENTLY_ADDED: "recently-added";
    readonly CONTINUE_READING: "continue-reading";
    readonly CONTINUE_LISTENING: "continue-listening";
    readonly CONTINUE_PODCASTS: "continue-podcasts";
    readonly WANT_TO_READ: "want-to-read";
    readonly UP_NEXT_IN_SERIES: "up-next-in-series";
    readonly RANDOM: "random";
    readonly SMART_SCOPE: "smart-scope";
};
export type ScrollerType = (typeof SCROLLER_TYPE)[keyof typeof SCROLLER_TYPE];
export declare const SCROLLER_TYPES: ReadonlyArray<ScrollerType>;
/**
 * Shelves whose rows are books, which is every shelf `GET /dashboard/scrollers/:type` can serve.
 * Podcast shelves resolve through the podcast module's own cross-library endpoint instead, so the
 * dashboard route rejects them rather than reaching into podcast tables.
 */
export declare const BOOK_SCROLLER_TYPE: {
    readonly RECENTLY_ADDED: "recently-added";
    readonly CONTINUE_READING: "continue-reading";
    readonly CONTINUE_LISTENING: "continue-listening";
    readonly WANT_TO_READ: "want-to-read";
    readonly UP_NEXT_IN_SERIES: "up-next-in-series";
    readonly RANDOM: "random";
    readonly SMART_SCOPE: "smart-scope";
};
export type BookScrollerType = (typeof BOOK_SCROLLER_TYPE)[keyof typeof BOOK_SCROLLER_TYPE];
export declare const BOOK_SCROLLER_TYPES: ReadonlyArray<BookScrollerType>;
export declare const PODCAST_SCROLLER_TYPES: readonly ["continue-podcasts"];
export type PodcastScrollerType = (typeof PODCAST_SCROLLER_TYPES)[number];
export declare function isPodcastScrollerType(type: ScrollerType): type is PodcastScrollerType;
export declare const DASHBOARD_SCROLLER_BATCH_MAX = 8;
export declare const DASHBOARD_SCROLLER_MAX_LIMIT = 50;
/**
 * The single-shelf response for `GET /dashboard/scrollers/:type`.
 *
 * `total` is the size of the set the shelf speaks for, not how many books came back, so a shelf
 * capped at its limit can say what it is a window onto. What that set is belongs to the shelf:
 * the continue rows count what is in progress, `want-to-read` counts the list, and
 * `recently-added` counts this calendar month rather than the whole library, because how many
 * books you own is a different question and the library widget already answers it. Clients label
 * the figure per shelf for that reason.
 *
 * It is deliberately nullable: two shelves cannot answer it for a price worth paying, and no
 * number is better than a wrong one.
 * `up-next-in-series` would have to materialise its recursive CTE in full, and `random` would
 * anti-join the whole library to count a pool it only ever samples. Both send null, and a client
 * shows nothing rather than falling back to `books.length`, which is only the limit it asked for.
 *
 * The batch route deliberately does not carry this. Only the single-shelf route is asked for a
 * total today, and putting one on the batch would charge every shelf on the web dashboard for a
 * count query nothing there renders.
 */
export interface DashboardScrollerResponse {
    books: BookCard[];
    total: number | null;
}
export interface DashboardScrollerBatchItem {
    id: string;
    type: BookScrollerType;
    limit: number;
    smartScopeId?: number;
}
export interface DashboardScrollerBatchRequest {
    items: DashboardScrollerBatchItem[];
}
export interface DashboardScrollerBatchResult {
    id: string;
    books: BookCard[];
    failed: boolean;
}
export interface DashboardScrollerBatchResponse {
    items: DashboardScrollerBatchResult[];
}
export interface ScrollerConfig {
    id: string;
    type: ScrollerType;
    label: string;
    enabled: boolean;
    order: number;
    limit: number;
    rows: number;
    smartScopeId?: number;
}
export declare const WIDGET_TYPE: {
    readonly READING_STREAK: "reading-streak";
    readonly CURRENTLY_READING: "currently-reading";
    readonly READING_GOAL: "reading-goal";
    readonly READING_DNA: "reading-dna";
    readonly MONTHLY_CHALLENGE: "monthly-challenge";
    readonly HIGHLIGHT_OF_THE_DAY: "highlight-of-the-day";
    readonly NEGLECTED_GEMS: "neglected-gems";
    readonly READING_RHYTHM: "reading-rhythm";
    readonly DIVERSITY_SCORE: "diversity-score";
    readonly LIBRARY_OVERVIEW: "library-overview";
    readonly YEAR_PROJECTION: "year-projection";
    readonly LONG_WAIT: "long-wait";
};
export type WidgetType = (typeof WIDGET_TYPE)[keyof typeof WIDGET_TYPE];
export declare const WIDGET_TYPES: ReadonlyArray<WidgetType>;
export interface WidgetConfig {
    id: string;
    type: WidgetType;
    enabled: boolean;
    order: number;
}
export interface DashboardConfig {
    readingGoal?: number;
    widgets?: WidgetConfig[];
    /** Limits dashboard shelves and book-derived widgets to these accessible libraries. Omitted means all accessible libraries. */
    libraryIds?: number[];
}
export interface ReadingGoalWidgetData {
    goalBooks: number | null;
    completedBooks: number;
    year: number;
}
export interface CurrentlyReadingBook {
    bookId: number;
    title: string | null;
    authors: string[];
    progress: number;
    hasCover: boolean;
    /** The book's primary file, whatever its format. */
    fileId: number | null;
    fileFormat: string | null;
    /**
     * The three ways a book can be resumed, resolved per book so a client can offer them without a
     * detail request each. The iOS home hero is the caller: one book, three possible modes, and the
     * primary file alone cannot say which exist. An audiobook-primary book still reports its best
     * readable file here, which is why this is not simply `fileId` again.
     */
    readFileId: number | null;
    readFileFormat: string | null;
    /** The EPUB carrying media overlays, when the book has one. Null means no read-along. */
    readAlongFileId: number | null;
    hasAudio: boolean;
}
export interface CurrentlyReadingWidgetData {
    books: CurrentlyReadingBook[];
}
export interface ReadingStreakWidgetData {
    currentStreak: number;
    longestStreak: number;
    lastSevenDays: boolean[];
}
export interface LibraryOverviewWidgetData {
    totalBooks: number;
    totalAuthors: number;
    totalSeries: number;
    totalStorageBytes: number;
    booksAddedThisYear: number;
}
export interface HighlightOfTheDayWidgetData {
    text: string;
    note: string | null;
    bookTitle: string | null;
    bookId: number;
    hasCover: boolean;
    chapterTitle: string | null;
    createdAt: string;
}
export type ChallengeType = "short-read" | "genre-explorer" | "finish-oldest" | "streak-builder" | "new-author" | "page-milestone";
export interface MonthlyChallengeWidgetData {
    challengeType: ChallengeType;
    title: string;
    description: string;
    progress: number;
    target: number;
    completed: boolean;
    month: number;
    year: number;
}
export interface YearProjectionWidgetData {
    projectedBooks: number;
    projectedPages: number;
    projectedHours: number;
    booksCompletedYtd: number;
    daysRemaining: number;
    trend: "up" | "down" | "stable";
}
export interface NeglectedGem {
    bookId: number;
    title: string | null;
    hasCover: boolean;
    rating: number;
    waitingDays: number;
    genre: string | null;
}
export interface NeglectedGemsWidgetData {
    gems: NeglectedGem[];
}
export interface ReadingDnaWidgetData {
    archetype: string;
    lengthScore: number;
    varietyScore: number;
    rhythmScore: number;
    timeScore: number;
    speedScore: number;
    lengthLabel: string;
    varietyLabel: string;
    rhythmLabel: string;
    timeLabel: string;
    speedLabel: string;
    booksAnalyzed: number;
}
export interface LongWaitWidgetData {
    bookId: number;
    title: string | null;
    hasCover: boolean;
    addedAt: string;
    waitingDays: number;
    pageCount: number | null;
    genre: string | null;
    fileId: number | null;
    fileFormat: string | null;
}
export interface DiversityScoreWidgetData {
    score: number;
    label: string;
    genreScore: number;
    authorScore: number;
    eraScore: number;
    languageScore: number;
    booksAnalyzed: number;
}
export interface ReadingRhythmDay {
    date: string;
    readingSeconds: number;
}
export interface ReadingRhythmWidgetData {
    days: ReadingRhythmDay[];
    consistencyPercent: number;
    avgSecondsPerDay: number;
    activeDays: number;
    totalDays: number;
}
/** Maps each widget to the payload its endpoint returns, so the batch stays type-safe per widget. */
export interface WidgetDataByType {
    "reading-streak": ReadingStreakWidgetData;
    "currently-reading": CurrentlyReadingWidgetData;
    "reading-goal": ReadingGoalWidgetData;
    "reading-dna": ReadingDnaWidgetData;
    "monthly-challenge": MonthlyChallengeWidgetData;
    "highlight-of-the-day": HighlightOfTheDayWidgetData | null;
    "neglected-gems": NeglectedGemsWidgetData;
    "reading-rhythm": ReadingRhythmWidgetData;
    "diversity-score": DiversityScoreWidgetData;
    "library-overview": LibraryOverviewWidgetData;
    "year-projection": YearProjectionWidgetData;
    "long-wait": LongWaitWidgetData | null;
}
export declare const DASHBOARD_WIDGET_BATCH_MAX: number;
export interface DashboardWidgetBatchRequest {
    widgets: WidgetType[];
}
export interface DashboardWidgetBatchResult<T extends WidgetType = WidgetType> {
    type: T;
    data: WidgetDataByType[T] | null;
    failed: boolean;
}
export interface DashboardWidgetBatchResponse {
    items: DashboardWidgetBatchResult[];
}
//# sourceMappingURL=dashboard.d.ts.map
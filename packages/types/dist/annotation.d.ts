export type AnnotationPositionStatus = "exact" | "repaired" | "failed" | "pending";
export declare const KOBO_HIGHLIGHT_COLORS: readonly [{
    readonly name: "yellow";
    readonly label: "Yellow";
    readonly hex: "#F6F3B3";
}, {
    readonly name: "green";
    readonly label: "Green";
    readonly hex: "#C6E09E";
}, {
    readonly name: "blue";
    readonly label: "Blue";
    readonly hex: "#B2E1E8";
}, {
    readonly name: "pink";
    readonly label: "Pink";
    readonly hex: "#E8AFCF";
}];
export type KoboHighlightColorName = (typeof KOBO_HIGHLIGHT_COLORS)[number]["name"];
export declare const KOREADER_HIGHLIGHT_COLORS: readonly [{
    readonly name: "red";
    readonly label: "Red";
    readonly hex: "#FF3300";
    readonly appHex: "#F87171";
    readonly koboFallback: "pink";
}, {
    readonly name: "orange";
    readonly label: "Orange";
    readonly hex: "#FF8800";
    readonly appHex: "#FB923C";
    readonly koboFallback: "yellow";
}, {
    readonly name: "yellow";
    readonly label: "Yellow";
    readonly hex: "#FFFF33";
    readonly appHex: "#FACC15";
    readonly koboFallback: "yellow";
}, {
    readonly name: "green";
    readonly label: "Green";
    readonly hex: "#00AA66";
    readonly appHex: "#4ADE80";
    readonly koboFallback: "green";
}, {
    readonly name: "olive";
    readonly label: "Olive";
    readonly hex: "#88FF77";
    readonly appHex: "#84CC16";
    readonly koboFallback: "green";
}, {
    readonly name: "cyan";
    readonly label: "Cyan";
    readonly hex: "#00FFEE";
    readonly appHex: "#22D3EE";
    readonly koboFallback: "blue";
}, {
    readonly name: "blue";
    readonly label: "Blue";
    readonly hex: "#0066FF";
    readonly appHex: "#38BDF8";
    readonly koboFallback: "blue";
}, {
    readonly name: "purple";
    readonly label: "Purple";
    readonly hex: "#EE00FF";
    readonly appHex: "#C084FC";
    readonly koboFallback: "pink";
}, {
    readonly name: "gray";
    readonly label: "Gray";
    readonly hex: "#808080";
    readonly appHex: "#9CA3AF";
    readonly koboFallback: "yellow";
}];
export type KoreaderHighlightColorName = (typeof KOREADER_HIGHLIGHT_COLORS)[number]["name"];
export declare const ANNOTATION_HIGHLIGHT_COLORS: readonly [{
    readonly name: "yellow";
    readonly label: "Yellow";
    readonly hex: "#FACC15";
    readonly koreaderFallback: "yellow";
    readonly koboFallback: "yellow";
}, {
    readonly name: "green";
    readonly label: "Green";
    readonly hex: "#4ADE80";
    readonly koreaderFallback: "green";
    readonly koboFallback: "green";
}, {
    readonly name: "blue";
    readonly label: "Blue";
    readonly hex: "#38BDF8";
    readonly koreaderFallback: "blue";
    readonly koboFallback: "blue";
}, {
    readonly name: "pink";
    readonly label: "Pink";
    readonly hex: "#F472B6";
    readonly koreaderFallback: "purple";
    readonly koboFallback: "pink";
}, {
    readonly name: "orange";
    readonly label: "Orange";
    readonly hex: "#FB923C";
    readonly koreaderFallback: "orange";
    readonly koboFallback: "yellow";
}, {
    readonly name: "red";
    readonly label: "Red";
    readonly hex: "#F87171";
    readonly koreaderFallback: "red";
    readonly koboFallback: "pink";
}, {
    readonly name: "olive";
    readonly label: "Olive";
    readonly hex: "#84CC16";
    readonly koreaderFallback: "olive";
    readonly koboFallback: "green";
}, {
    readonly name: "cyan";
    readonly label: "Cyan";
    readonly hex: "#22D3EE";
    readonly koreaderFallback: "cyan";
    readonly koboFallback: "blue";
}, {
    readonly name: "purple";
    readonly label: "Purple";
    readonly hex: "#C084FC";
    readonly koreaderFallback: "purple";
    readonly koboFallback: "pink";
}, {
    readonly name: "gray";
    readonly label: "Gray";
    readonly hex: "#9CA3AF";
    readonly koreaderFallback: "gray";
    readonly koboFallback: "yellow";
}];
export type AnnotationHighlightColorName = (typeof ANNOTATION_HIGHLIGHT_COLORS)[number]["name"];
export declare const KOREADER_EXACT_HIGHLIGHT_COLORS: readonly [{
    readonly hex: "#FF3300";
    readonly label: "KOReader Red";
}, {
    readonly hex: "#FF8800";
    readonly label: "KOReader Orange";
}, {
    readonly hex: "#FFFF33";
    readonly label: "KOReader Yellow";
}, {
    readonly hex: "#00AA66";
    readonly label: "KOReader Green";
}, {
    readonly hex: "#88FF77";
    readonly label: "KOReader Olive";
}, {
    readonly hex: "#00FFEE";
    readonly label: "KOReader Cyan";
}, {
    readonly hex: "#0066FF";
    readonly label: "KOReader Blue";
}, {
    readonly hex: "#EE00FF";
    readonly label: "KOReader Purple";
}, {
    readonly hex: "#808080";
    readonly label: "KOReader Gray";
}];
export declare const ANNOTATION_COLOR_FILTER_OPTIONS: readonly [{
    readonly name: "yellow";
    readonly label: "Yellow";
    readonly hex: "#FACC15";
    readonly koreaderFallback: "yellow";
    readonly koboFallback: "yellow";
}, {
    readonly name: "green";
    readonly label: "Green";
    readonly hex: "#4ADE80";
    readonly koreaderFallback: "green";
    readonly koboFallback: "green";
}, {
    readonly name: "blue";
    readonly label: "Blue";
    readonly hex: "#38BDF8";
    readonly koreaderFallback: "blue";
    readonly koboFallback: "blue";
}, {
    readonly name: "pink";
    readonly label: "Pink";
    readonly hex: "#F472B6";
    readonly koreaderFallback: "purple";
    readonly koboFallback: "pink";
}, {
    readonly name: "orange";
    readonly label: "Orange";
    readonly hex: "#FB923C";
    readonly koreaderFallback: "orange";
    readonly koboFallback: "yellow";
}, {
    readonly name: "red";
    readonly label: "Red";
    readonly hex: "#F87171";
    readonly koreaderFallback: "red";
    readonly koboFallback: "pink";
}, {
    readonly name: "olive";
    readonly label: "Olive";
    readonly hex: "#84CC16";
    readonly koreaderFallback: "olive";
    readonly koboFallback: "green";
}, {
    readonly name: "cyan";
    readonly label: "Cyan";
    readonly hex: "#22D3EE";
    readonly koreaderFallback: "cyan";
    readonly koboFallback: "blue";
}, {
    readonly name: "purple";
    readonly label: "Purple";
    readonly hex: "#C084FC";
    readonly koreaderFallback: "purple";
    readonly koboFallback: "pink";
}, {
    readonly name: "gray";
    readonly label: "Gray";
    readonly hex: "#9CA3AF";
    readonly koreaderFallback: "gray";
    readonly koboFallback: "yellow";
}, {
    readonly hex: "#FF3300";
    readonly label: "KOReader Red";
}, {
    readonly hex: "#FF8800";
    readonly label: "KOReader Orange";
}, {
    readonly hex: "#FFFF33";
    readonly label: "KOReader Yellow";
}, {
    readonly hex: "#00AA66";
    readonly label: "KOReader Green";
}, {
    readonly hex: "#88FF77";
    readonly label: "KOReader Olive";
}, {
    readonly hex: "#00FFEE";
    readonly label: "KOReader Cyan";
}, {
    readonly hex: "#0066FF";
    readonly label: "KOReader Blue";
}, {
    readonly hex: "#EE00FF";
    readonly label: "KOReader Purple";
}, {
    readonly hex: "#808080";
    readonly label: "KOReader Gray";
}];
export interface AnnotationRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * A PDF highlight's geometry, in unscaled PDF page coordinate space (points,
 * top-left origin). `page` is the zero-based page index. `rect` is the bounding
 * box and `rects` are the per-line segment quads used to render the markup.
 */
export interface AnnotationPdfPosition {
    page: number;
    rect: AnnotationRect;
    rects: AnnotationRect[];
}
export interface AnnotationItem {
    id: number;
    bookId: number;
    cfi: string | null;
    jumpFileId: number | null;
    pageno: number | null;
    text: string;
    color: string;
    style: string;
    note: string | null;
    chapterTitle: string | null;
    origin: "web" | "koreader" | "kobo";
    positionStatus: AnnotationPositionStatus | null;
    chapterIndex: number | null;
    highlightedAt: string;
    createdAt: string;
    updatedAt?: string | null;
    /** Present for PDF highlights; null/absent for EPUB and device-synced formats. */
    pdf?: AnnotationPdfPosition | null;
}
/**
 * One chapter's worth of highlights, aggregated server-side. The book detail
 * Highlights tab draws its chapter index and its position band from this, so it
 * never has to hold every annotation row in memory to describe the whole book.
 */
export interface AnnotationChapterStat {
    /** null for highlights that carry no chapter title. */
    title: string | null;
    count: number;
    /** Composition of the chapter, ordered by count descending. */
    colors: {
        color: string;
        count: number;
    }[];
    /** Spine index when a position carries one, otherwise null. */
    chapterIndex: number | null;
    /** Sort key through the book. Null when no position could be resolved. */
    order: number | null;
    /** Oldest highlight in the chapter, the tiebreak when `order` is null. */
    firstCreatedAt: string;
}
export interface AnnotationStats {
    totalHighlights: number;
    colorBreakdown: {
        color: string;
        count: number;
    }[];
    originBreakdown: {
        origin: AnnotationItem["origin"];
        count: number;
    }[];
    chaptersWithHighlights: number;
    highlightsWithNotes: number;
    /**
     * Highlights whose canonical position is not `exact`. Counted with the review filter
     * itself removed, so the chip that toggles it keeps showing the real total while on.
     */
    highlightsNeedingReview: number;
    chapters: string[];
    chapterBreakdown: AnnotationChapterStat[];
    /** Distinct days that carry at least one highlight, newest first. */
    activity: {
        day: string;
        count: number;
        origins: {
            origin: AnnotationItem["origin"];
            count: number;
        }[];
    }[];
}
export interface AnnotationListResponse {
    items: AnnotationItem[];
    total: number;
    page: number;
    pageSize: number;
    stats: AnnotationStats;
}
export interface AnnotationHubItem extends AnnotationItem {
    bookTitle: string | null;
    author: string | null;
    deletedAt: string | null;
    jumpFileFormat: string | null;
}
export interface AnnotationHubStats {
    books: number;
    withNotes: number;
    originBreakdown: {
        origin: AnnotationItem["origin"];
        count: number;
    }[];
}
/**
 * How the hub stream is grouped. The mode drives the server sort as well as the
 * rules drawn between rows, because grouping a page of an infinite list only
 * lands on whole groups when the server already ordered by the same key.
 */
export declare const ANNOTATION_HUB_GROUP_MODES: readonly ["month", "book", "color", "source"];
export type AnnotationHubGroupMode = (typeof ANNOTATION_HUB_GROUP_MODES)[number];
/** One device that has ever exchanged annotations, summarised across the whole library. */
export interface AnnotationHubDeviceSummary {
    source: "koreader" | "kobo";
    deviceId: string;
    deviceName: string | null;
    /** Annotations this device has a sync row for. */
    annotations: number;
    /** How many of those are behind the canonical version. */
    behind: number;
    lastSyncedAt: string;
}
/** One week of marking activity, for the hub's twelve-month sparkline. */
export interface AnnotationHubActivityWeek {
    /** Monday of the week, as `yyyy-mm-dd` in UTC. */
    weekStart: string;
    count: number;
    origins: {
        origin: AnnotationItem["origin"];
        count: number;
    }[];
}
/**
 * The library-wide facets behind the hub's side rail. Split out from the paginated
 * list because the list is an infinite stream: recomputing six aggregates over every
 * annotation a user owns on each page of scrolling is the one thing this page cannot
 * afford. It reloads when the filters change, not when more rows arrive.
 */
export interface AnnotationHubOverview {
    total: number;
    books: number;
    withNotes: number;
    /** Highlights whose canonical position is not `exact`, so they cannot open at the right page. */
    needsReview: number;
    /** Always the whole trash, independent of the current status filter. */
    trashed: number;
    originBreakdown: {
        origin: AnnotationItem["origin"];
        count: number;
    }[];
    colorBreakdown: {
        color: string;
        count: number;
    }[];
    /** Books ranked by mark count, not by recency the way the filter combobox is. */
    shelf: AnnotationHubBookFacet[];
    weeks: AnnotationHubActivityWeek[];
    busiestWeek: AnnotationHubActivityWeek | null;
    /**
     * Longest run of consecutive empty weeks inside the covered window. Counted in weeks
     * rather than days because the activity is bucketed weekly: reporting days here would
     * claim a precision the aggregate does not have.
     */
    longestQuietWeeks: number;
    devices: AnnotationHubDeviceSummary[];
}
export interface AnnotationHubResponse {
    items: AnnotationHubItem[];
    total: number;
    page: number;
    pageSize: number;
    stats: AnnotationHubStats;
}
export interface AnnotationHubBookFacet {
    bookId: number;
    bookTitle: string | null;
    author: string | null;
    count: number;
}
export type AnnotationPositionFormat = "cfi" | "xpointer" | "pdf" | "kobo_span";
export interface AnnotationPositionInfo {
    format: AnnotationPositionFormat;
    status: AnnotationPositionStatus;
    reason: string | null;
    converterVersion: number | null;
    updatedAt: string;
}
export interface AnnotationDeviceSyncInfo {
    source: "koreader" | "kobo";
    deviceId: string;
    deviceName: string | null;
    lastAppliedVersion: number;
    upToDate: boolean;
    deleteAckedAt: string | null;
    lastSyncedAt: string;
}
export interface AnnotationSyncDetail {
    annotationId: number;
    origin: AnnotationItem["origin"];
    version: number;
    positions: AnnotationPositionInfo[];
    devices: AnnotationDeviceSyncInfo[];
}
//# sourceMappingURL=annotation.d.ts.map
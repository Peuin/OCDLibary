import type { UserBookStatus } from "./book";
export declare const BOOK_DUPLICATE_MATCH_REASONS: readonly ["file_hash", "isbn", "exact_metadata", "fuzzy_metadata"];
export type BookDuplicateMatchReason = (typeof BOOK_DUPLICATE_MATCH_REASONS)[number];
export declare const BOOK_DUPLICATE_SCAN_STATUSES: readonly ["queued", "running", "completed", "failed"];
export type BookDuplicateScanStatus = (typeof BOOK_DUPLICATE_SCAN_STATUSES)[number];
export declare const BOOK_DUPLICATE_GROUP_SORTS: readonly ["reclaimable", "copies", "confidence", "title"];
export type BookDuplicateGroupSort = (typeof BOOK_DUPLICATE_GROUP_SORTS)[number];
export declare const BOOK_DUPLICATE_SORT_ORDERS: readonly ["asc", "desc"];
export type BookDuplicateSortOrder = (typeof BOOK_DUPLICATE_SORT_ORDERS)[number];
export type CreateBookDuplicateScanRequest = {
    libraryId?: number;
    similarityPercent: number;
};
export type BookDuplicateScan = {
    id: number;
    status: BookDuplicateScanStatus;
    libraryIds: number[];
    requestedLibraryId: number | null;
    similarityPercent: number;
    processedBooks: number;
    totalBooks: number | null;
    progressPercent: number | null;
    totalGroups: number | null;
    /** Copies beyond the first in every group, set when the scan completes. */
    totalExtraCopies: number | null;
    /**
     * Bytes freed by keeping the largest copy in every group, set when the scan completes. A floor:
     * keeping a smaller copy frees more.
     */
    totalReclaimableBytes: number | null;
    errorCode: string | null;
    createdAt: string;
    completedAt: string | null;
};
export type BookDuplicateFile = {
    id: number;
    format: string | null;
    sizeBytes: number | null;
    path: string | null;
};
export type BookDuplicateCandidate = {
    id: number;
    title: string | null;
    subtitle: string | null;
    authors: string[];
    libraryId: number;
    libraryName: string;
    folderPath: string;
    status: string;
    files: BookDuplicateFile[];
    isbn10: string | null;
    isbn13: string | null;
    metadataScore: number | null;
    readStatus: UserBookStatus | null;
    readingProgress: number | null;
    collections: {
        id: number;
        name: string;
    }[];
    addedAt: string;
    updatedAt: string | null;
    hasCover: boolean;
};
export type BookDuplicatePair = {
    bookIdA: number;
    bookIdB: number;
    reasons: BookDuplicateMatchReason[];
    titleSimilarity: number | null;
};
export type BookDuplicateGroup = {
    id: number;
    reasons: BookDuplicateMatchReason[];
    maxTitleSimilarity: number | null;
    /** Bytes freed by keeping the largest copy in this group. */
    reclaimableBytes: number;
    books: BookDuplicateCandidate[];
    pairs: BookDuplicatePair[];
};
export type BookDuplicateDismissal = {
    bookIdA: number;
    bookIdB: number;
    titleA: string | null;
    titleB: string | null;
    createdAt: string;
};
export type CreateBookDuplicateDismissalRequest = {
    scanId: number;
    groupId: number;
};
export type BookDuplicateGroupsResponse = {
    groups: BookDuplicateGroup[];
    total: number;
    page: number;
    pageSize: number;
};
//# sourceMappingURL=book-duplicates.d.ts.map
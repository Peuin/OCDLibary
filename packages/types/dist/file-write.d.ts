export declare const CORE_BOOK_FILE_WRITE_FIELDS: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags"];
export declare const COMMON_PROVIDER_BOOK_FILE_WRITE_FIELDS: readonly ["googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId"];
export declare const COMIC_BOOK_FILE_WRITE_FIELDS: readonly ["comicvineId", "comicIssueNumber", "comicVolumeName", "comicPencillers", "comicInkers", "comicColorists", "comicLetterers", "comicCoverArtists", "comicCharacters", "comicTeams", "comicLocations", "comicStoryArcs"];
export declare const BOOK_FILE_WRITE_FIELDS: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "comicvineId", "comicIssueNumber", "comicVolumeName", "comicPencillers", "comicInkers", "comicColorists", "comicLetterers", "comicCoverArtists", "comicCharacters", "comicTeams", "comicLocations", "comicStoryArcs", "itunesId", "audibleId", "librofmId", "narrators", "coverBytes"];
export type BookFileWriteField = (typeof BOOK_FILE_WRITE_FIELDS)[number];
export declare const BOOK_FILE_WRITE_FIELD_LABELS: {
    readonly title: "Title";
    readonly subtitle: "Subtitle";
    readonly description: "Description";
    readonly publisher: "Publisher";
    readonly publishedDate: "Published date";
    readonly publishedYear: "Published year";
    readonly language: "Language";
    readonly pageCount: "Page count";
    readonly seriesName: "Series";
    readonly seriesIndex: "Series index";
    readonly isbn10: "ISBN-10";
    readonly isbn13: "ISBN-13";
    readonly rating: "Rating";
    readonly authors: "Authors";
    readonly genres: "Genres";
    readonly tags: "Tags";
    readonly googleBooksId: "Google Books ID";
    readonly goodreadsId: "Goodreads ID";
    readonly amazonId: "Amazon ID";
    readonly hardcoverId: "Hardcover ID";
    readonly hardcoverEditionId: "Hardcover edition ID";
    readonly openLibraryId: "Open Library ID";
    readonly ranobedbId: "RanobeDB ID";
    readonly koboId: "Kobo ID";
    readonly lubimyczytacId: "LubimyCzytac ID";
    readonly aladinId: "Aladin ID";
    readonly comicvineId: "ComicVine ID";
    readonly comicIssueNumber: "Issue number";
    readonly comicVolumeName: "Volume";
    readonly comicPencillers: "Pencillers";
    readonly comicInkers: "Inkers";
    readonly comicColorists: "Colorists";
    readonly comicLetterers: "Letterers";
    readonly comicCoverArtists: "Cover artists";
    readonly comicCharacters: "Characters";
    readonly comicTeams: "Teams";
    readonly comicLocations: "Locations";
    readonly comicStoryArcs: "Story arcs";
    readonly itunesId: "iTunes ID";
    readonly audibleId: "Audible ID";
    readonly librofmId: "Libro.fm ISBN";
    readonly narrators: "Narrators";
    readonly coverBytes: "Cover";
};
export declare const EPUB_BOOK_FILE_WRITE_FIELDS: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "itunesId", "coverBytes"];
export declare const FB2_BOOK_FILE_WRITE_FIELDS: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "itunesId", "coverBytes"];
export declare const PDF_BOOK_FILE_WRITE_FIELDS: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "itunesId"];
export declare const CBX_BOOK_FILE_WRITE_FIELDS: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "comicvineId", "comicIssueNumber", "comicVolumeName", "comicPencillers", "comicInkers", "comicColorists", "comicLetterers", "comicCoverArtists", "comicCharacters", "comicTeams", "comicLocations", "comicStoryArcs"];
export declare const MOBI_BOOK_FILE_WRITE_FIELDS: readonly ["title", "description", "publisher", "publishedDate", "language", "isbn10", "isbn13", "authors", "genres", "tags", "coverBytes"];
export declare const AUDIO_BOOK_FILE_WRITE_FIELDS: readonly ["title", "subtitle", "authors", "narrators", "publishedDate", "publishedYear", "publisher", "description", "genres", "language", "seriesName", "seriesIndex", "audibleId", "librofmId", "coverBytes"];
export declare const BOOK_FILE_WRITE_FORMAT_FIELDS: {
    readonly epub: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "itunesId", "coverBytes"];
    readonly fb2: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "itunesId", "coverBytes"];
    readonly pdf: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "itunesId"];
    readonly cbz: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "comicvineId", "comicIssueNumber", "comicVolumeName", "comicPencillers", "comicInkers", "comicColorists", "comicLetterers", "comicCoverArtists", "comicCharacters", "comicTeams", "comicLocations", "comicStoryArcs"];
    readonly cb7: readonly ["title", "subtitle", "description", "publisher", "publishedDate", "publishedYear", "language", "pageCount", "seriesName", "seriesIndex", "isbn10", "isbn13", "rating", "authors", "genres", "tags", "googleBooksId", "goodreadsId", "amazonId", "hardcoverId", "hardcoverEditionId", "openLibraryId", "ranobedbId", "koboId", "lubimyczytacId", "aladinId", "comicvineId", "comicIssueNumber", "comicVolumeName", "comicPencillers", "comicInkers", "comicColorists", "comicLetterers", "comicCoverArtists", "comicCharacters", "comicTeams", "comicLocations", "comicStoryArcs"];
    readonly mobi: readonly ["title", "description", "publisher", "publishedDate", "language", "isbn10", "isbn13", "authors", "genres", "tags", "coverBytes"];
    readonly azw3: readonly ["title", "description", "publisher", "publishedDate", "language", "isbn10", "isbn13", "authors", "genres", "tags", "coverBytes"];
    readonly azw: readonly ["title", "description", "publisher", "publishedDate", "language", "isbn10", "isbn13", "authors", "genres", "tags", "coverBytes"];
    readonly m4b: readonly ["title", "subtitle", "authors", "narrators", "publishedDate", "publishedYear", "publisher", "description", "genres", "language", "seriesName", "seriesIndex", "audibleId", "librofmId", "coverBytes"];
    readonly m4a: readonly ["title", "subtitle", "authors", "narrators", "publishedDate", "publishedYear", "publisher", "description", "genres", "language", "seriesName", "seriesIndex", "audibleId", "librofmId", "coverBytes"];
    readonly mp3: readonly ["title", "subtitle", "authors", "narrators", "publishedDate", "publishedYear", "publisher", "description", "genres", "language", "seriesName", "seriesIndex", "audibleId", "librofmId", "coverBytes"];
    readonly flac: readonly ["title", "subtitle", "authors", "narrators", "publishedDate", "publishedYear", "publisher", "description", "genres", "language", "seriesName", "seriesIndex", "audibleId", "librofmId", "coverBytes"];
};
export declare function getBookFileWriteFormatFields(format: string | null | undefined): readonly BookFileWriteField[];
export type WriteResult = {
    status: "success" | "skipped" | "failed";
    fieldsWritten: string[];
    durationMs: number;
    reason?: string;
};
export type LibraryFileSyncProgressEvent = {
    bookId: number;
    status: "success" | "failed" | "skipped";
    reason?: string;
} | {
    done: true;
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
};
export type WriteLogEntry = {
    id: number;
    format: string;
    status: string;
    fieldsWritten: string[];
    triggeredBy: string;
    writtenAt: string;
    durationMs: number | null;
    errorMessage: string | null;
};
export interface FileRenameResult {
    status: "success" | "skipped" | "failed";
    reason?: string;
    oldPath?: string;
    newPath?: string;
    durationMs: number;
}
export interface BookWriteAndRenameResult {
    write: WriteResult;
    rename: FileRenameResult;
    libraryAutoWriteEnabled: boolean;
    libraryAutoRenameEnabled: boolean;
}
export type BulkRenameStatus = "will_rename" | "unchanged" | "collision" | "no_pattern" | "error";
export interface BulkRenamePreviewItem {
    bookId: number;
    title: string;
    currentPath: string;
    newPath: string | null;
    status: BulkRenameStatus;
    reason?: string;
}
export interface BulkRenamePreviewPage {
    items: BulkRenamePreviewItem[];
    total: number;
    totalByStatus: Record<BulkRenameStatus, number>;
    /**
     * The naming pattern the preview was resolved against, so the client can attribute each
     * changed path segment to the pattern segment that produced it.
     */
    pattern: string;
}
/**
 * How a run is narrowed. The candidate list can run to tens of thousands and the client only
 * holds the pages it has loaded, so neither side of the selection is ever sent in full: the
 * request states whichever side is small.
 *
 * `excludeBookIds` means "rename every candidate except these" and backs the default review
 * flow, where the reviewer skips a handful. `includeBookIds` means "rename only these" and backs
 * the flow that starts from an empty selection. Sending both is rejected; sending neither
 * renames every candidate.
 */
export interface BulkRenameExecuteRequest {
    excludeBookIds?: number[];
    includeBookIds?: number[];
}
/**
 * `started` is emitted before any slow work so the response headers flush immediately and the
 * client can show real progress instead of an idle request. Its `total` is the server-narrowed
 * count, which is authoritative: the client only ever knows the pages it has loaded.
 */
export type BulkRenameProgressEvent = {
    started: true;
    total: number;
} | {
    bookId: number;
    status: "success" | "failed" | "skipped";
    reason?: string;
} | {
    done: true;
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
};
//# sourceMappingURL=file-write.d.ts.map
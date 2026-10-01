export declare const DEFAULT_UPLOAD_PATTERN_BOOK_PER_FILE = "<{authors:first}|Unknown Author>/<{series}/><{seriesIndex}. ><{title}|{originalFilename}>< ({year})>";
export declare const DEFAULT_UPLOAD_PATTERN_BOOK_PER_FOLDER = "<{authors:first}|Unknown Author>/<{series}/><{seriesIndex}. ><{title}|{originalFilename}>< ({year})>/<{seriesIndex}. ><{title}|{originalFilename}>< ({year})>";
export declare const DEFAULT_DOWNLOAD_PATTERN = "{originalFilename}";
export declare const DEFAULT_KOREADER_DEVICE_PATTERN = "<Series/{series}/|Standalone/{authors:first} - ><{seriesIndex:fixed2} - >{title}";
export declare const EXAMPLE_PATTERN_METADATA: Record<string, string>;
export declare const PATTERN_TOKENS: readonly [{
    readonly token: "title";
    readonly description: "Book title";
}, {
    readonly token: "subtitle";
    readonly description: "Book subtitle";
}, {
    readonly token: "authors";
    readonly description: "Author(s), comma-separated";
}, {
    readonly token: "narrators";
    readonly description: "Narrator(s), comma-separated";
}, {
    readonly token: "year";
    readonly description: "Publication year";
}, {
    readonly token: "series";
    readonly description: "Series name";
}, {
    readonly token: "seriesIndex";
    readonly description: "Series index (zero-padded)";
}, {
    readonly token: "publisher";
    readonly description: "Publisher";
}, {
    readonly token: "isbn";
    readonly description: "ISBN-13";
}, {
    readonly token: "language";
    readonly description: "Language";
}, {
    readonly token: "library";
    readonly description: "Library name";
}, {
    readonly token: "originalFilename";
    readonly description: "Original filename (without extension)";
}, {
    readonly token: "extension";
    readonly description: "File extension (without dot)";
}];
export type PatternToken = (typeof PATTERN_TOKENS)[number]["token"];
export type PathResolverOptions = {
    sanitizeForCrossPlatform?: boolean;
    replacementCharacter?: "_" | "-";
};
export declare const MAX_PATH_SEGMENT_BYTES = 255;
export declare function applyModifier(value: string, modifier: string, fieldName: string): string;
export declare function replacePlaceholders(pattern: string, values: Record<string, string>): string;
export declare function validatePattern(pattern: string): boolean;
export declare function sanitizePathSegment(value: string, replacementCharacter?: "_" | "-"): string;
/**
 * Resolves a file naming pattern to a relative path (no leading slash).
 * - Pattern ending with '/' → folder path; original filename is used as the file stem.
 * - Otherwise → the resolved string is the full relative path; extension is appended if missing.
 *
 * Returns null if the pattern resolves to an empty string.
 */
export declare function resolveUploadPath(pattern: string, values: Record<string, string>, ext: string, options?: PathResolverOptions): string | null;
/**
 * Resolves a file naming pattern to a filename (no path separators).
 * - If the resolved pattern contains folder segments, only the last segment is used.
 * - If the resolved pattern ends with '/', originalFilename is used.
 * - Extension is appended when missing.
 *
 * Returns null if the pattern resolves to an empty filename.
 */
export declare function resolveDownloadFilename(pattern: string, values: Record<string, string>, ext: string, options?: PathResolverOptions): string | null;
//# sourceMappingURL=pattern-resolver.d.ts.map
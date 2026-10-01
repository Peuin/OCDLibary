/**
 * Which medium a user-owned container holds. Books and podcasts never share rows: their
 * underlying tables are disjoint, so scopes and collections carry this discriminator and
 * each one belongs to exactly one medium.
 */
export declare const MEDIA_TYPES: readonly ["books", "podcasts"];
export type MediaType = (typeof MEDIA_TYPES)[number];
export declare const DEFAULT_MEDIA_TYPE: MediaType;
export declare function isMediaType(value: unknown): value is MediaType;
export declare function normalizeMediaType(value: unknown): MediaType;
//# sourceMappingURL=media.d.ts.map
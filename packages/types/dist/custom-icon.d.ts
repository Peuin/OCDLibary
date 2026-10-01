export declare const CUSTOM_ICON_PREFIX = "custom:";
export declare const CUSTOM_ICON_SLUG_MAX_LENGTH = 80;
export declare const CUSTOM_ICON_NAME_MAX_LENGTH = 120;
export declare const ICON_VALUE_MAX_LENGTH = 100;
export declare const CUSTOM_ICON_MAX_FILE_SIZE: number;
export declare const CUSTOM_ICON_MAX_UPLOAD_FILES = 50;
export declare const CUSTOM_ICON_DEFAULT_PAGE_SIZE = 48;
export declare const CUSTOM_ICON_MAX_PAGE_SIZE = 100;
export declare const CUSTOM_ICON_CATALOG_LIMIT = 500;
export declare const CUSTOM_ICON_SORTS: readonly ["newest", "name"];
export type CustomIconSort = (typeof CUSTOM_ICON_SORTS)[number];
export interface CustomIcon {
    slug: string;
    name: string;
    svgUrl: string;
    fileHash: string;
    fileSize: number;
    createdAt: string;
    updatedAt: string;
}
export interface CustomIconPage {
    items: CustomIcon[];
    total: number;
    page: number;
    size: number;
}
export interface CustomIconCatalog {
    items: CustomIcon[];
    total: number;
}
export interface CustomIconUsage {
    total: number;
    libraries: number;
    collections: number;
    smartScopes: number;
}
export interface CustomIconStageItem {
    filename: string;
    ok: boolean;
    error?: string;
    suggestedName?: string;
    sanitizedSvg?: string;
    fileHash?: string;
    duplicateOfSlug?: string;
    duplicateOfName?: string;
}
export interface CustomIconStageResponse {
    items: CustomIconStageItem[];
}
export interface CustomIconUploadMetaItem {
    filename: string;
    name: string;
}
export interface CustomIconUploadItem {
    filename: string;
    status: "created" | "failed";
    icon?: CustomIcon;
    error?: string;
}
export interface CustomIconUploadResponse {
    items: CustomIconUploadItem[];
}
export interface BulkDeleteCustomIconsRequest {
    slugs: string[];
}
export interface BulkDeleteCustomIconsResponse {
    deleted: string[];
    failed: string[];
}
export declare function isCustomIconValue(value: string | null | undefined): value is `custom:${string}`;
export declare function customIconSlugFromValue(value: string | null | undefined): string | null;
export declare function customIconValue(slug: string): `custom:${string}`;
export declare function customIconSvgUrl(slug: string): string;
export declare function slugifyIconName(value: string): string;
export declare function isValidIconSlug(slug: string): boolean;
//# sourceMappingURL=custom-icon.d.ts.map
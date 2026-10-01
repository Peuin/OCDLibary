import type { EpubMediaOverlayCapability } from "./epub";
export declare const UPLOAD_SUPPORTED_FORMATS: readonly ["epub", "kepub", "pdf", "mobi", "azw", "azw3", "cbz", "cbr", "cb7", "fb2", "m4b", "m4a", "mp3", "opus", "ogg", "flac"];
export type UploadSupportedFormat = (typeof UPLOAD_SUPPORTED_FORMATS)[number];
export declare const UploadErrorCode: {
    readonly TooLarge: "UPLOAD_TOO_LARGE";
    readonly Empty: "UPLOAD_EMPTY";
    readonly UnsupportedFormat: "UPLOAD_FORMAT_UNSUPPORTED";
    readonly FormatNotAllowed: "UPLOAD_FORMAT_NOT_ALLOWED";
    readonly InvalidContent: "UPLOAD_CONTENT_INVALID";
    readonly Duplicate: "UPLOAD_DUPLICATE";
    readonly DestinationConflict: "UPLOAD_DESTINATION_CONFLICT";
    readonly StorageFull: "UPLOAD_STORAGE_FULL";
    readonly InvalidTarget: "UPLOAD_TARGET_INVALID";
    readonly OffsetMismatch: "UPLOAD_OFFSET_MISMATCH";
    readonly ChecksumMismatch: "UPLOAD_CHECKSUM_MISMATCH";
    readonly SessionExpired: "UPLOAD_SESSION_EXPIRED";
    readonly SessionStateInvalid: "UPLOAD_SESSION_STATE_INVALID";
    readonly ImportFailed: "UPLOAD_IMPORT_FAILED";
};
export type UploadErrorCode = (typeof UploadErrorCode)[keyof typeof UploadErrorCode];
export type UploadTarget = {
    kind: "library";
    libraryId: number;
    folderId?: number;
} | {
    kind: "existing_book";
    bookId: number;
} | {
    kind: "book_dock";
};
export type UploadSessionStatus = "receiving" | "processing" | "completed" | "failed" | "cancelled" | "expired";
export interface CreateUploadSessionRequest {
    filename: string;
    sizeBytes: number;
    idempotencyKey: string;
    target: UploadTarget;
    contentType?: string;
    sha256?: string;
}
export interface UploadSessionResponse {
    id: string;
    filename: string;
    sizeBytes: number;
    receivedBytes: number;
    chunkSizeBytes: number;
    status: UploadSessionStatus;
    target: UploadTarget;
    errorCode?: UploadErrorCode | null;
    errorMessage?: string | null;
    bookId?: number | null;
    bookDockFileId?: number | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string | null;
}
export interface UploadCapabilitiesLibrary {
    id: number;
    name: string;
    allowedFormats: string[];
    organizationMode: "book_per_file" | "book_per_folder";
    folders: {
        id: number;
        name: string;
    }[];
}
export interface UploadCapabilitiesResponse {
    maxFileSizeBytes: number;
    chunkSizeBytes: number;
    supportedFormats: string[];
    canUploadToLibrary: boolean;
    canUseBookDock: boolean;
    libraries: UploadCapabilitiesLibrary[];
}
export type UploadResult = {
    bookId: number;
    filename: string;
    format: string;
    sizeBytes: number;
};
export type AddBookFileResult = {
    id: number;
    format: string | null;
    role: string;
    sizeBytes: number | null;
    absolutePath: string;
    createdAt: string;
    filename: string;
    durationSeconds: number | null;
    mediaOverlay?: EpubMediaOverlayCapability | null;
    bookStatus: string;
};
//# sourceMappingURL=upload.d.ts.map
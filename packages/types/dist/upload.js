"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadErrorCode = exports.UPLOAD_SUPPORTED_FORMATS = void 0;
exports.UPLOAD_SUPPORTED_FORMATS = [
    "epub",
    "kepub",
    "pdf",
    "mobi",
    "azw",
    "azw3",
    "cbz",
    "cbr",
    "cb7",
    "fb2",
    "m4b",
    "m4a",
    "mp3",
    "opus",
    "ogg",
    "flac",
];
exports.UploadErrorCode = {
    TooLarge: "UPLOAD_TOO_LARGE",
    Empty: "UPLOAD_EMPTY",
    UnsupportedFormat: "UPLOAD_FORMAT_UNSUPPORTED",
    FormatNotAllowed: "UPLOAD_FORMAT_NOT_ALLOWED",
    InvalidContent: "UPLOAD_CONTENT_INVALID",
    Duplicate: "UPLOAD_DUPLICATE",
    DestinationConflict: "UPLOAD_DESTINATION_CONFLICT",
    StorageFull: "UPLOAD_STORAGE_FULL",
    InvalidTarget: "UPLOAD_TARGET_INVALID",
    OffsetMismatch: "UPLOAD_OFFSET_MISMATCH",
    ChecksumMismatch: "UPLOAD_CHECKSUM_MISMATCH",
    SessionExpired: "UPLOAD_SESSION_EXPIRED",
    SessionStateInvalid: "UPLOAD_SESSION_STATE_INVALID",
    ImportFailed: "UPLOAD_IMPORT_FAILED",
};

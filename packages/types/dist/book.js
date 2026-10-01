"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONCRETE_BOOK_MEDIA_KINDS = exports.READING_ATTEMPT_ORIGINS = exports.READING_ATTEMPT_OUTCOMES = exports.READ_STATUSES = exports.EBOOK_FORMAT_LIST = exports.COMIC_FORMAT_LIST = exports.AUDIO_FORMAT_LIST = exports.BOOK_FORMATS = void 0;
exports.isAudioFormat = isAudioFormat;
exports.isComicFormat = isComicFormat;
exports.getPrimaryBookFile = getPrimaryBookFile;
exports.getBookMediaKind = getBookMediaKind;
exports.getBookMediaProfile = getBookMediaProfile;
const library_1 = require("./library");
// Derived rather than duplicated: these two lists describe the same set of formats,
// and maintaining them separately let BOOK_FORMATS fall behind on azw and kepub.
exports.BOOK_FORMATS = library_1.DEFAULT_FORMAT_PRIORITY;
/** Exported as an ordered list too, so a form offering these cannot drift from what matches them. */
exports.AUDIO_FORMAT_LIST = ["m4b", "mp3", "m4a", "opus", "ogg", "flac"];
const AUDIO_FORMATS = new Set(exports.AUDIO_FORMAT_LIST);
function isAudioFormat(format) {
    return AUDIO_FORMATS.has(format.toLowerCase());
}
exports.COMIC_FORMAT_LIST = ["cbz", "cbr", "cb7", "cbx"];
const COMIC_FORMATS = new Set(exports.COMIC_FORMAT_LIST);
function isComicFormat(format) {
    return COMIC_FORMATS.has(format.toLowerCase());
}
/** What BookOrbit accepts as an ebook, and what an ebook tier may therefore ask for. */
exports.EBOOK_FORMAT_LIST = ["epub", "kepub", "mobi", "azw3", "azw", "fb2", "pdf", "djvu"];
exports.READ_STATUSES = ["unread", "want_to_read", "reading", "on_hold", "rereading", "read", "skimmed", "abandoned"];
exports.READING_ATTEMPT_OUTCOMES = ["completed", "skimmed", "abandoned"];
exports.READING_ATTEMPT_ORIGINS = ["manual", "bookorbit", "kobo", "koreader", "hardcover", "migration"];
/** The kinds a real file can be. `BookMediaKind` adds the case where no format identifies one. */
exports.CONCRETE_BOOK_MEDIA_KINDS = ["ebook", "audiobook", "comic"];
function getPrimaryBookFile(files) {
    return files.find((file) => file.role === "primary") ?? files.find((file) => file.format != null) ?? files[0] ?? null;
}
function getBookMediaKind(format) {
    const normalized = format?.trim().toLowerCase();
    if (!normalized)
        return "unknown";
    if (isAudioFormat(normalized))
        return "audiobook";
    if (isComicFormat(normalized))
        return "comic";
    return "ebook";
}
function getBookMediaProfile(files) {
    const mediaKinds = files.map((file) => getBookMediaKind(file.format));
    return {
        primaryMediaKind: getBookMediaKind(getPrimaryBookFile(files)?.format),
        hasEbook: mediaKinds.includes("ebook"),
        hasAudio: mediaKinds.includes("audiobook"),
        hasComic: mediaKinds.includes("comic"),
    };
}

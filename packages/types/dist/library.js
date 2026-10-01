"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIBRARY_FOLDER_ROLES = exports.FORMAT_LABELS = exports.DEFAULT_FORMAT_PRIORITY = void 0;
exports.normalizeCoverAspectRatio = normalizeCoverAspectRatio;
function normalizeCoverAspectRatio(value) {
    return value === "1/1" ? "1/1" : "2/3";
}
exports.DEFAULT_FORMAT_PRIORITY = [
    "epub",
    "kepub",
    "pdf",
    "cbz",
    "cbr",
    "cb7",
    "mobi",
    "azw3",
    "azw",
    "fb2",
    "m4b",
    "mp3",
    "m4a",
    "opus",
    "ogg",
    "flac",
];
exports.FORMAT_LABELS = {
    epub: "EPUB e-book",
    kepub: "KEPUB e-book",
    pdf: "PDF document",
    cbz: "CBZ comic",
    cbr: "CBR comic",
    cb7: "CB7 comic",
    mobi: "MOBI e-book",
    azw3: "AZW3 e-book",
    azw: "AZW e-book",
    fb2: "FictionBook",
    m4b: "M4B audiobook",
    mp3: "MP3 audio",
    m4a: "M4A audio",
    opus: "Opus audio",
    ogg: "OGG audio",
    flac: "FLAC audio",
};
exports.LIBRARY_FOLDER_ROLES = ["downloads", "local"];

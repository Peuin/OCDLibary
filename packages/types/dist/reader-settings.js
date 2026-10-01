"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.READER_GROUP_DEFAULTS = exports.AUDIO_READER_DEFAULTS = exports.CBX_READER_DEFAULTS = exports.PDF_READER_DEFAULTS = exports.EPUB_READER_DEFAULTS = exports.FORMAT_TO_GROUP = exports.READER_OPENABLE_FORMATS = exports.CBX_SPREAD_GAP_MAX = exports.CBX_SPREAD_GAP_MIN = exports.EPUB_TEXT_INDENT_MAX = exports.EPUB_TEXT_INDENT_MIN = exports.EPUB_WORD_SPACING_MAX = exports.EPUB_WORD_SPACING_MIN = exports.EPUB_LETTER_SPACING_MAX = exports.EPUB_LETTER_SPACING_MIN = exports.EPUB_PARAGRAPH_SPACING_MAX = exports.EPUB_PARAGRAPH_SPACING_MIN = exports.EPUB_FONT_SIZE_MAX = exports.EPUB_FONT_SIZE_MIN = void 0;
exports.getFormatGroup = getFormatGroup;
exports.getOpenableFormatsForGroup = getOpenableFormatsForGroup;
exports.EPUB_FONT_SIZE_MIN = 6;
exports.EPUB_FONT_SIZE_MAX = 32;
exports.EPUB_PARAGRAPH_SPACING_MIN = 0;
exports.EPUB_PARAGRAPH_SPACING_MAX = 2;
exports.EPUB_LETTER_SPACING_MIN = 0;
exports.EPUB_LETTER_SPACING_MAX = 0.2;
exports.EPUB_WORD_SPACING_MIN = 0;
exports.EPUB_WORD_SPACING_MAX = 0.5;
exports.EPUB_TEXT_INDENT_MIN = 0;
exports.EPUB_TEXT_INDENT_MAX = 4;
exports.CBX_SPREAD_GAP_MIN = 0;
exports.CBX_SPREAD_GAP_MAX = 64;
// Formats the reader can actually open. Used to show/hide Read/Open buttons.
exports.READER_OPENABLE_FORMATS = new Set([
    // epub reader (foliate)
    "epub",
    "mobi",
    "azw3",
    "azw",
    "fb2",
    // pdf reader
    "pdf",
    // comic reader
    "cbz",
    "cbr",
    "cb7",
    // audio reader
    "m4b",
    "mp3",
    "m4a",
    "opus",
    "ogg",
    "flac",
]);
exports.FORMAT_TO_GROUP = {
    epub: "epub",
    mobi: "epub",
    azw3: "epub",
    azw: "epub",
    fb2: "epub",
    txt: "epub",
    pdf: "pdf",
    cbx: "cbx",
    cbz: "cbx",
    cbr: "cbx",
    cb7: "cbx",
    m4b: "audio",
    mp3: "audio",
    m4a: "audio",
    opus: "audio",
    ogg: "audio",
    flac: "audio",
};
function getFormatGroup(format) {
    return exports.FORMAT_TO_GROUP[format.toLowerCase()] ?? "epub";
}
/** Formats a given reader can open, so a caller can ask for "another file this same reader handles". */
function getOpenableFormatsForGroup(group) {
    return Object.entries(exports.FORMAT_TO_GROUP)
        .filter(([format, formatGroup]) => formatGroup === group && exports.READER_OPENABLE_FORMATS.has(format))
        .map(([format]) => format);
}
exports.EPUB_READER_DEFAULTS = {
    themeName: "default",
    isDark: false,
    fontFamily: null,
    fontWeight: 400,
    fontStyle: "normal",
    fontSize: 16,
    lineHeight: 1.5,
    paragraphSpacing: exports.EPUB_PARAGRAPH_SPACING_MIN,
    letterSpacing: null,
    wordSpacing: null,
    textIndent: null,
    maxColumnCount: 2,
    gap: 0.05,
    maxInlineSize: 720,
    maxBlockSize: 1440,
    justify: true,
    hyphenate: true,
    flow: "paginated",
    overrideBookFormatting: true,
    footerDisplayMode: 0,
    fixedLayoutSpread: "auto",
};
exports.PDF_READER_DEFAULTS = {
    scrollMode: "page",
    spread: "none",
    zoomMode: "fit-page",
    customScale: 1.0,
    rotation: 0,
};
exports.CBX_READER_DEFAULTS = {
    fitMode: "fit-page",
    viewMode: "single",
    scrollMode: "paginated",
    direction: "ltr",
    spreadAlignment: "normal",
    spreadGap: 0,
    forceTwoPage: false,
    widePageSingletonMode: "auto",
    bgColor: "black",
    autoAdvance: false,
};
exports.AUDIO_READER_DEFAULTS = {
    playbackSpeed: 1.0,
    volume: 1.0,
    skipBackSeconds: 10,
    skipForwardSeconds: 30,
};
exports.READER_GROUP_DEFAULTS = {
    epub: exports.EPUB_READER_DEFAULTS,
    pdf: exports.PDF_READER_DEFAULTS,
    cbx: exports.CBX_READER_DEFAULTS,
    audio: exports.AUDIO_READER_DEFAULTS,
};

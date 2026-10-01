import type { FontStyle } from "./font";
export type ReaderFormatGroup = "epub" | "pdf" | "cbx" | "audio";
export declare const EPUB_FONT_SIZE_MIN = 6;
export declare const EPUB_FONT_SIZE_MAX = 32;
export declare const EPUB_PARAGRAPH_SPACING_MIN = 0;
export declare const EPUB_PARAGRAPH_SPACING_MAX = 2;
export declare const EPUB_LETTER_SPACING_MIN = 0;
export declare const EPUB_LETTER_SPACING_MAX = 0.2;
export declare const EPUB_WORD_SPACING_MIN = 0;
export declare const EPUB_WORD_SPACING_MAX = 0.5;
export declare const EPUB_TEXT_INDENT_MIN = 0;
export declare const EPUB_TEXT_INDENT_MAX = 4;
export declare const CBX_SPREAD_GAP_MIN = 0;
export declare const CBX_SPREAD_GAP_MAX = 64;
export declare const READER_OPENABLE_FORMATS: Set<string>;
export declare const FORMAT_TO_GROUP: Record<string, ReaderFormatGroup>;
export declare function getFormatGroup(format: string): ReaderFormatGroup;
/** Formats a given reader can open, so a caller can ask for "another file this same reader handles". */
export declare function getOpenableFormatsForGroup(group: ReaderFormatGroup): string[];
export interface EpubReaderSettings {
    themeName: string;
    isDark: boolean;
    fontFamily: string | null;
    fontWeight: number;
    fontStyle: FontStyle;
    fontSize: number;
    lineHeight: number;
    paragraphSpacing: number;
    letterSpacing: number | null;
    wordSpacing: number | null;
    textIndent: number | null;
    maxColumnCount: number;
    gap: number;
    maxInlineSize: number;
    maxBlockSize: number;
    justify: boolean;
    hyphenate: boolean;
    flow: "paginated" | "scrolled";
    overrideBookFormatting: boolean;
    footerDisplayMode: 0 | 1 | 2;
    fixedLayoutSpread: "auto" | "none";
}
export interface PdfReaderSettings {
    scrollMode: "vertical" | "horizontal" | "page";
    spread: "none" | "odd" | "even" | "auto";
    zoomMode: "fit-width" | "fit-page" | "automatic" | "custom";
    customScale: number;
    rotation: 0 | 90 | 180 | 270;
}
export interface CbxReaderSettings {
    fitMode: "fit-page" | "fit-width" | "fit-height" | "actual";
    viewMode: "single" | "two-page";
    scrollMode: "paginated" | "infinite" | "long-strip";
    direction: "ltr" | "rtl";
    spreadAlignment: "normal" | "shifted";
    spreadGap: number;
    forceTwoPage: boolean;
    widePageSingletonMode: "auto" | "disable";
    bgColor: "black" | "gray" | "white";
    autoAdvance: boolean;
}
export interface AudioReaderSettings {
    playbackSpeed: number;
    volume: number;
    skipBackSeconds: number;
    skipForwardSeconds: number;
}
export type ReaderSettingsMap = {
    epub: EpubReaderSettings;
    pdf: PdfReaderSettings;
    cbx: CbxReaderSettings;
    audio: AudioReaderSettings;
};
export type ReaderSettings = EpubReaderSettings | PdfReaderSettings | CbxReaderSettings | AudioReaderSettings;
export declare const EPUB_READER_DEFAULTS: EpubReaderSettings;
export declare const PDF_READER_DEFAULTS: PdfReaderSettings;
export declare const CBX_READER_DEFAULTS: CbxReaderSettings;
export declare const AUDIO_READER_DEFAULTS: AudioReaderSettings;
/**
 * Body of `PATCH /reader/defaults/:formatGroup`.
 *
 * Only the keys present in `set` are written. Every other key of the group keeps whatever the
 * stored row already holds, so a client that owns a subset of the fields can save its own without
 * having to send, and therefore without having to know, the rest. The iOS app is the only caller:
 * it keeps the layout fields on the device and sends only the look fields.
 */
export interface ReaderDefaultsPatchBody<G extends ReaderFormatGroup = ReaderFormatGroup> {
    set: Partial<ReaderSettingsMap[G]>;
}
/**
 * Body of `PATCH /reader/preferences/:bookFileId`.
 *
 * `set` pins fields on the book; `unset` removes them so the field falls back to the account
 * default. At least one of the two must be non-empty, and a key may not appear in both. A row left
 * with no keys is deleted, which is the same state as never having been customized.
 */
export interface ReaderPreferencePatchBody<G extends ReaderFormatGroup = ReaderFormatGroup> {
    set?: Partial<ReaderSettingsMap[G]>;
    unset?: string[];
}
export declare const READER_GROUP_DEFAULTS: ReaderSettingsMap;
//# sourceMappingURL=reader-settings.d.ts.map
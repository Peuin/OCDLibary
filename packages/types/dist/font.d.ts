export type FontFormat = "ttf" | "otf" | "woff" | "woff2";
export type FontStyle = "normal" | "italic";
/**
 * Where a font comes from. `user` fonts are uploaded by and visible to a single
 * account; `server` fonts are curated by an administrator and offered to everyone.
 */
export type FontScope = "user" | "server";
export declare const FONT_SCOPES: readonly FontScope[];
/** One selectable style within a family: a weight paired with an upright/italic axis. */
export interface FontVariant {
    weight: number;
    style: FontStyle;
}
/**
 * A style a variable font advertises through its `fvar` named instances, carrying the
 * designer's own name for it ("SemiBold Italic") rather than one derived from the weight.
 */
export interface FontNamedInstance extends FontVariant {
    /**
     * The designer's own name for the instance. Null when the font did not name it, which
     * leaves the reader to label it from the weight in the reader's own language.
     */
    name: string | null;
}
export interface UserFont {
    id: number;
    familyName: string;
    originalFileName: string;
    format: FontFormat;
    /** The face this file renders by default. For a variable font, its default instance. */
    weight: number;
    style: FontStyle;
    /**
     * Bounds of the file's `wght` variation axis, or null for a static face. A variable
     * font declares these in `@font-face` so every weight in the range renders from the
     * real axis instead of being synthesised from the default instance.
     */
    weightMin: number | null;
    weightMax: number | null;
    /** Styles a variable file advertises by name. Null for a static face. */
    instances: FontNamedInstance[] | null;
    fileSize: number;
    createdAt: string;
}
/** Server fonts are wire-identical to user fonts; only their scope differs. */
export type ServerFont = UserFont;
export interface FontUploadResult {
    font: UserFont;
    suggestedFamilyName: string | null;
    suggestedWeight: number;
    suggestedStyle: FontStyle;
}
export declare const FONT_FORMATS: readonly FontFormat[];
export declare const FONT_FORMAT_EXTENSIONS: Record<FontFormat, string>;
export declare const FONT_FORMAT_MIME_TYPES: Record<FontFormat, string>;
export declare const FONT_FORMAT_CSS_FORMAT: Record<FontFormat, string>;
export declare const MAX_FONT_FILE_SIZE: number;
export declare const MAX_FONTS_PER_USER = 50;
export declare const MAX_SERVER_FONTS = 200;
export declare function maxFontsForScope(scope: FontScope): number;
export declare const FONT_WEIGHTS: readonly [100, 200, 300, 400, 500, 600, 700, 800, 900];
export declare const CSS_FONT_WEIGHT_MIN = 1;
export declare const CSS_FONT_WEIGHT_MAX = 1000;
export declare function isCssFontWeight(value: unknown): value is number;
export declare const FONT_FAMILY_NAME_MAX_LENGTH = 200;
/**
 * Per-user opt-outs from the server collection. Server fonts are offered to everyone by
 * default; a reader can hide the ones they do not want cluttering their font picker.
 *
 * Families are stored by name because that is the unit the picker offers. An administrator
 * renaming a family therefore un-hides it, which is the intended reading: it is presented
 * as a different typeface from that point on.
 */
export interface ServerFontPreferences {
    hiddenFamilies: string[];
}
export declare const SERVER_FONT_PREFERENCES_DEFAULTS: ServerFontPreferences;
/**
 * CSS font-family prefixes, one per scope. They keep a user font and a server font
 * that share a family name from collapsing into a single `@font-face` group.
 *
 * The `user` prefix is persisted in saved reader settings, so it must not change.
 */
export declare const FONT_CSS_FAMILY_PREFIXES: Record<FontScope, string>;
/**
 * Returns a stable, CSS-safe font-family name shared by all variants of a family.
 * Using one name per family (differentiated by font-weight/font-style) lets the
 * browser pick bold/italic variants automatically.
 */
export declare function fontCssFamilyGroupName(familyName: string, scope?: FontScope): string;
/** Returns the scope a CSS family name belongs to, or null for built-in font stacks. */
export declare function fontScopeFromCssFamily(cssFamilyName: string | null | undefined): FontScope | null;
/** True when a reader `fontFamily` value refers to an uploaded font rather than a built-in stack. */
export declare function isCustomFontCssFamily(cssFamilyName: string | null | undefined): boolean;
/** True when the file carries a `wght` variation axis rather than a single static weight. */
export declare function isVariableFont(font: Pick<UserFont, "weightMin" | "weightMax">): boolean;
/**
 * The styles a built-in font stack offers. Unlike an uploaded family there is no file
 * list to read, so the reader offers the four the browser can always produce from a
 * system stack.
 */
export declare const BUILT_IN_FONT_VARIANTS: readonly FontVariant[];
/** Orders variants the way a font picker reads: upright before italic, light before heavy. */
export declare function compareFontVariants(a: FontVariant, b: FontVariant): number;
//# sourceMappingURL=font.d.ts.map
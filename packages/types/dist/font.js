"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILT_IN_FONT_VARIANTS = exports.FONT_CSS_FAMILY_PREFIXES = exports.SERVER_FONT_PREFERENCES_DEFAULTS = exports.FONT_FAMILY_NAME_MAX_LENGTH = exports.CSS_FONT_WEIGHT_MAX = exports.CSS_FONT_WEIGHT_MIN = exports.FONT_WEIGHTS = exports.MAX_SERVER_FONTS = exports.MAX_FONTS_PER_USER = exports.MAX_FONT_FILE_SIZE = exports.FONT_FORMAT_CSS_FORMAT = exports.FONT_FORMAT_MIME_TYPES = exports.FONT_FORMAT_EXTENSIONS = exports.FONT_FORMATS = exports.FONT_SCOPES = void 0;
exports.maxFontsForScope = maxFontsForScope;
exports.isCssFontWeight = isCssFontWeight;
exports.fontCssFamilyGroupName = fontCssFamilyGroupName;
exports.fontScopeFromCssFamily = fontScopeFromCssFamily;
exports.isCustomFontCssFamily = isCustomFontCssFamily;
exports.isVariableFont = isVariableFont;
exports.compareFontVariants = compareFontVariants;
exports.FONT_SCOPES = ["user", "server"];
exports.FONT_FORMATS = ["ttf", "otf", "woff", "woff2"];
exports.FONT_FORMAT_EXTENSIONS = {
    ttf: ".ttf",
    otf: ".otf",
    woff: ".woff",
    woff2: ".woff2",
};
exports.FONT_FORMAT_MIME_TYPES = {
    ttf: "font/ttf",
    otf: "font/otf",
    woff: "font/woff",
    woff2: "font/woff2",
};
exports.FONT_FORMAT_CSS_FORMAT = {
    ttf: "truetype",
    otf: "opentype",
    woff: "woff",
    woff2: "woff2",
};
// Sized for CJK and other non-alphabetic fonts, which routinely exceed 30 MB because
// they carry tens of thousands of glyphs.
exports.MAX_FONT_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
exports.MAX_FONTS_PER_USER = 50;
// A curated server collection is typically 10-30 families of ~4 variants each. The cap
// exists so a single administrator cannot fill the data volume by accident.
exports.MAX_SERVER_FONTS = 200;
function maxFontsForScope(scope) {
    return scope === "server" ? exports.MAX_SERVER_FONTS : exports.MAX_FONTS_PER_USER;
}
exports.FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
exports.CSS_FONT_WEIGHT_MIN = 1;
exports.CSS_FONT_WEIGHT_MAX = 1000;
function isCssFontWeight(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= exports.CSS_FONT_WEIGHT_MIN && value <= exports.CSS_FONT_WEIGHT_MAX;
}
exports.FONT_FAMILY_NAME_MAX_LENGTH = 200;
exports.SERVER_FONT_PREFERENCES_DEFAULTS = { hiddenFamilies: [] };
/**
 * CSS font-family prefixes, one per scope. They keep a user font and a server font
 * that share a family name from collapsing into a single `@font-face` group.
 *
 * The `user` prefix is persisted in saved reader settings, so it must not change.
 */
exports.FONT_CSS_FAMILY_PREFIXES = {
    user: "__userfont_",
    server: "__serverfont_",
};
/**
 * Returns a stable, CSS-safe font-family name shared by all variants of a family.
 * Using one name per family (differentiated by font-weight/font-style) lets the
 * browser pick bold/italic variants automatically.
 */
function fontCssFamilyGroupName(familyName, scope = "user") {
    const safe = familyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_") // codeql[js/polynomial-redos] - false positive: simple negated char class has no backtracking
        .replace(/^_+|_+$/g, "") || "font";
    return `${exports.FONT_CSS_FAMILY_PREFIXES[scope]}${safe}`;
}
/** Returns the scope a CSS family name belongs to, or null for built-in font stacks. */
function fontScopeFromCssFamily(cssFamilyName) {
    if (!cssFamilyName)
        return null;
    // Checked longest-prefix-first so the scopes stay distinguishable if a future
    // prefix is ever added that extends another.
    const byLength = [...exports.FONT_SCOPES].sort((a, b) => exports.FONT_CSS_FAMILY_PREFIXES[b].length - exports.FONT_CSS_FAMILY_PREFIXES[a].length);
    return byLength.find((scope) => cssFamilyName.startsWith(exports.FONT_CSS_FAMILY_PREFIXES[scope])) ?? null;
}
/** True when a reader `fontFamily` value refers to an uploaded font rather than a built-in stack. */
function isCustomFontCssFamily(cssFamilyName) {
    return fontScopeFromCssFamily(cssFamilyName) !== null;
}
/** True when the file carries a `wght` variation axis rather than a single static weight. */
function isVariableFont(font) {
    return font.weightMin !== null && font.weightMax !== null && font.weightMax > font.weightMin;
}
/**
 * The styles a built-in font stack offers. Unlike an uploaded family there is no file
 * list to read, so the reader offers the four the browser can always produce from a
 * system stack.
 */
exports.BUILT_IN_FONT_VARIANTS = [
    { weight: 400, style: "normal" },
    { weight: 700, style: "normal" },
    { weight: 400, style: "italic" },
    { weight: 700, style: "italic" },
];
/** Orders variants the way a font picker reads: upright before italic, light before heavy. */
function compareFontVariants(a, b) {
    if (a.style !== b.style)
        return a.style === "normal" ? -1 : 1;
    return a.weight - b.weight;
}

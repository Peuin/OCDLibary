"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOM_ICON_SORTS = exports.CUSTOM_ICON_CATALOG_LIMIT = exports.CUSTOM_ICON_MAX_PAGE_SIZE = exports.CUSTOM_ICON_DEFAULT_PAGE_SIZE = exports.CUSTOM_ICON_MAX_UPLOAD_FILES = exports.CUSTOM_ICON_MAX_FILE_SIZE = exports.ICON_VALUE_MAX_LENGTH = exports.CUSTOM_ICON_NAME_MAX_LENGTH = exports.CUSTOM_ICON_SLUG_MAX_LENGTH = exports.CUSTOM_ICON_PREFIX = void 0;
exports.isCustomIconValue = isCustomIconValue;
exports.customIconSlugFromValue = customIconSlugFromValue;
exports.customIconValue = customIconValue;
exports.customIconSvgUrl = customIconSvgUrl;
exports.slugifyIconName = slugifyIconName;
exports.isValidIconSlug = isValidIconSlug;
exports.CUSTOM_ICON_PREFIX = "custom:";
exports.CUSTOM_ICON_SLUG_MAX_LENGTH = 80;
exports.CUSTOM_ICON_NAME_MAX_LENGTH = 120;
exports.ICON_VALUE_MAX_LENGTH = 100;
exports.CUSTOM_ICON_MAX_FILE_SIZE = 128 * 1024;
exports.CUSTOM_ICON_MAX_UPLOAD_FILES = 50;
exports.CUSTOM_ICON_DEFAULT_PAGE_SIZE = 48;
exports.CUSTOM_ICON_MAX_PAGE_SIZE = 100;
exports.CUSTOM_ICON_CATALOG_LIMIT = 500;
exports.CUSTOM_ICON_SORTS = ["newest", "name"];
function isCustomIconValue(value) {
    return typeof value === "string" && value.startsWith(exports.CUSTOM_ICON_PREFIX) && value.length > exports.CUSTOM_ICON_PREFIX.length;
}
function customIconSlugFromValue(value) {
    return isCustomIconValue(value) ? value.slice(exports.CUSTOM_ICON_PREFIX.length) : null;
}
function customIconValue(slug) {
    return `${exports.CUSTOM_ICON_PREFIX}${slug}`;
}
function customIconSvgUrl(slug) {
    return `/api/v1/custom-icons/${slug}.svg`;
}
function slugifyIconName(value) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, exports.CUSTOM_ICON_SLUG_MAX_LENGTH)
        .replace(/-+$/g, "");
}
function isValidIconSlug(slug) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= exports.CUSTOM_ICON_SLUG_MAX_LENGTH;
}

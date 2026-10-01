"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIDEBAR_DEFAULT_CAP = exports.SIDEBAR_CAP_OPTIONS = exports.SIDEBAR_CAPPED_SECTION_IDS = exports.SIDEBAR_SECTION_IDS = void 0;
exports.SIDEBAR_SECTION_IDS = [
    "browse",
    "libraries",
    "podcasts",
    "smartScopes",
    "collections",
    "podcastScopes",
    "podcastCollections",
];
/** Sections backed by a variable-length entity list, so only these carry a rows-shown cap. */
exports.SIDEBAR_CAPPED_SECTION_IDS = [
    "libraries",
    "podcasts",
    "smartScopes",
    "collections",
    "podcastScopes",
    "podcastCollections",
];
/** How many rows a sidebar entity section renders before the See-all link takes over. */
exports.SIDEBAR_CAP_OPTIONS = [5, 8, 12, 20, "all"];
exports.SIDEBAR_DEFAULT_CAP = 8;

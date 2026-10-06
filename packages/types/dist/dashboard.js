"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DASHBOARD_WIDGET_BATCH_MAX = exports.WIDGET_TYPES = exports.WIDGET_TYPE = exports.DASHBOARD_SHELF_BOOKS_MAX = exports.DASHBOARD_FEATURED_SHELF_IMAGE_MAX_BYTES = exports.DASHBOARD_FEATURED_SHELF_ROWS_MAX = exports.DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX = exports.DASHBOARD_FEATURED_SHELF_TITLE_MAX = exports.DASHBOARD_FEATURED_SHELF_MAX = exports.DASHBOARD_SHELF_LAYOUTS = exports.DASHBOARD_SCROLLER_MAX_LIMIT = exports.DASHBOARD_SCROLLER_BATCH_MAX = exports.PODCAST_SCROLLER_TYPES = exports.BOOK_SCROLLER_TYPES = exports.BOOK_SCROLLER_TYPE = exports.SCROLLER_TYPES = exports.SCROLLER_TYPE = void 0;
exports.isPodcastScrollerType = isPodcastScrollerType;
exports.SCROLLER_TYPE = {
    RECENTLY_ADDED: "recently-added",
    CONTINUE_READING: "continue-reading",
    CONTINUE_LISTENING: "continue-listening",
    CONTINUE_PODCASTS: "continue-podcasts",
    WANT_TO_READ: "want-to-read",
    UP_NEXT_IN_SERIES: "up-next-in-series",
    RANDOM: "random",
    SMART_SCOPE: "smart-scope",
    FEATURED_SHELF: "featured-shelf",
};
exports.SCROLLER_TYPES = Object.values(exports.SCROLLER_TYPE);
/**
 * Shelves whose rows are books, which is every shelf `GET /dashboard/scrollers/:type` can serve.
 * Podcast shelves resolve through the podcast module's own cross-library endpoint instead, so the
 * dashboard route rejects them rather than reaching into podcast tables.
 */
exports.BOOK_SCROLLER_TYPE = {
    RECENTLY_ADDED: exports.SCROLLER_TYPE.RECENTLY_ADDED,
    CONTINUE_READING: exports.SCROLLER_TYPE.CONTINUE_READING,
    CONTINUE_LISTENING: exports.SCROLLER_TYPE.CONTINUE_LISTENING,
    WANT_TO_READ: exports.SCROLLER_TYPE.WANT_TO_READ,
    UP_NEXT_IN_SERIES: exports.SCROLLER_TYPE.UP_NEXT_IN_SERIES,
    RANDOM: exports.SCROLLER_TYPE.RANDOM,
    SMART_SCOPE: exports.SCROLLER_TYPE.SMART_SCOPE,
    FEATURED_SHELF: exports.SCROLLER_TYPE.FEATURED_SHELF,
};
exports.BOOK_SCROLLER_TYPES = Object.values(exports.BOOK_SCROLLER_TYPE);
exports.PODCAST_SCROLLER_TYPES = [
    exports.SCROLLER_TYPE.CONTINUE_PODCASTS,
];
function isPodcastScrollerType(type) {
    return exports.PODCAST_SCROLLER_TYPES.includes(type);
}
exports.DASHBOARD_SCROLLER_BATCH_MAX = 8;
// The server rejects a larger per-shelf limit. Shared so the client can size a
// multi-row shelf without guessing the ceiling it will be validated against.
exports.DASHBOARD_SCROLLER_MAX_LIMIT = 50;
exports.DASHBOARD_SHELF_LAYOUTS = ["wide", "two-columns"];
/**
 * Dashboard shelves an administrator builds for every user. A shelf has a free-form title, an
 * optional saint card at its head, and only the books someone added to it by hand.
 */
exports.DASHBOARD_FEATURED_SHELF_MAX = 12;
exports.DASHBOARD_FEATURED_SHELF_TITLE_MAX = 80;
exports.DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX = 120;
exports.DASHBOARD_FEATURED_SHELF_ROWS_MAX = 3;
exports.DASHBOARD_FEATURED_SHELF_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
exports.DASHBOARD_SHELF_BOOKS_MAX = 50;
exports.WIDGET_TYPE = {
    READING_STREAK: "reading-streak",
    CURRENTLY_READING: "currently-reading",
    READING_GOAL: "reading-goal",
    READING_DNA: "reading-dna",
    MONTHLY_CHALLENGE: "monthly-challenge",
    HIGHLIGHT_OF_THE_DAY: "highlight-of-the-day",
    NEGLECTED_GEMS: "neglected-gems",
    READING_RHYTHM: "reading-rhythm",
    DIVERSITY_SCORE: "diversity-score",
    LIBRARY_OVERVIEW: "library-overview",
    YEAR_PROJECTION: "year-projection",
    LONG_WAIT: "long-wait",
};
exports.WIDGET_TYPES = Object.values(exports.WIDGET_TYPE);
exports.DASHBOARD_WIDGET_BATCH_MAX = exports.WIDGET_TYPES.length;

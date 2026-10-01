"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELEASE_FILE_INSPECTION_STATUSES = exports.INDEXER_SEARCH_FAILURES = exports.RELEASE_SCORE_REASONS = exports.INDEXER_ERROR_CODES = exports.INDEXER_DEFAULT_BASE_URLS = exports.INDEXER_MEDIA_KINDS = exports.INDEXER_DELIVERY = exports.MAX_INDEXER_SEED_TIME_MINUTES = exports.INDEXER_SEEDS_BACK = exports.INDEXER_USES_CATEGORIES = exports.INDEXER_CREDENTIAL_KINDS = exports.DEFAULT_INDEXER_CATEGORIES = exports.INDEXER_COLORS = exports.MAX_INDEXER_RELEASE_GUID_LENGTH = exports.INDEXER_ADAPTER_TYPES = void 0;
exports.pickUnusedIndexerColor = pickUnusedIndexerColor;
exports.releaseInspectionBlocksGrab = releaseInspectionBlocksGrab;
const request_credential_1 = require("./request-credential");
/**
 * Adapter *types* live in code; configured *instances* are database rows. Nothing here is
 * tracker-specific beyond the type name: BookOrbit ships adapter code, never a tracker, never a
 * credential, and no indexer is preconfigured or enabled by default.
 *
 * Only generic protocols are built in. Every named source, open library or otherwise, is a
 * plugin loaded from disk and maintained outside this repository.
 */
exports.INDEXER_ADAPTER_TYPES = ["torznab", "newznab"];
/** Maximum size of an opaque release identifier accepted from an indexer feed and grab request. */
exports.MAX_INDEXER_RELEASE_GUID_LENGTH = 4_096;
/**
 * Hues an operator can assign to a source, so a release row says where it came from before the
 * name is read. Stored as a slug rather than a colour: each one resolves to a token tuned per
 * theme, which a hex value chosen by eye in one theme cannot be.
 *
 * Each slug resolves independently from the protocol colors, so the source remains identifiable
 * even when a release also carries a torrent or direct-download badge.
 */
exports.INDEXER_COLORS = ["blue", "indigo", "purple", "pink", "red", "orange", "yellow", "lime", "green", "teal"];
/** Picks an unused source color until every palette entry has been assigned at least once. */
function pickUnusedIndexerColor(usedColors) {
    const used = new Set(usedColors);
    const unused = exports.INDEXER_COLORS.filter((color) => !used.has(color));
    const choices = unused.length > 0 ? unused : exports.INDEXER_COLORS;
    return choices[Math.floor(Math.random() * choices.length)] ?? exports.INDEXER_COLORS[0];
}
/**
 * Starting points, not constraints. Torznab follows the Newznab category numbering (7020 ebooks,
 * 7030 comics, 3030 audiobooks). A source with no categories at all declares an empty map, and
 * `INDEXER_USES_CATEGORIES` hides the editor rather than showing boxes that do nothing.
 */
exports.DEFAULT_INDEXER_CATEGORIES = {
    torznab: { ebook: [7020], audiobook: [3030], comic: [7030] },
    newznab: { ebook: [7020], audiobook: [3030], comic: [7030] },
};
/** What the credential field holds. Null where the source needs none, as an open library does. */
exports.INDEXER_CREDENTIAL_KINDS = {
    torznab: "apiKey",
    newznab: "apiKey",
};
/** Whether the adapter searches by numeric category at all, which decides if the editor shows. */
exports.INDEXER_USES_CATEGORIES = {
    torznab: true,
    newznab: true,
};
/**
 * Whether a grab from this source joins a swarm. Seed goals are handed to the download client at
 * add time, so for a source that serves the file itself they are not a default to fall back on,
 * they are meaningless, and the form must not offer them.
 */
exports.INDEXER_SEEDS_BACK = {
    torznab: true,
    newznab: false,
};
/** Largest whole-minute seed goal that can be stored in PostgreSQL's integer type. */
exports.MAX_INDEXER_SEED_TIME_MINUTES = 2_147_483_647;
/** How a selected release from each built-in reaches BookOrbit. */
exports.INDEXER_DELIVERY = {
    torznab: "torrent",
    newznab: "usenet",
};
/**
 * Which media a source can actually answer for. A source that does not serve a medium is reported
 * as such in the picker rather than contributing an empty result that reads as "not available".
 */
exports.INDEXER_MEDIA_KINDS = {
    torznab: ["ebook", "audiobook", "comic"],
    newznab: ["ebook", "audiobook", "comic"],
};
/**
 * Prefilled into the form where a source has one canonical address. Still editable, for mirrors.
 * Empty while torznab is the only built-in: its address is the operator's own proxy, and a plugin
 * carries its own `defaultBaseUrl` rather than being listed here.
 */
exports.INDEXER_DEFAULT_BASE_URLS = {};
exports.INDEXER_ERROR_CODES = [
    "INDEXER_NAME_TAKEN",
    "INDEXER_URL_UNSAFE",
    "INDEXER_URL_PRIVATE",
    "INDEXER_CREDENTIAL_REQUIRED",
    "INDEXER_SETTINGS_INVALID",
    /** The test ran and the source refused or could not be reached. Carries the adapter's reason. */
    "INDEXER_TEST_FAILED",
    ...request_credential_1.REQUEST_CREDENTIAL_ERROR_CODES,
];
/**
 * Why a release scored the way it did, as a code plus its signed contribution, so the picker can
 * show the reasoning in the reader's own language rather than an English sentence from the server.
 */
exports.RELEASE_SCORE_REASONS = [
    "isbnMatch",
    "titleMatch",
    "authorMatch",
    "preferredFormat",
    "knownFormat",
    "unknownFormat",
    "expectedSize",
    "suspiciousSize",
    "seeders",
    "freeleech",
    "likelySeveralBooks",
];
/** Distinct enough to act on: an expired tracker session must not look like "nothing found". */
exports.INDEXER_SEARCH_FAILURES = ["unauthorized", "throttled", "timeout", "unreachable", "unsupportedMedium", "error"];
exports.RELEASE_FILE_INSPECTION_STATUSES = [
    "ready",
    "no_supported_file",
    "multiple_supported_files",
    "metadata_unavailable",
    /** Packaged as RAR, ZIP or 7z: the layout is unknowable until it has been extracted. */
    "contents_unknown",
];
/**
 * Whether a release in this state must not be sent to a download client. Only one is: a release
 * with no book file in it can never become an import, so sending it only wastes a download.
 *
 * Everything else is sent. A magnet's layout is unknowable until the swarm answers and an
 * archive's until it is opened, and a release holding several books is a question an approver
 * answers once it has landed rather than a reason to throw the download away.
 *
 * Shared so the button that hides a grab and the guard that refuses one cannot drift apart.
 */
function releaseInspectionBlocksGrab(status) {
    return status === "no_supported_file";
}

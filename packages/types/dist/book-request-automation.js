"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_AUTO_SEARCH_BACKOFF_FACTOR = exports.AUTO_SEARCH_BACKOFF_WEEK_MS = exports.MAX_AUTO_SEARCH_MAX_AGE_DAYS = exports.MIN_AUTO_SEARCH_MAX_AGE_DAYS = exports.MAX_AUTO_SEARCH_INTERVAL_HOURS = exports.MIN_AUTO_SEARCH_INTERVAL_HOURS = exports.MAX_AUTO_GRAB_ATTEMPTS_LIMIT = exports.MIN_AUTO_GRAB_SCORE_FLOOR = exports.DEFAULT_BOOK_REQUEST_AUTOMATION_SETTINGS = exports.BOOK_REQUEST_IMPORT_FORMATS = exports.BOOK_REQUEST_PROFILE_SETTING_KEYS = exports.BOOK_REQUEST_DESTINATION_SETTING_KEYS = exports.BOOK_REQUEST_AUTOMATION_SETTING_KEYS = void 0;
exports.bookRequestDefaultLibraryKey = bookRequestDefaultLibraryKey;
exports.bookRequestDefaultFolderKey = bookRequestDefaultFolderKey;
exports.bookRequestReleaseProfileKey = bookRequestReleaseProfileKey;
const book_request_1 = require("./book-request");
const book_request_destination_1 = require("./book-request-destination");
const book_request_profile_1 = require("./book-request-profile");
/**
 * Instance-level automation for book requests: whether BookOrbit may grab a release without an
 * approver looking at the list, how good that release has to be, how many times it may try again
 * after a failure, and how close an imported file has to be to the request before it is filed.
 *
 * Stored as individual `app_settings` rows rather than one JSON blob, so a single knob can be
 * changed without a read-modify-write over the others.
 */
exports.BOOK_REQUEST_AUTOMATION_SETTING_KEYS = {
    AUTO_GRAB_ENABLED: "book_request_auto_grab_enabled",
    AUTO_GRAB_MIN_SCORE: "book_request_auto_grab_min_score",
    AUTO_RETRY_ENABLED: "book_request_auto_retry_enabled",
    MAX_AUTO_GRAB_ATTEMPTS: "book_request_max_auto_grab_attempts",
    VERIFICATION_ENABLED: "book_request_verification_enabled",
    VERIFICATION_THRESHOLD: "book_request_verification_threshold",
    IMPORT_FORMATS: "book_request_import_formats",
    AUTO_SEARCH_ENABLED: "book_request_auto_search_enabled",
    AUTO_SEARCH_INTERVAL_HOURS: "book_request_auto_search_interval_hours",
    AUTO_SEARCH_MAX_AGE_DAYS: "book_request_auto_search_max_age_days",
};
/**
 * The instance default destination for one medium, as two flat rows rather than a JSON blob, so
 * the destinations follow the same one-row-per-knob rule as the settings above.
 *
 * Derived from the medium rather than spelled out three times: `BOOK_REQUEST_MEDIA_KINDS` is what
 * decides how many there are, and a medium added later should not need six more literals here.
 */
function bookRequestDefaultLibraryKey(mediaKind) {
    return `book_request_default_library_${mediaKind}`;
}
function bookRequestDefaultFolderKey(mediaKind) {
    return `book_request_default_folder_${mediaKind}`;
}
exports.BOOK_REQUEST_DESTINATION_SETTING_KEYS = book_request_1.BOOK_REQUEST_MEDIA_KINDS.flatMap((kind) => [
    bookRequestDefaultLibraryKey(kind),
    bookRequestDefaultFolderKey(kind),
]);
/**
 * The release profile for one medium, as a single JSON row.
 *
 * This is the one deliberate exception to the one-row-per-knob rule above. A tier list is one
 * value: reordering it or editing a condition rewrites the whole list either way, so splitting it
 * across rows would buy nothing and cost the ordering guarantee that makes a profile mean anything.
 */
function bookRequestReleaseProfileKey(mediaKind) {
    return `book_request_release_profile_${mediaKind}`;
}
exports.BOOK_REQUEST_PROFILE_SETTING_KEYS = book_request_1.BOOK_REQUEST_MEDIA_KINDS.map(bookRequestReleaseProfileKey);
exports.BOOK_REQUEST_IMPORT_FORMATS = ["all", "preferred"];
exports.DEFAULT_BOOK_REQUEST_AUTOMATION_SETTINGS = {
    autoGrabEnabled: false,
    autoGrabMinScore: 80,
    autoRetryEnabled: true,
    maxAutoGrabAttempts: 3,
    // Off, like auto-grab itself. This one reaches every configured tracker on a timer rather than
    // when somebody asked for something, so it is a decision an operator makes rather than inherits.
    autoSearchEnabled: false,
    autoSearchIntervalHours: 24,
    autoSearchMaxAgeDays: 60,
    verificationEnabled: true,
    verificationThreshold: 70,
    // Keeping what the release carried is the less surprising default: dropping formats silently is
    // the change an operator would have to notice to undo.
    importFormats: "all",
    // Unset, because guessing which of an operator's libraries holds audiobooks is how a book ends
    // up somewhere nobody looks. Until one is set the destination stays a decision a human makes.
    destinations: (0, book_request_destination_1.emptyRequestDestinationDefaults)(),
    // Empty, so switching to a build that has profiles changes nothing about what gets grabbed.
    // A profile only starts constraining once an operator has written one.
    profiles: (0, book_request_profile_1.emptyReleaseProfiles)(),
};
/**
 * A floor this low would grab almost anything the scorer did not hard-filter, which is not a
 * setting so much as a way to fill a library with the wrong books.
 */
exports.MIN_AUTO_GRAB_SCORE_FLOOR = 50;
exports.MAX_AUTO_GRAB_ATTEMPTS_LIMIT = 10;
/**
 * An hour is already often for a book that did not exist an hour ago, and a week is the point past
 * which "keep looking" stops meaning anything.
 */
exports.MIN_AUTO_SEARCH_INTERVAL_HOURS = 1;
exports.MAX_AUTO_SEARCH_INTERVAL_HOURS = 168;
exports.MIN_AUTO_SEARCH_MAX_AGE_DAYS = 1;
exports.MAX_AUTO_SEARCH_MAX_AGE_DAYS = 365;
/**
 * How far the interval is allowed to stretch as a request ages. It doubles for each week the
 * request has been waiting, so a daily search becomes weekly after three weeks and stops there:
 * past that the cap does the work the lifetime limit was going to do anyway.
 */
exports.AUTO_SEARCH_BACKOFF_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
exports.MAX_AUTO_SEARCH_BACKOFF_FACTOR = 8;

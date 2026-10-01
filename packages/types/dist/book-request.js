"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOK_REQUEST_BULK_LIMIT = exports.BOOK_REQUEST_SORT_DIRECTIONS = exports.BOOK_REQUEST_SORT_FIELDS = exports.BOOK_REQUEST_ACTION_ERROR_CODES = exports.BOOK_REQUEST_SUBMIT_ERROR_CODES = exports.BOOK_REQUEST_HANDBACK_CODES = exports.SETTLED_BOOK_REQUEST_STATUSES = exports.WORKER_WRITABLE_BOOK_REQUEST_STATUSES = exports.CANCELLABLE_BOOK_REQUEST_STATUSES = exports.FULFILLABLE_BOOK_REQUEST_STATUSES = exports.GRABBABLE_BOOK_REQUEST_STATUSES = exports.ACTIVE_BOOK_REQUEST_STATUSES = exports.BOOK_REQUEST_STATUSES = exports.MAX_TORRENT_FILE_BYTES = exports.MAX_BOOK_REQUEST_SEARCH_ISBNS = exports.BOOK_REQUEST_MEDIA_KINDS = void 0;
exports.normalizeWorkToken = normalizeWorkToken;
exports.bookRequestWorkKey = bookRequestWorkKey;
exports.isGrabbableBookRequestStatus = isGrabbableBookRequestStatus;
exports.isBookRequestFulfiller = isBookRequestFulfiller;
exports.isFulfillableBookRequestStatus = isFulfillableBookRequestStatus;
exports.isCancellableBookRequestStatus = isCancellableBookRequestStatus;
exports.isSettledBookRequestStatus = isSettledBookRequestStatus;
exports.bookRequestSubmitErrorCode = bookRequestSubmitErrorCode;
exports.bookRequestActionErrorCode = bookRequestActionErrorCode;
exports.normalizeBookRequestIsbn = normalizeBookRequestIsbn;
exports.isValidBookRequestIsbn10 = isValidBookRequestIsbn10;
exports.isValidBookRequestIsbn13 = isValidBookRequestIsbn13;
exports.bookRequestIsbn10To13 = bookRequestIsbn10To13;
exports.canonicalizeBookRequestIsbn = canonicalizeBookRequestIsbn;
const book_1 = require("./book");
exports.BOOK_REQUEST_MEDIA_KINDS = book_1.CONCRETE_BOOK_MEDIA_KINDS;
/** Bounds exact indexer passes before the title-and-author fallback. */
exports.MAX_BOOK_REQUEST_SEARCH_ISBNS = 8;
/**
 * A .torrent is a few kilobytes of metadata; anything larger is not one. Shared so the grab dialog
 * refuses a file before uploading it rather than learning the ceiling from a 400.
 */
exports.MAX_TORRENT_FILE_BYTES = 2 * 1024 * 1024;
exports.BOOK_REQUEST_STATUSES = [
    "pending",
    "approved",
    "rejected",
    "cancelled",
    "searching",
    "grabbed",
    "downloading",
    "importing",
    "needs_review",
    "available",
    "failed",
];
/**
 * Statuses that hold a claim on the requested work. A second request for the same work is
 * folded into the existing one while it is in one of these; once it leaves, the work can be
 * requested again (a rejected request may be re-argued, an available book may be removed).
 * Kept in sync with the partial unique index on `book_requests.dedupe_key`.
 */
exports.ACTIVE_BOOK_REQUEST_STATUSES = [
    "pending",
    "approved",
    "searching",
    "grabbed",
    "downloading",
    "importing",
    "needs_review",
];
/**
 * Grouping token for a title or an author name. Shared so the search list collapses exactly the
 * candidates the server would fold into one request, rather than approximating that rule twice.
 *
 * The allowlist is every Unicode letter and number rather than `a-z0-9`. An ASCII title tokenizes
 * identically either way; a Cyrillic, CJK, Greek or Arabic one used to lose every character and
 * come back empty, which on a multilingual app meant every non-Latin title of a medium shared one
 * key. Diacritics are still folded first, so "Les Misérables" and "les miserables" agree.
 */
function normalizeWorkToken(value) {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, "");
}
function fnv1a(value) {
    let hash = 0x811c9dc5;
    for (const char of value) {
        hash = Math.imul(hash ^ char.codePointAt(0), 0x01000193) >>> 0;
    }
    return hash.toString(16);
}
/**
 * A title no allowlist can tokenize - punctuation, symbols or emoji alone - hashed so it still
 * identifies itself.
 *
 * Rare, and the alternative is what makes it worth handling: a token that comes back empty either
 * collapses every such title onto one shared key, or leaves the work with no key at all. Both are
 * wrong in the same direction, and the second requester of the day pays for it.
 */
function rawTitleToken(title) {
    return `x${fnv1a(title.trim().toLowerCase())}`;
}
/**
 * The width of `book_requests.dedupe_key`. The submission DTO allows a 500-character title beside a
 * 255-character author, so an unbounded work key overflowed the column and reached the requester as
 * a Postgres 22001 dressed up as a 500.
 */
const MAX_DEDUPE_KEY = 500;
/** How much of one token a shortened work key spends, chosen so two of them plus the frame fit. */
const MAX_WORK_KEY_TOKEN = 160;
/**
 * Truncated with the full token's hash appended rather than simply cut. Two long titles sharing
 * their first hundred and sixty characters - a series with a common prefix, a subtitle-heavy
 * edition - would otherwise collapse onto one key, and dedupe would fold two different books into
 * one request. `~` cannot appear in a token, so a shortened key can never collide with a whole one.
 */
function boundToken(token) {
    return token.length <= MAX_WORK_KEY_TOKEN ? token : `${token.slice(0, MAX_WORK_KEY_TOKEN)}~${fnv1a(token)}`;
}
/**
 * The key two records share when they describe the same work in the same medium.
 *
 * Shortened only when the whole key would not fit the column, rather than at a fixed token width.
 * A stored key is only useful while the probe still computes it: shortening one that already fits
 * would change what every existing request of a long-titled work is filed under, and the next
 * person to ask for that book would open a second request instead of joining theirs.
 */
function bookRequestWorkKey(title, author, mediaKind) {
    const titleToken = normalizeWorkToken(title) || rawTitleToken(title);
    const authorToken = normalizeWorkToken(author ?? "");
    const key = `work:${titleToken}:${authorToken}:${mediaKind}`;
    if (key.length <= MAX_DEDUPE_KEY)
        return key;
    return `work:${boundToken(titleToken)}:${boundToken(authorToken)}:${mediaKind}`;
}
/**
 * Statuses a release may be grabbed from. `failed` is included so a bad release can be replaced
 * without re-approving. Shared so a card cannot offer a button the grab endpoint would refuse.
 */
exports.GRABBABLE_BOOK_REQUEST_STATUSES = ["approved", "searching", "failed"];
function isGrabbableBookRequestStatus(status) {
    return exports.GRABBABLE_BOOK_REQUEST_STATUSES.includes(status);
}
/**
 * Whether one person is the one a request is theirs to fulfil.
 *
 * Usually the requester, because a self-serve row is created by the person about to fulfil it.
 * Not always: one live request per work, so a self-fulfiller whose submission collides with
 * somebody else's undriven request takes that row on rather than opening a second one, and
 * `fulfillerUserId` records that it is now theirs. Null means nobody took it on, and the
 * requester is the fulfiller by construction - which is also every row created before the
 * column existed.
 *
 * Shared so the UI cannot offer an action `assertCanFulfil` would refuse, and holds no permission
 * check: the caller still needs `book_request_self_fulfill`, or to be moderating the queue.
 */
function isBookRequestFulfiller(request, userId) {
    if (userId === null || userId === undefined)
        return false;
    return (request.fulfillerUserId ?? request.userId) === userId;
}
/** Statuses an approver may close by pointing at a book or Book Dock file. */
exports.FULFILLABLE_BOOK_REQUEST_STATUSES = [
    "pending",
    "approved",
    "searching",
    "grabbed",
    "downloading",
    "importing",
    "needs_review",
    "failed",
];
function isFulfillableBookRequestStatus(status) {
    return exports.FULFILLABLE_BOOK_REQUEST_STATUSES.includes(status);
}
/**
 * Statuses a request can still be walked back from: everything that has not settled. Stopping a
 * grab mid-flight is the only exit a request that stalled in `downloading` or `needs_review` ever
 * gets, so the list is deliberately wider than the pending-or-approved pair it started as.
 */
exports.CANCELLABLE_BOOK_REQUEST_STATUSES = [
    "pending",
    "approved",
    "searching",
    "grabbed",
    "downloading",
    "importing",
    "needs_review",
    "failed",
];
function isCancellableBookRequestStatus(status) {
    return exports.CANCELLABLE_BOOK_REQUEST_STATUSES.includes(status);
}
/**
 * Statuses background fulfilment work may still write to. The three that are missing are the
 * decisions a person made and expects to stand: a poll that was already in flight, an import that
 * was already extracting or a watchdog sweep must not drag a cancelled, rejected or already-filed
 * request back into the pipeline.
 */
exports.WORKER_WRITABLE_BOOK_REQUEST_STATUSES = [
    "pending",
    "approved",
    "searching",
    "grabbed",
    "downloading",
    "importing",
    "needs_review",
    "failed",
];
/**
 * Statuses nothing is still working on, which is what makes hiding or deleting one safe. `failed`
 * is both settled and cancellable on purpose: it can be retried, given up on, or tidied away.
 */
exports.SETTLED_BOOK_REQUEST_STATUSES = ["rejected", "cancelled", "available", "failed"];
function isSettledBookRequestStatus(status) {
    return exports.SETTLED_BOOK_REQUEST_STATUSES.includes(status);
}
/**
 * Why automation handed a request back to a person, as a stable value rather than as the prose
 * that accompanies it. The prose is written in English at the point of failure and stays as the
 * fallback for the reasons nothing has classified; the code is what the UI translates.
 *
 * Parameters live in `failureMeta` rather than being interpolated into the code, so a translator
 * can put the number wherever their language wants it.
 */
exports.BOOK_REQUEST_HANDBACK_CODES = [
    /** Automatic grabbing is switched off, so nothing was ever going to look for a release. */
    "AUTOMATION_DISABLED",
    /** The request has nowhere to file a book, which grab refuses before downloading anything. */
    "NO_DESTINATION",
    /** The per-request budget of automated attempts is spent. Carries `attempts`. */
    "ATTEMPT_LIMIT",
    /** The indexer search itself failed rather than coming back empty. Carries `detail`. */
    "SEARCH_FAILED",
    /**
     * Nothing was searched, because no indexer is configured at all. Kept apart from the two states
     * below it: the score floor and the profile are both answers about releases, and reporting one
     * of those for a search that never ran sends the operator to tune a number that had no bearing
     * on anything.
     */
    "NO_SOURCES_CONFIGURED",
    /** Nothing was searched, because every configured indexer is switched off. A toggle away. */
    "NO_SOURCES_ENABLED",
    /** Indexers are enabled, but not one of them carries the requested medium. */
    "MEDIUM_UNCOVERED",
    /** A release profile is active for this medium and nothing the search returned fell in a tier. */
    "PROFILE_EXCLUDED_ALL",
    /** Everything good enough has already been tried for this request. */
    "ALL_TRIED",
    /** Nothing cleared the operator's score floor. Carries `floor`. */
    "BELOW_SCORE_FLOOR",
    /** Everything good enough was ruled out by an earlier refusal in the same pass. */
    "ALL_BLOCKED",
    /**
     * Not automation at all: a self-serve request whose picker was opened and never acted on. Swept
     * so it stops holding the dedupe claim on a work nobody is actually fetching.
     */
    "ABANDONED",
];
/**
 * Why a submission was turned down, as a stable value rather than as the sentence beside it.
 *
 * Every refusal the submit endpoint raises is copy this application wrote about a rule this
 * instance applies, so a client that can only repeat the English is a client that cannot
 * translate any of them. A refusal that originates outside - a tracker saying no - deliberately
 * carries no code, because there is nothing to translate there either.
 *
 * Parameters live in `errorMeta` for the same reason handback parameters live in `failureMeta`:
 * a translator has to be able to put the number where their language wants it.
 */
exports.BOOK_REQUEST_SUBMIT_ERROR_CODES = [
    /** The title was blank once trimmed, so there is no work to ask for. */
    "SUBMIT_TITLE_REQUIRED",
    /** Self-fulfilment was asked for by somebody who does not hold the permission. */
    "SUBMIT_SELF_FULFIL_FORBIDDEN",
    /** The requester named a destination library they cannot reach. */
    "SUBMIT_LIBRARY_FORBIDDEN",
    /** A folder was named with no library for it to sit in. */
    "SUBMIT_FOLDER_NEEDS_LIBRARY",
    /** The named folder belongs to some other library than the named destination. */
    "SUBMIT_FOLDER_NOT_IN_LIBRARY",
    /** A self-server fell through to an instance default they cannot reach. */
    "SUBMIT_DEFAULT_LIBRARY_UNREACHABLE",
    /** Nobody decides on this request later, so it needs a destination now. */
    "SUBMIT_DESTINATION_REQUIRED",
    /** The cap on self-serve downloads in flight is full. Carries `limit`. */
    "SUBMIT_SELF_SERVE_LIMIT",
    /** Somebody else was named as the requester by a caller who may not file on their behalf. */
    "SUBMIT_ON_BEHALF_FORBIDDEN",
    /** The named requester does not exist, or is not an account that could file this itself. */
    "SUBMIT_ON_BEHALF_UNKNOWN_USER",
];
/** The code a submission was refused with, where it carried one. Null is "we do not know". */
function bookRequestSubmitErrorCode(value) {
    return typeof value === "string" && exports.BOOK_REQUEST_SUBMIT_ERROR_CODES.includes(value)
        ? value
        : null;
}
/** Stable reasons an action against an existing request was refused. */
exports.BOOK_REQUEST_ACTION_ERROR_CODES = [
    /** Approve and reject only apply while a request is pending. Carries `action` and `status`. */
    "BOOK_REQUEST_NOT_PENDING",
    /** The request has already reached a state that cannot be cancelled. Carries `status`. */
    "BOOK_REQUEST_NOT_CANCELLABLE",
    /** Approval cannot continue until a destination library is selected. */
    "BOOK_REQUEST_DESTINATION_REQUIRED",
    /** The caller is not allowed to perform the named lifecycle action. Carries `action`. */
    "BOOK_REQUEST_ACTION_FORBIDDEN",
    /** Another transition committed after the action read the row. Carries `action` and `status`. */
    "BOOK_REQUEST_STALE_TRANSITION",
];
function bookRequestActionErrorCode(value) {
    return typeof value === "string" && exports.BOOK_REQUEST_ACTION_ERROR_CODES.includes(value)
        ? value
        : null;
}
function normalizeBookRequestIsbn(value) {
    const normalized = (value ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
    return normalized || null;
}
function isValidBookRequestIsbn10(value) {
    if (!/^\d{9}[\dX]$/.test(value))
        return false;
    let sum = 0;
    for (let index = 0; index < 10; index += 1) {
        const digit = index === 9 && value[index] === "X" ? 10 : Number(value[index]);
        sum += digit * (10 - index);
    }
    return sum % 11 === 0;
}
function isValidBookRequestIsbn13(value) {
    if (!/^\d{13}$/.test(value) || (!value.startsWith("978") && !value.startsWith("979")))
        return false;
    let sum = 0;
    for (let index = 0; index < 13; index += 1) {
        sum += Number(value[index]) * (index % 2 === 0 ? 1 : 3);
    }
    return sum % 10 === 0;
}
function bookRequestIsbn10To13(value) {
    const body = `978${value.slice(0, 9)}`;
    let sum = 0;
    for (let index = 0; index < body.length; index += 1) {
        sum += Number(body[index]) * (index % 2 === 0 ? 1 : 3);
    }
    return `${body}${(10 - (sum % 10)) % 10}`;
}
/** Canonical ISBN-13, including a converted ISBN-10 where that is the only valid identifier. */
function canonicalizeBookRequestIsbn(isbn10, isbn13) {
    const normalized13 = normalizeBookRequestIsbn(isbn13);
    if (normalized13 && isValidBookRequestIsbn13(normalized13))
        return normalized13;
    const normalized10 = normalizeBookRequestIsbn(isbn10);
    if (normalized10 && isValidBookRequestIsbn10(normalized10))
        return bookRequestIsbn10To13(normalized10);
    return null;
}
/**
 * Columns the request list can be ordered by. Shared so the table cannot offer a sort the query
 * does not know how to build, and so a rename breaks the client at compile time.
 */
exports.BOOK_REQUEST_SORT_FIELDS = ["createdAt", "title", "mediaKind", "requester", "status"];
exports.BOOK_REQUEST_SORT_DIRECTIONS = ["asc", "desc"];
/** One page of the queue is the most a selection can hold, so the batch stays bounded. */
exports.BOOK_REQUEST_BULK_LIMIT = 100;

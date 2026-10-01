import { type ConcreteBookMediaKind } from "./book";
import type { BookRequestDownloadItem } from "./download-client";
export declare const BOOK_REQUEST_MEDIA_KINDS: readonly ["ebook", "audiobook", "comic"];
export type BookRequestMediaKind = ConcreteBookMediaKind;
/** Bounds exact indexer passes before the title-and-author fallback. */
export declare const MAX_BOOK_REQUEST_SEARCH_ISBNS = 8;
/**
 * A .torrent is a few kilobytes of metadata; anything larger is not one. Shared so the grab dialog
 * refuses a file before uploading it rather than learning the ceiling from a 400.
 */
export declare const MAX_TORRENT_FILE_BYTES: number;
export declare const BOOK_REQUEST_STATUSES: readonly ["pending", "approved", "rejected", "cancelled", "searching", "grabbed", "downloading", "importing", "needs_review", "available", "failed"];
export type BookRequestStatus = (typeof BOOK_REQUEST_STATUSES)[number];
/**
 * Statuses that hold a claim on the requested work. A second request for the same work is
 * folded into the existing one while it is in one of these; once it leaves, the work can be
 * requested again (a rejected request may be re-argued, an available book may be removed).
 * Kept in sync with the partial unique index on `book_requests.dedupe_key`.
 */
export declare const ACTIVE_BOOK_REQUEST_STATUSES: readonly BookRequestStatus[];
/**
 * Grouping token for a title or an author name. Shared so the search list collapses exactly the
 * candidates the server would fold into one request, rather than approximating that rule twice.
 *
 * The allowlist is every Unicode letter and number rather than `a-z0-9`. An ASCII title tokenizes
 * identically either way; a Cyrillic, CJK, Greek or Arabic one used to lose every character and
 * come back empty, which on a multilingual app meant every non-Latin title of a medium shared one
 * key. Diacritics are still folded first, so "Les Misérables" and "les miserables" agree.
 */
export declare function normalizeWorkToken(value: string): string;
/**
 * The key two records share when they describe the same work in the same medium.
 *
 * Shortened only when the whole key would not fit the column, rather than at a fixed token width.
 * A stored key is only useful while the probe still computes it: shortening one that already fits
 * would change what every existing request of a long-titled work is filed under, and the next
 * person to ask for that book would open a second request instead of joining theirs.
 */
export declare function bookRequestWorkKey(title: string, author: string | null | undefined, mediaKind: BookRequestMediaKind): string;
/**
 * Statuses a release may be grabbed from. `failed` is included so a bad release can be replaced
 * without re-approving. Shared so a card cannot offer a button the grab endpoint would refuse.
 */
export declare const GRABBABLE_BOOK_REQUEST_STATUSES: readonly BookRequestStatus[];
export declare function isGrabbableBookRequestStatus(status: BookRequestStatus): boolean;
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
export declare function isBookRequestFulfiller(request: Pick<BookRequestItem, "userId" | "fulfillerUserId">, userId: number | null | undefined): boolean;
/** Statuses an approver may close by pointing at a book or Book Dock file. */
export declare const FULFILLABLE_BOOK_REQUEST_STATUSES: readonly BookRequestStatus[];
export declare function isFulfillableBookRequestStatus(status: BookRequestStatus): boolean;
/**
 * Statuses a request can still be walked back from: everything that has not settled. Stopping a
 * grab mid-flight is the only exit a request that stalled in `downloading` or `needs_review` ever
 * gets, so the list is deliberately wider than the pending-or-approved pair it started as.
 */
export declare const CANCELLABLE_BOOK_REQUEST_STATUSES: readonly BookRequestStatus[];
export declare function isCancellableBookRequestStatus(status: BookRequestStatus): boolean;
/**
 * Statuses background fulfilment work may still write to. The three that are missing are the
 * decisions a person made and expects to stand: a poll that was already in flight, an import that
 * was already extracting or a watchdog sweep must not drag a cancelled, rejected or already-filed
 * request back into the pipeline.
 */
export declare const WORKER_WRITABLE_BOOK_REQUEST_STATUSES: readonly BookRequestStatus[];
/**
 * Statuses nothing is still working on, which is what makes hiding or deleting one safe. `failed`
 * is both settled and cancellable on purpose: it can be retried, given up on, or tidied away.
 */
export declare const SETTLED_BOOK_REQUEST_STATUSES: readonly BookRequestStatus[];
export declare function isSettledBookRequestStatus(status: BookRequestStatus): boolean;
/**
 * Why automation handed a request back to a person, as a stable value rather than as the prose
 * that accompanies it. The prose is written in English at the point of failure and stays as the
 * fallback for the reasons nothing has classified; the code is what the UI translates.
 *
 * Parameters live in `failureMeta` rather than being interpolated into the code, so a translator
 * can put the number wherever their language wants it.
 */
export declare const BOOK_REQUEST_HANDBACK_CODES: readonly ["AUTOMATION_DISABLED", "NO_DESTINATION", "ATTEMPT_LIMIT", "SEARCH_FAILED", "NO_SOURCES_CONFIGURED", "NO_SOURCES_ENABLED", "MEDIUM_UNCOVERED", "PROFILE_EXCLUDED_ALL", "ALL_TRIED", "BELOW_SCORE_FLOOR", "ALL_BLOCKED", "ABANDONED"];
export type BookRequestHandbackCode = (typeof BOOK_REQUEST_HANDBACK_CODES)[number];
/** Values a handback message interpolates. Deliberately flat: these are message parameters. */
export type BookRequestFailureMeta = Record<string, string | number>;
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
export declare const BOOK_REQUEST_SUBMIT_ERROR_CODES: readonly ["SUBMIT_TITLE_REQUIRED", "SUBMIT_SELF_FULFIL_FORBIDDEN", "SUBMIT_LIBRARY_FORBIDDEN", "SUBMIT_FOLDER_NEEDS_LIBRARY", "SUBMIT_FOLDER_NOT_IN_LIBRARY", "SUBMIT_DEFAULT_LIBRARY_UNREACHABLE", "SUBMIT_DESTINATION_REQUIRED", "SUBMIT_SELF_SERVE_LIMIT", "SUBMIT_ON_BEHALF_FORBIDDEN", "SUBMIT_ON_BEHALF_UNKNOWN_USER"];
export type BookRequestSubmitErrorCode = (typeof BOOK_REQUEST_SUBMIT_ERROR_CODES)[number];
/** The code a submission was refused with, where it carried one. Null is "we do not know". */
export declare function bookRequestSubmitErrorCode(value: unknown): BookRequestSubmitErrorCode | null;
/** Stable reasons an action against an existing request was refused. */
export declare const BOOK_REQUEST_ACTION_ERROR_CODES: readonly ["BOOK_REQUEST_NOT_PENDING", "BOOK_REQUEST_NOT_CANCELLABLE", "BOOK_REQUEST_DESTINATION_REQUIRED", "BOOK_REQUEST_ACTION_FORBIDDEN", "BOOK_REQUEST_STALE_TRANSITION"];
export type BookRequestActionErrorCode = (typeof BOOK_REQUEST_ACTION_ERROR_CODES)[number];
export declare function bookRequestActionErrorCode(value: unknown): BookRequestActionErrorCode | null;
/** One metadata record that contributed to a grouped work result. */
export interface BookRequestMetadataSource {
    providerKey: string;
    providerId: string;
    providerLabel: string;
    isbn10: string | null;
    isbn13: string | null;
}
export declare function normalizeBookRequestIsbn(value: string | null | undefined): string | null;
export declare function isValidBookRequestIsbn10(value: string): boolean;
export declare function isValidBookRequestIsbn13(value: string): boolean;
export declare function bookRequestIsbn10To13(value: string): string;
/** Canonical ISBN-13, including a converted ISBN-10 where that is the only valid identifier. */
export declare function canonicalizeBookRequestIsbn(isbn10: string | null | undefined, isbn13: string | null | undefined): string | null;
/** The work as it looked at request time, so the request stays readable if the provider moves on. */
export interface BookRequestWorkSnapshot {
    title: string;
    subtitle: string | null;
    authors: string[];
    seriesName: string | null;
    seriesIndex: number | null;
    isbn10: string | null;
    isbn13: string | null;
    publishedYear: number | null;
    language: string | null;
    coverUrl: string | null;
    providerKey: string | null;
    providerId: string | null;
    metadataSources: BookRequestMetadataSource[];
}
export interface BookRequestSubscriber {
    userId: number;
    username: string;
    name: string;
}
export interface BookRequestItem extends BookRequestWorkSnapshot {
    id: number;
    userId: number;
    requesterUsername: string;
    requesterName: string;
    mediaKind: BookRequestMediaKind;
    status: BookRequestStatus;
    preferredFormats: string[];
    note: string | null;
    targetLibraryId: number | null;
    targetLibraryName: string | null;
    targetFolderId: number | null;
    decidedByUserId: number | null;
    decidedByUsername: string | null;
    decidedAt: string | null;
    decisionNote: string | null;
    matchedBookId: number | null;
    bookDockFileId: number | null;
    /**
     * Created by somebody fulfilling it themselves rather than asking for it. Badged in the
     * moderation queue, and never waiting on a decision.
     */
    selfServe: boolean;
    /**
     * Who may drive fulfilment when that is not the requester, which happens when a self-fulfiller's
     * own submission collides with somebody else's undriven request and they take it on. Null
     * everywhere else, including on a self-serve row whose requester is its own fulfiller.
     */
    fulfillerUserId: number | null;
    statusReason: string | null;
    /**
     * Set only where a failure has been classified, which today means automation handing a request
     * back. Null elsewhere, and the UI falls back to `statusReason` when it is.
     */
    failureCode: BookRequestHandbackCode | null;
    failureMeta: BookRequestFailureMeta | null;
    subscribers: BookRequestSubscriber[];
    /** The most recent grab attempt, so a card can show live progress. Null before the first grab. */
    download: BookRequestDownloadItem | null;
    /** Whether the signed-in user has hidden this from their own list. Never shared between users. */
    dismissed: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface BookRequestPage {
    items: BookRequestItem[];
    total: number;
}
export interface BookRequestRequesterOption {
    userId: number;
    username: string;
    name: string;
}
export interface CreateBookRequestPayload extends Partial<BookRequestWorkSnapshot> {
    title: string;
    mediaKind: BookRequestMediaKind;
    targetLibraryId?: number | null;
    targetFolderId?: number | null;
    preferredFormats?: string[];
    note?: string | null;
    /**
     * Fulfil this one yourself instead of queueing it. Refused server-side without
     * `book_request_self_fulfill`, and never inferred from the permission.
     */
    selfServe?: boolean;
    /**
     * File this on somebody else's behalf. Refused without `manage_book_requests`, and every rule
     * the submission applies then reads from the subject rather than the caller. Omitted is the
     * ordinary case: the caller is the requester.
     */
    userId?: number;
}
/**
 * What submitting answers with. `subscribed` is the whole reason this is not just the request:
 * one live request per work, so a submission for a work somebody already asked for attaches the
 * caller to that row rather than opening a second, and the form says something different for each.
 */
export interface BookRequestSubmitResult {
    request: BookRequestItem;
    /** True when the work was already requested and the caller was attached to it instead. */
    subscribed: boolean;
}
export interface DecideBookRequestPayload {
    decisionNote?: string | null;
    /** Approver may reroute the request to a different library than the requester picked. */
    targetLibraryId?: number | null;
    targetFolderId?: number | null;
}
export interface FulfillBookRequestPayload {
    bookDockFileId?: number | null;
    matchedBookId?: number | null;
    note?: string | null;
}
/**
 * What the request UI needs to annotate a metadata search result before anything is submitted:
 * whether the library already has it, and whether someone already asked for it.
 */
export interface BookRequestAvailabilityQuery {
    isbn13?: string | null;
    title: string;
    author?: string | null;
    mediaKind: BookRequestMediaKind;
    providerKey?: string | null;
    providerId?: string | null;
}
export interface BookRequestAvailability {
    ownedBookId: number | null;
    existingRequestId: number | null;
    existingRequestStatus: BookRequestStatus | null;
    /** True when the signed-in user is the requester or already a subscriber on that request. */
    alreadySubscribed: boolean;
}
export interface BookRequestSummary {
    pending: number;
    active: number;
    mine: number;
    /** Unfiltered, non-dismissed totals for the request-page tabs. */
    mineTotal: number;
    allTotal: number;
}
/**
 * Columns the request list can be ordered by. Shared so the table cannot offer a sort the query
 * does not know how to build, and so a rename breaks the client at compile time.
 */
export declare const BOOK_REQUEST_SORT_FIELDS: readonly ["createdAt", "title", "mediaKind", "requester", "status"];
export type BookRequestSortField = (typeof BOOK_REQUEST_SORT_FIELDS)[number];
export declare const BOOK_REQUEST_SORT_DIRECTIONS: readonly ["asc", "desc"];
export type BookRequestSortDirection = (typeof BOOK_REQUEST_SORT_DIRECTIONS)[number];
/** One page of the queue is the most a selection can hold, so the batch stays bounded. */
export declare const BOOK_REQUEST_BULK_LIMIT = 100;
export interface BulkBookRequestsPayload {
    ids: number[];
}
/**
 * The one bulk action that carries more than ids. A rejection is a sentence to the people who
 * asked, and refusing forty requests for the same reason is exactly when writing it forty times
 * is the wrong shape.
 */
export interface BulkRejectBookRequestsPayload extends BulkBookRequestsPayload {
    decisionNote?: string | null;
}
export interface BookRequestBulkFailure {
    id: number;
    /** Named rather than numbered, because the message that carries this is read by a person. */
    title: string;
    reason: string;
    errorCode: BookRequestActionErrorCode | BookRequestSubmitErrorCode | null;
    errorMeta: BookRequestFailureMeta | null;
}
/**
 * A bulk action is not atomic. One request may have no destination library while the rest are
 * fine, and failing the whole batch over it would be worse than reporting it, so every id comes
 * back in exactly one of the two lists.
 */
export interface BookRequestBulkResult {
    updated: BookRequestItem[];
    failed: BookRequestBulkFailure[];
}
//# sourceMappingURL=book-request.d.ts.map
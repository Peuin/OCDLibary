import { type BookRequestMediaKind } from "./book-request";
import { type RequestDestinationDefaults } from "./book-request-destination";
import { type ReleaseProfiles } from "./book-request-profile";
/**
 * Instance-level automation for book requests: whether BookOrbit may grab a release without an
 * approver looking at the list, how good that release has to be, how many times it may try again
 * after a failure, and how close an imported file has to be to the request before it is filed.
 *
 * Stored as individual `app_settings` rows rather than one JSON blob, so a single knob can be
 * changed without a read-modify-write over the others.
 */
export declare const BOOK_REQUEST_AUTOMATION_SETTING_KEYS: {
    readonly AUTO_GRAB_ENABLED: "book_request_auto_grab_enabled";
    readonly AUTO_GRAB_MIN_SCORE: "book_request_auto_grab_min_score";
    readonly AUTO_RETRY_ENABLED: "book_request_auto_retry_enabled";
    readonly MAX_AUTO_GRAB_ATTEMPTS: "book_request_max_auto_grab_attempts";
    readonly VERIFICATION_ENABLED: "book_request_verification_enabled";
    readonly VERIFICATION_THRESHOLD: "book_request_verification_threshold";
    readonly IMPORT_FORMATS: "book_request_import_formats";
    readonly AUTO_SEARCH_ENABLED: "book_request_auto_search_enabled";
    readonly AUTO_SEARCH_INTERVAL_HOURS: "book_request_auto_search_interval_hours";
    readonly AUTO_SEARCH_MAX_AGE_DAYS: "book_request_auto_search_max_age_days";
};
/**
 * The instance default destination for one medium, as two flat rows rather than a JSON blob, so
 * the destinations follow the same one-row-per-knob rule as the settings above.
 *
 * Derived from the medium rather than spelled out three times: `BOOK_REQUEST_MEDIA_KINDS` is what
 * decides how many there are, and a medium added later should not need six more literals here.
 */
export declare function bookRequestDefaultLibraryKey(mediaKind: BookRequestMediaKind): string;
export declare function bookRequestDefaultFolderKey(mediaKind: BookRequestMediaKind): string;
export declare const BOOK_REQUEST_DESTINATION_SETTING_KEYS: string[];
/**
 * The release profile for one medium, as a single JSON row.
 *
 * This is the one deliberate exception to the one-row-per-knob rule above. A tier list is one
 * value: reordering it or editing a condition rewrites the whole list either way, so splitting it
 * across rows would buy nothing and cost the ordering guarantee that makes a profile mean anything.
 */
export declare function bookRequestReleaseProfileKey(mediaKind: BookRequestMediaKind): string;
export declare const BOOK_REQUEST_PROFILE_SETTING_KEYS: string[];
export declare const BOOK_REQUEST_IMPORT_FORMATS: readonly ["all", "preferred"];
export type BookRequestImportFormats = (typeof BOOK_REQUEST_IMPORT_FORMATS)[number];
export interface BookRequestAutomationSettings {
    /**
     * Off by default, and deliberately so: book matching is hard enough that the approver picks the
     * release until an operator says otherwise.
     */
    autoGrabEnabled: boolean;
    /** A release scoring below this is never grabbed unattended; the approver still sees the list. */
    autoGrabMinScore: number;
    /** Whether a failed automatic grab falls back to the next-best release on its own. */
    autoRetryEnabled: boolean;
    /** Total automatic grabs allowed per request, first attempt included. */
    maxAutoGrabAttempts: number;
    /**
     * Whether an approved request nothing could be found for is searched for again later.
     *
     * Without it a request is looked for exactly once. A book declined for want of a good enough
     * release, or one whose first release is posted next month, then sits at `approved` forever
     * unless a person reopens the picker for it - which is the one hole the whole pipeline has no
     * other answer to.
     *
     * A separate flag rather than an interval of zero, so switching it off and on again does not
     * lose the interval the operator tuned. Does nothing while `autoGrabEnabled` is off: there is
     * nothing for an unattended search to do with what it finds.
     */
    autoSearchEnabled: boolean;
    /**
     * How long after its last attempt an unfulfilled request is searched for again.
     *
     * The base interval rather than the whole rule: a request that has been waiting weeks is searched
     * progressively less often, so a long backlog does not turn into daily traffic against every
     * tracker forever.
     */
    autoSearchIntervalHours: number;
    /** How long a request keeps being searched for before it is left to a person. */
    autoSearchMaxAgeDays: number;
    /**
     * Whether an imported file is checked against the request before it is filed. On, a poor match
     * waits in the Book Dock for a human. Off, whatever was downloaded goes straight into the target
     * library: no wait, and no guard against a mislabelled release landing there unnoticed.
     *
     * A separate flag rather than a threshold of zero, so turning the check off and on again does
     * not lose the threshold the operator tuned.
     */
    verificationEnabled: boolean;
    /** Below this, an imported file is held in the Book Dock for review instead of being filed. */
    verificationThreshold: number;
    /**
     * What to keep when a release carries the same book in several formats.
     *
     * `all` keeps every format, which in a one-book-per-folder library is one book with several
     * files and in a one-book-per-file library is one book per format, that mode's normal state
     * rather than a duplicate. `preferred` keeps only the highest-priority format for the target
     * library.
     *
     * Never applies to a multipart audiobook: its parts are one book, not competing editions.
     */
    importFormats: BookRequestImportFormats;
    /**
     * Where a request goes when nobody picked anywhere: per medium, so audiobooks need not land in
     * the library the ebooks do.
     *
     * The lowest rung of the ladder, under the requester's own pinned destination and under an
     * explicit choice at request or approval time. Without it a request that names no library can
     * never be approved and is never grabbed unattended, which is what made auto-approval unusable
     * for anyone who left the picker alone.
     */
    destinations: RequestDestinationDefaults;
    /**
     * The edition an operator wants, per medium, as an ordered tier list. An empty list is the
     * ordinary state and means no profile: the tier axis disengages entirely and auto-grab is
     * decided by score alone, exactly as it was before profiles existed.
     */
    profiles: ReleaseProfiles;
}
export declare const DEFAULT_BOOK_REQUEST_AUTOMATION_SETTINGS: BookRequestAutomationSettings;
/**
 * A floor this low would grab almost anything the scorer did not hard-filter, which is not a
 * setting so much as a way to fill a library with the wrong books.
 */
export declare const MIN_AUTO_GRAB_SCORE_FLOOR = 50;
export declare const MAX_AUTO_GRAB_ATTEMPTS_LIMIT = 10;
/**
 * An hour is already often for a book that did not exist an hour ago, and a week is the point past
 * which "keep looking" stops meaning anything.
 */
export declare const MIN_AUTO_SEARCH_INTERVAL_HOURS = 1;
export declare const MAX_AUTO_SEARCH_INTERVAL_HOURS = 168;
export declare const MIN_AUTO_SEARCH_MAX_AGE_DAYS = 1;
export declare const MAX_AUTO_SEARCH_MAX_AGE_DAYS = 365;
/**
 * How far the interval is allowed to stretch as a request ages. It doubles for each week the
 * request has been waiting, so a daily search becomes weekly after three weeks and stops there:
 * past that the cap does the work the lifetime limit was going to do anyway.
 */
export declare const AUTO_SEARCH_BACKOFF_WEEK_MS: number;
export declare const MAX_AUTO_SEARCH_BACKOFF_FACTOR = 8;
/**
 * Destinations are partial a second time over: one medium can be changed without resending the
 * other two, matching how every scalar knob above is sent on its own.
 */
export type UpdateBookRequestAutomationSettingsPayload = Partial<Omit<BookRequestAutomationSettings, "destinations" | "profiles">> & {
    destinations?: Partial<RequestDestinationDefaults>;
    /** Partial for the same reason destinations are: one medium's list can be saved on its own. */
    profiles?: Partial<ReleaseProfiles>;
};
//# sourceMappingURL=book-request-automation.d.ts.map
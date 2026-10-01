import { type BookRequestMediaKind } from "./book-request";
/**
 * Release profiles: the edition an operator wants, expressed once, so a release can be grabbed
 * without a person looking at the list.
 *
 * A profile is an ORDERED list of tiers, best first. The first tier a release matches is its tier,
 * and that tier is a **separate axis from the release score**, never folded into it. Auto-grab
 * takes the highest tier that has any candidate and then the best score within it. Folding tier
 * points into the score was considered and rejected: enough points to make a format preference
 * meaningful is also enough to outrank a genuine title-match difference, which is exactly what the
 * 55-point match weight exists to prevent.
 *
 * A release matching no tier keeps `tier: null`. It stays visible in the picker, sorted last, and
 * a person may still pick it; the automation refuses it and hands the request back.
 */
/** Whether a release is one book file or several. Named because the picker facets on it too. */
export type ReleaseFileLayout = "single" | "multi";
/**
 * How many entries a release may carry and still be **one book file**.
 *
 * The count a search returns is every entry in the torrent: the book, its `.cue`, its cover art,
 * its `.nfo`. So an exact test for one file matches almost nothing real - testing `=== 1` made
 * "single file" match no MyAnonaMouse release at all, including `Shroud.m4b` shipped beside a cue,
 * a jpg and an nfo, which is four entries and one book.
 *
 * Five is where observed packaging tops out (book, cue, artwork, nfo, and one spare). It is a
 * threshold, not a fact: this cannot be answered exactly from a search, because the count of
 * *content* files lives only in the manifest and reading that costs a credentialed fetch per
 * release, which is why inspection is on demand. A five-part audiobook therefore reads as single
 * here, and a single book wrapped in six sidecars reads as multi.
 */
export declare const SINGLE_FILE_MAX_ENTRIES = 5;
/**
 * Which layout a release has, or null where the source stated no count at all. Shared so the
 * picker's facet and a tier's condition can never disagree about what "single" means.
 */
export declare function classifyFileLayout(fileCount: number | null): ReleaseFileLayout | null;
/** One axis a tier constrains. Every field is optional; an omitted field constrains nothing. */
export interface ReleaseTierConditions {
    /** Matches when the release carries ANY of these. Empty or absent matches every format. */
    formats?: string[];
    /** Whether the release is one file or several. Absent matches either. */
    fileLayout?: ReleaseFileLayout;
    /** Audio only, and only meaningful where the source published a bitrate. */
    minBitrateKbps?: number;
    /** Audio only. 1 for mono, 2 for stereo. */
    channels?: number;
    /** Matches when the release states ANY of these languages. */
    languages?: string[];
    /** Matches when the release came from ANY of these configured indexers. */
    indexerIds?: number[];
    minSeeders?: number;
    maxSizeBytes?: number;
    /** Only releases that cost no ratio. */
    freeleechOnly?: boolean;
    /** Excludes releases the source will refuse without a privileged account. */
    excludeVipOnly?: boolean;
}
export interface ReleaseTier {
    /** Stable across reorders, so a stored tier survives being dragged up the list. */
    id: string;
    /** The operator's own words, shown on the release row. Never translated. */
    name: string;
    conditions: ReleaseTierConditions;
}
/** One ordered tier list per medium. Empty means no profile, which disables the tier axis. */
export type ReleaseProfiles = Record<BookRequestMediaKind, ReleaseTier[]>;
export declare function emptyReleaseProfiles(): ReleaseProfiles;
/**
 * The release facts a tier is matched against. Structurally satisfied by `ReleaseCandidateItem`,
 * so the picker can show a tier without a second round trip and the server can evaluate the same
 * rules against its own candidate shape.
 */
export interface ReleaseTierInput {
    formats: string[];
    /** Null where the source reported no count, which must not be read as one file. */
    fileCount: number | null;
    audio: {
        bitrateKbps: number | null;
        channels: number | null;
    } | null;
    language: string | null;
    indexerId: number;
    freeleech: boolean;
    vipOnly: boolean;
    seeders: number | null;
    sizeBytes: number | null;
}
export type ReleaseProfileMismatchFailure = {
    code: "formatUnknown";
    expected: string[];
} | {
    code: "format";
    expected: string[];
    actual: string[];
} | {
    code: "fileLayoutUnknown";
    expected: ReleaseFileLayout;
} | {
    code: "fileLayout";
    expected: ReleaseFileLayout;
    actual: ReleaseFileLayout;
} | {
    code: "bitrate";
    expected: number;
    actual: number;
} | {
    code: "channels";
    expected: number;
    actual: number;
} | {
    code: "languageUnknown";
    expected: string[];
} | {
    code: "language";
    expected: string[];
    actual: string;
} | {
    code: "source";
} | {
    code: "seeders";
    expected: number;
    actual: number;
} | {
    code: "sizeUnknown";
    expected: number;
} | {
    code: "size";
    expected: number;
    actual: number;
} | {
    code: "freeleech";
} | {
    code: "vipOnly";
};
/** The nearest configured tier and the exact conditions that kept a release out of it. */
export interface ReleaseProfileMismatch {
    tier: number;
    /** Operator-authored text. Never translated. */
    tierName: string;
    failures: ReleaseProfileMismatchFailure[];
}
/**
 * Every condition a release fails in one tier. Kept alongside `releaseMatchesTier` so the reason
 * shown to an approver cannot drift from the rule automation enforces.
 */
export declare function releaseTierFailures(release: ReleaseTierInput, conditions: ReleaseTierConditions): ReleaseProfileMismatchFailure[];
/**
 * Whether one release satisfies every condition a tier states.
 *
 * Where the line falls on **unstated** facts depends on whether the source could reasonably have
 * published one, and the two cases are genuinely different:
 *
 * - **Bitrate and channels come from MediaInfo, which is optional per torrent and usually absent.**
 *   MyAnonaMouse returned `{}` for every release of three separate books, so a bitrate floor that
 *   excluded unmeasured releases excluded everything and made a profile unusable on that tracker.
 *   These conditions therefore reject only a value that was stated and fell short. A floor reads as
 *   "nothing measured below this", not "nothing unmeasured".
 * - **File count and size are properties of the torrent itself**, published wherever the source
 *   publishes anything, so silence there is a genuinely unknown release rather than an unmeasured
 *   one, and it does not satisfy a condition about it.
 *
 * Seeders sit with the first group for a different reason: a source with no swarm at all reports
 * null, and holding that against it would bar every direct download from every tier wanting seeds.
 */
export declare function releaseMatchesTier(release: ReleaseTierInput, conditions: ReleaseTierConditions): boolean;
/**
 * The tier needing the fewest changes for this release, with earlier tiers winning a tie. Null
 * means either no profile is configured or the release already matches a tier.
 */
export declare function explainReleaseProfileMismatch(release: ReleaseTierInput, tiers: readonly ReleaseTier[]): ReleaseProfileMismatch | null;
/**
 * The index of the first tier this release matches, or null for none.
 *
 * An empty tier list returns null for everything, which is what makes adopting this feature safe:
 * `releaseProfileIsActive` is false, the tier axis disengages, and auto-grab keeps behaving exactly
 * as it did before any profile existed.
 */
export declare function matchReleaseTier(release: ReleaseTierInput, tiers: readonly ReleaseTier[]): number | null;
/** Whether a medium has a profile at all. False means score alone decides, as it always did. */
export declare function releaseProfileIsActive(tiers: readonly ReleaseTier[] | undefined): boolean;
/**
 * Orders two releases the way the picker and the automation both must: by tier first, then by
 * whatever the caller was already comparing. Untiered sorts after every tier.
 *
 * Shared so the list an approver reads and the list the automation walks cannot disagree about
 * which release is best, which is the same reason `findGrabRefusal` is shared.
 */
export declare function compareByTier(a: number | null, b: number | null): number;
/** Bounds on a stored profile, enforced at the DTO and echoed in the settings form. */
export declare const MAX_RELEASE_TIERS = 12;
export declare const MAX_RELEASE_TIER_NAME_LENGTH = 60;
//# sourceMappingURL=book-request-profile.d.ts.map
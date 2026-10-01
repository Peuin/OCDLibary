"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_RELEASE_TIER_NAME_LENGTH = exports.MAX_RELEASE_TIERS = exports.SINGLE_FILE_MAX_ENTRIES = void 0;
exports.classifyFileLayout = classifyFileLayout;
exports.emptyReleaseProfiles = emptyReleaseProfiles;
exports.releaseTierFailures = releaseTierFailures;
exports.releaseMatchesTier = releaseMatchesTier;
exports.explainReleaseProfileMismatch = explainReleaseProfileMismatch;
exports.matchReleaseTier = matchReleaseTier;
exports.releaseProfileIsActive = releaseProfileIsActive;
exports.compareByTier = compareByTier;
const book_request_1 = require("./book-request");
const language_1 = require("./language");
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
exports.SINGLE_FILE_MAX_ENTRIES = 5;
/**
 * Which layout a release has, or null where the source stated no count at all. Shared so the
 * picker's facet and a tier's condition can never disagree about what "single" means.
 */
function classifyFileLayout(fileCount) {
    if (fileCount === null)
        return null;
    return fileCount <= exports.SINGLE_FILE_MAX_ENTRIES ? "single" : "multi";
}
function emptyReleaseProfiles() {
    return Object.fromEntries(book_request_1.BOOK_REQUEST_MEDIA_KINDS.map((kind) => [kind, []]));
}
/**
 * Every condition a release fails in one tier. Kept alongside `releaseMatchesTier` so the reason
 * shown to an approver cannot drift from the rule automation enforces.
 */
function releaseTierFailures(release, conditions) {
    const failures = [];
    const { formats, fileLayout, minBitrateKbps, channels, languages, indexerIds, minSeeders, maxSizeBytes } = conditions;
    if (formats && formats.length > 0) {
        const wanted = formats.map((format) => format.toLowerCase());
        if (release.formats.length === 0)
            failures.push({ code: "formatUnknown", expected: formats });
        else if (!release.formats.some((format) => wanted.includes(format.toLowerCase()))) {
            failures.push({ code: "format", expected: formats, actual: release.formats });
        }
    }
    if (fileLayout) {
        const actual = classifyFileLayout(release.fileCount);
        if (actual === null)
            failures.push({ code: "fileLayoutUnknown", expected: fileLayout });
        else if (actual !== fileLayout)
            failures.push({ code: "fileLayout", expected: fileLayout, actual });
    }
    if (minBitrateKbps !== undefined && release.audio?.bitrateKbps != null && release.audio.bitrateKbps < minBitrateKbps) {
        failures.push({ code: "bitrate", expected: minBitrateKbps, actual: release.audio.bitrateKbps });
    }
    if (channels !== undefined && release.audio?.channels != null && release.audio.channels !== channels) {
        failures.push({ code: "channels", expected: channels, actual: release.audio.channels });
    }
    if (languages && languages.length > 0) {
        if (!release.language)
            failures.push({ code: "languageUnknown", expected: languages });
        else {
            const stated = release.language;
            if (!languages.some((language) => (0, language_1.languagesAgree)(language, stated))) {
                failures.push({ code: "language", expected: languages, actual: stated });
            }
        }
    }
    if (indexerIds && indexerIds.length > 0 && !indexerIds.includes(release.indexerId))
        failures.push({ code: "source" });
    if (minSeeders !== undefined && release.seeders !== null && release.seeders < minSeeders) {
        failures.push({ code: "seeders", expected: minSeeders, actual: release.seeders });
    }
    if (maxSizeBytes !== undefined) {
        if (release.sizeBytes === null)
            failures.push({ code: "sizeUnknown", expected: maxSizeBytes });
        else if (release.sizeBytes > maxSizeBytes)
            failures.push({ code: "size", expected: maxSizeBytes, actual: release.sizeBytes });
    }
    if (conditions.freeleechOnly === true && !release.freeleech)
        failures.push({ code: "freeleech" });
    if (conditions.excludeVipOnly === true && release.vipOnly)
        failures.push({ code: "vipOnly" });
    return failures;
}
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
function releaseMatchesTier(release, conditions) {
    return releaseTierFailures(release, conditions).length === 0;
}
/**
 * The tier needing the fewest changes for this release, with earlier tiers winning a tie. Null
 * means either no profile is configured or the release already matches a tier.
 */
function explainReleaseProfileMismatch(release, tiers) {
    let closest = null;
    for (const [index, tier] of tiers.entries()) {
        const failures = releaseTierFailures(release, tier.conditions);
        if (failures.length === 0)
            return null;
        if (closest === null || failures.length < closest.failures.length) {
            closest = { tier: index, tierName: tier.name, failures };
        }
    }
    return closest;
}
/**
 * The index of the first tier this release matches, or null for none.
 *
 * An empty tier list returns null for everything, which is what makes adopting this feature safe:
 * `releaseProfileIsActive` is false, the tier axis disengages, and auto-grab keeps behaving exactly
 * as it did before any profile existed.
 */
function matchReleaseTier(release, tiers) {
    const index = tiers.findIndex((tier) => releaseMatchesTier(release, tier.conditions));
    return index === -1 ? null : index;
}
/** Whether a medium has a profile at all. False means score alone decides, as it always did. */
function releaseProfileIsActive(tiers) {
    return (tiers?.length ?? 0) > 0;
}
/**
 * Orders two releases the way the picker and the automation both must: by tier first, then by
 * whatever the caller was already comparing. Untiered sorts after every tier.
 *
 * Shared so the list an approver reads and the list the automation walks cannot disagree about
 * which release is best, which is the same reason `findGrabRefusal` is shared.
 */
function compareByTier(a, b) {
    if (a === b)
        return 0;
    if (a === null)
        return 1;
    if (b === null)
        return -1;
    return a - b;
}
/** Bounds on a stored profile, enforced at the DTO and echoed in the settings form. */
exports.MAX_RELEASE_TIERS = 12;
exports.MAX_RELEASE_TIER_NAME_LENGTH = 60;

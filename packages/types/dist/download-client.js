"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOURCE_WIDE_GRAB_FAILURE_CODES = exports.GRAB_FAILURE_CODES = exports.DELIVERY_BY_DOWNLOAD_SOURCE = exports.BOOK_REQUEST_DOWNLOAD_SOURCES = exports.UNSETTLED_BOOK_REQUEST_DOWNLOAD_STATUSES = exports.IN_FLIGHT_BOOK_REQUEST_DOWNLOAD_STATUSES = exports.ACTIVE_BOOK_REQUEST_DOWNLOAD_STATUSES = exports.BOOK_REQUEST_DOWNLOAD_STATUSES = exports.PATH_MAPPING_HARDLINK_FAILURES = exports.DOWNLOAD_CLIENT_ERROR_CODES = exports.DOWNLOAD_CLIENT_CREDENTIAL_KIND = exports.DOWNLOAD_CLIENT_DELIVERY = exports.DOWNLOAD_CLIENT_TYPES = void 0;
exports.grabFailureCode = grabFailureCode;
exports.findGrabRefusal = findGrabRefusal;
const request_credential_1 = require("./request-credential");
/**
 * External clients an operator configures. A direct file is fetched by BookOrbit itself and is
 * deliberately absent: it has no address, no credentials and nothing to choose, so making it a
 * configurable client type would only ask an operator to create a record of nothing.
 */
exports.DOWNLOAD_CLIENT_TYPES = ["qbittorrent", "transmission", "deluge", "nzbget", "sabnzbd"];
exports.DOWNLOAD_CLIENT_DELIVERY = {
    qbittorrent: "torrent",
    transmission: "torrent",
    deluge: "torrent",
    nzbget: "usenet",
    sabnzbd: "usenet",
};
/** Shapes the settings form without making one daemon's authentication model universal. */
exports.DOWNLOAD_CLIENT_CREDENTIAL_KIND = {
    qbittorrent: "usernamePassword",
    transmission: "usernamePassword",
    deluge: "usernamePassword",
    nzbget: "usernamePassword",
    sabnzbd: "apiKey",
};
/**
 * Stable codes for the failures the settings form has to explain in the operator's own language.
 * The English `message` alongside them stays useful in logs and for anything unmapped.
 */
exports.DOWNLOAD_CLIENT_ERROR_CODES = [
    "DOWNLOAD_CLIENT_NAME_TAKEN",
    "DOWNLOAD_CLIENT_URL_UNSAFE",
    "DOWNLOAD_CLIENT_URL_PRIVATE",
    "DOWNLOAD_CLIENT_PATH_NOT_ABSOLUTE",
    "DOWNLOAD_CLIENT_MAPPING_REQUIRED",
    "DOWNLOAD_CLIENT_CREDENTIAL_REQUIRED",
    /** The test ran and the client refused or could not be reached. Carries the adapter's reason. */
    "DOWNLOAD_CLIENT_TEST_FAILED",
    "DOWNLOAD_CLIENT_RECONCILIATION_UNSUPPORTED",
    "DOWNLOAD_CLIENT_RECONCILIATION_NOT_ORPHAN",
    "DOWNLOAD_CLIENT_RECONCILIATION_NOT_ADOPTABLE",
    ...request_credential_1.REQUEST_CREDENTIAL_ERROR_CODES,
];
/**
 * Whether a hardlink from this mapping into the Book Dock actually works, established by making
 * one rather than by comparing device ids: two bind mounts of one filesystem share a device and
 * still refuse the link. A refusal means every import copies instead, which is supported but
 * doubles the space.
 */
exports.PATH_MAPPING_HARDLINK_FAILURES = ["download_dir_unwritable", "link_refused"];
exports.BOOK_REQUEST_DOWNLOAD_STATUSES = [
    "queued",
    "downloading",
    "completed",
    "importing",
    /** Imported, but the verification score held it in the Book Dock for a human to look at. */
    "needs_review",
    "imported",
    "failed",
];
/** Statuses the poll loop still has to ask the download client about. */
exports.ACTIVE_BOOK_REQUEST_DOWNLOAD_STATUSES = ["queued", "downloading"];
/**
 * Statuses that still have work behind them: a transfer running, or finished bytes waiting on an
 * import. Removing one of these from its client takes the attempt with it, because nothing is
 * going to finish it.
 */
exports.IN_FLIGHT_BOOK_REQUEST_DOWNLOAD_STATUSES = ["queued", "downloading", "completed", "importing"];
/**
 * Statuses an attempt has not settled in. `imported` is finished with, and a `failed` one keeps
 * the reason it first failed for, which is the one that explains what happened; every write that
 * moves an attempt between states is conditional on it still being in one of these.
 */
exports.UNSETTLED_BOOK_REQUEST_DOWNLOAD_STATUSES = [
    ...exports.IN_FLIGHT_BOOK_REQUEST_DOWNLOAD_STATUSES,
    "needs_review",
];
exports.BOOK_REQUEST_DOWNLOAD_SOURCES = ["magnet", "torrent_file", "direct_url", "nzb_file"];
/** Which kind of client can carry out a grab of each source. */
exports.DELIVERY_BY_DOWNLOAD_SOURCE = {
    magnet: "torrent",
    torrent_file: "torrent",
    direct_url: "file",
    nzb_file: "usenet",
};
/**
 * Why a grab could not be started, in terms of how far the refusal reaches. The English `message`
 * says what happened; this says what a second attempt should do about it, which is the part a
 * failover and the picker both have to act on without reading tracker prose.
 */
exports.GRAB_FAILURE_CODES = [
    /** The source refused this account outright, so every other release it holds is refused too. */
    "GRAB_SOURCE_REFUSED",
    /** The source refused a VIP-only release. Its ordinary releases are still grabbable. */
    "GRAB_VIP_REQUIRED",
    /** The source did not answer. Nothing else from it is worth trying in the same breath. */
    "GRAB_SOURCE_UNAVAILABLE",
    /** The download client would not take it, so nothing needing that client will start either. */
    "GRAB_CLIENT_REFUSED",
    /** The download client was temporarily unreachable or answered with a server failure. */
    "GRAB_CLIENT_UNAVAILABLE",
    /** This release alone: gone from the results, unimportable, or already downloading. */
    "GRAB_RELEASE_REFUSED",
];
function grabFailureCode(value) {
    return typeof value === "string" && exports.GRAB_FAILURE_CODES.includes(value) ? value : null;
}
/**
 * Whether the refusal is a property of the source rather than of the one release. Both the
 * failover and the picker skip the rest of a source's releases on these, and only these.
 */
exports.SOURCE_WIDE_GRAB_FAILURE_CODES = ["GRAB_SOURCE_REFUSED", "GRAB_SOURCE_UNAVAILABLE"];
/**
 * The earlier refusal that already answers for this release, if one does, so nothing is handed
 * over to be told the same thing twice.
 *
 * Shared because the failover and the picker have to agree about the same list on the same
 * screen: the automation stops trying what this rules out, and the picker stops offering it.
 * A client refusal is scoped to its delivery. A torrent client being unavailable says nothing
 * about an NZBGet release or a source BookOrbit downloads itself.
 */
function findGrabRefusal(release, refusals) {
    return (refusals.find((refusal) => {
        if (refusal.code === "GRAB_CLIENT_REFUSED" || refusal.code === "GRAB_CLIENT_UNAVAILABLE") {
            return release.delivery !== "file" && refusal.delivery === release.delivery;
        }
        if (refusal.indexerId !== release.indexerId)
            return false;
        if (refusal.code === "GRAB_VIP_REQUIRED")
            return release.vipOnly;
        return exports.SOURCE_WIDE_GRAB_FAILURE_CODES.includes(refusal.code);
    }) ?? null);
}

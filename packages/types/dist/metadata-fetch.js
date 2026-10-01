"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.METADATA_PROVIDER_STATUS_EVENT = exports.COMMUNITY_RATING_PROVIDER_KEYS = exports.MetadataProviderKey = void 0;
exports.MetadataProviderKey = {
    GOOGLE: "google",
    GOODREADS: "goodreads",
    AMAZON: "amazon",
    HARDCOVER: "hardcover",
    OPEN_LIBRARY: "openLibrary",
    ITUNES: "itunes",
    AUDIBLE: "audible",
    AUDNEXUS: "audnexus",
    LIBROFM: "librofm",
    COMICVINE: "comicvine",
    RANOBEDB: "ranobedb",
    KOBO: "kobo",
    LUBIMYCZYTAC: "lubimyczytac",
    ALADIN: "aladin",
};
exports.COMMUNITY_RATING_PROVIDER_KEYS = [
    exports.MetadataProviderKey.HARDCOVER,
    exports.MetadataProviderKey.GOODREADS,
    exports.MetadataProviderKey.GOOGLE,
    exports.MetadataProviderKey.OPEN_LIBRARY,
    exports.MetadataProviderKey.ITUNES,
    exports.MetadataProviderKey.RANOBEDB,
    exports.MetadataProviderKey.AMAZON,
    exports.MetadataProviderKey.AUDIBLE,
];
/**
 * SSE event name carrying a MetadataProviderSearchStatus. Candidates keep the default event, so a
 * client that only reads candidates is unaffected by a provider reporting how it stopped.
 */
exports.METADATA_PROVIDER_STATUS_EVENT = "provider-status";

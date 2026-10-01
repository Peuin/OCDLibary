"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTHOR_PROVIDER_SUPPORTED_FIELDS = exports.ALL_AUTHOR_METADATA_FIELDS = exports.AuthorAutoEnrichmentWriteMode = exports.AuthorMetadataProviderKey = void 0;
exports.providerSupportsAuthorField = providerSupportsAuthorField;
exports.AuthorMetadataProviderKey = {
    AUDNEXUS: "audnexus",
    GOODREADS: "goodreads",
};
// Retained only so the app_settings migration can read pre-per-field values.
// Overwrite behaviour now lives on each field's mergeStrategy.
exports.AuthorAutoEnrichmentWriteMode = {
    MISSING_ONLY: "missing_only",
    ALWAYS_REFETCH: "always_refetch",
};
exports.ALL_AUTHOR_METADATA_FIELDS = [
    "description",
    "photo",
    "birthDate",
    "deathDate",
    "website",
    "genres",
    "influences",
];
// What each provider can actually return. Audnexus exposes only asin, name,
// description and image, so listing it against any other field would be inert.
exports.AUTHOR_PROVIDER_SUPPORTED_FIELDS = {
    [exports.AuthorMetadataProviderKey.AUDNEXUS]: ["description", "photo"],
    [exports.AuthorMetadataProviderKey.GOODREADS]: [...exports.ALL_AUTHOR_METADATA_FIELDS],
};
function providerSupportsAuthorField(provider, field) {
    return exports.AUTHOR_PROVIDER_SUPPORTED_FIELDS[provider]?.includes(field) ?? false;
}

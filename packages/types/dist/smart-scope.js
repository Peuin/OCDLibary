"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPodcastScope = isPodcastScope;
exports.podcastScopeRules = podcastScopeRules;
exports.smartScopeItemCount = smartScopeItemCount;
function isPodcastScope(scope) {
    return scope.mediaType === "podcasts";
}
/** Narrows the filter union to episode rules, so callers never treat a book rule tree as one. */
function podcastScopeRules(scope) {
    if (scope.mediaType !== "podcasts")
        return null;
    return scope.filter ?? null;
}
/** The count that belongs to a scope's medium, so callers do not have to branch. */
function smartScopeItemCount(scope) {
    const count = scope.mediaType === "podcasts" ? scope.episodeCount : scope.bookCount;
    return typeof count === "number" ? count : null;
}

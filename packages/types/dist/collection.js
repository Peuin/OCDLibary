"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionItemCount = collectionItemCount;
/** The count that belongs to a collection's medium, so callers do not have to branch. */
function collectionItemCount(collection) {
    return collection.mediaType === "podcasts" ? collection.podcastCount : collection.bookCount;
}

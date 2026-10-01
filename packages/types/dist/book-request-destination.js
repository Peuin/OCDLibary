"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_RESOLVED_REQUEST_DESTINATION = exports.NO_REQUEST_DESTINATION = void 0;
exports.emptyRequestDestinationDefaults = emptyRequestDestinationDefaults;
exports.emptyResolvedRequestDestinations = emptyResolvedRequestDestinations;
const book_request_1 = require("./book-request");
exports.NO_REQUEST_DESTINATION = { libraryId: null, folderId: null };
function emptyRequestDestinationDefaults() {
    return Object.fromEntries(book_request_1.BOOK_REQUEST_MEDIA_KINDS.map((kind) => [kind, { ...exports.NO_REQUEST_DESTINATION }]));
}
exports.NO_RESOLVED_REQUEST_DESTINATION = { libraryId: null, libraryName: null, folderId: null };
function emptyResolvedRequestDestinations() {
    return Object.fromEntries(book_request_1.BOOK_REQUEST_MEDIA_KINDS.map((kind) => [kind, { ...exports.NO_RESOLVED_REQUEST_DESTINATION }]));
}

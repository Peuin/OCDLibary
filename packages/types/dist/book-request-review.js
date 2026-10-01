"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOK_REQUEST_VERIFICATION_REASONS = exports.BOOK_REQUEST_VERIFICATION_FIELDS = void 0;
/** The fields the import is compared on. Order is the order the drawer lists them in. */
exports.BOOK_REQUEST_VERIFICATION_FIELDS = ["title", "authors", "isbn13"];
/**
 * Why the check landed where it did, as a code rather than a sentence. The server's prose is
 * still stored on the request for logs and for older clients, but the drawer localizes from this.
 */
exports.BOOK_REQUEST_VERIFICATION_REASONS = ["isbn_match", "above_threshold", "below_threshold", "author_mismatch", "no_title"];

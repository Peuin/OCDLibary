import { type BookRequestMediaKind } from "./book-request";
/**
 * Where a request's book is filed once it lands: a library, and a folder inside it.
 *
 * Both halves are nullable and travel together. A folder without a library is not a destination,
 * and a library whose folder was deleted still files the book, into that library's first folder.
 */
export interface RequestDestination {
    libraryId: number | null;
    folderId: number | null;
}
/**
 * A destination per medium, which is the finest grain a *default* can be keyed on.
 *
 * The medium is chosen before anything is searched, so it is the only thing about the eventual
 * file that is known at the moment a default has to fill the destination in. The file's format is
 * not: a request becomes an epub, an m4b or a folder of mp3s only once a release has been picked
 * and unpacked, long after the approver has already been asked where it goes.
 */
export type RequestDestinationDefaults = Record<BookRequestMediaKind, RequestDestination>;
export declare const NO_REQUEST_DESTINATION: RequestDestination;
export declare function emptyRequestDestinationDefaults(): RequestDestinationDefaults;
/**
 * A resolved instance default, as the request form shows it. Carries the library's name because
 * the form has to say where an unpicked request will land, and the requester may have no access
 * to that library and so no other way to learn what it is called.
 */
export interface ResolvedRequestDestination {
    libraryId: number | null;
    libraryName: string | null;
    folderId: number | null;
}
export type ResolvedRequestDestinations = Record<BookRequestMediaKind, ResolvedRequestDestination>;
export declare const NO_RESOLVED_REQUEST_DESTINATION: ResolvedRequestDestination;
export declare function emptyResolvedRequestDestinations(): ResolvedRequestDestinations;
//# sourceMappingURL=book-request-destination.d.ts.map
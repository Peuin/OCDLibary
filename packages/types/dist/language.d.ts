/**
 * Language codes shared by the release matcher and by anything that has to offer a language to
 * choose from.
 *
 * Here rather than in the server, because the two have to agree exactly. A request states a
 * language, the matcher compares every release against it as a hard filter, and a picker offers
 * the choice: if the offered list and the comparable set ever drift apart, a user picks a language
 * that silently matches nothing and the request comes back empty for a book that is right there.
 */
/**
 * Three-letter codes that do not simply truncate to their two-letter form.
 *
 * Sources state either. A metadata provider writes "spa" where a request states "es", and
 * truncating "spa" to "sp" would hard-filter out every Spanish release. Both the bibliographic and
 * terminological variants are listed, since sources use either.
 */
export declare const ISO_639_2_TO_1: Record<string, string>;
/** The two-letter codes offered when choosing a language. */
export declare const REQUEST_LANGUAGE_CODES: readonly string[];
/** Compares only the language subtag, so "en" and "eng" and "en-GB" all agree. */
export declare function normalizeLanguage(value: string): string;
/** Whether a release's stated language is one the request can accept. */
export declare function languagesAgree(requested: string, released: string): boolean;
/**
 * A language as a code the request can carry, or null.
 *
 * Deliberately not restricted to `REQUEST_LANGUAGE_CODES`. That list is what a person is *offered*,
 * and it is curated; this is what a *provider* may already have stated. Narrowing here to the
 * offered list would silently drop the language from any request for a book in something the
 * dropdown happens not to list, turning a filter the matcher handled perfectly well into no filter
 * at all. Anything that normalises to a plausible subtag is kept, and the matcher compares it the
 * same way it always did.
 */
export declare function toRequestLanguage(value: string | null | undefined): string | null;
//# sourceMappingURL=language.d.ts.map
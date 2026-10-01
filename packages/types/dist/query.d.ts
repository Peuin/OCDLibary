import type { CustomMetadataFieldType } from "./custom-metadata";
import type { CommunityRatingProviderKey } from "./metadata-fetch";
/**
 * Semantic filter field names used in rules.
 *
 * Most fields map directly to a DB column. The exceptions:
 * - `fileAvailability` - derived from `books.status` ('present' | 'missing')
 * - `communityRating` - from `book_community_ratings.rating` (optionally provider-specific)
 * - `communityRatingCount` - from `book_community_ratings.rating_count` (optionally provider-specific)
 * - `readProgress` - aggregated from `reading_progress.percentage` (per-user, per-book-file)
 * - `readStatus` - stored in `user_book_status.status` (per-user)
 * - `startedAt` - from `user_book_status.started_at` (per-user)
 * - `finishedAt` - from `user_book_status.finished_at` (per-user)
 * - `author` - resolved via `book_authors` join to `authors.name`
 * - `genre` - resolved via `book_genres` join to `genres.name`
 * - `tag` - resolved via `book_tags` join to `tags.name`
 * - `collection` - resolved via `collection_books` join to `collections.name`
 * - `library` - resolved via `books.library_id` join to `libraries.name`
 * - `format` - resolved via `book_files.format` (primary file)
 * - `fileSize` - resolved via `book_files.size_bytes` (primary file; rule values are bytes)
 * - `isbn` - matches both `isbn10` and `isbn13` in `book_metadata`
 * - `publishedDate` - uses full dates when available and falls back to published year
 * - `lockStatus` - derived from `book_metadata.locked_fields` (non-empty array = locked)
 * - `seriesStatus` - computed per-user: "up next in series" (next unstarted book whose earlier series entries are all finished)
 *
 * User-defined custom metadata fields are filterable too, as `CustomRuleField`.
 */
export type StaticRuleField = "title" | "publisher" | "language" | "series" | "seriesIndex" | "publishedDate" | "publishedYear" | "pageCount" | "author" | "genre" | "tag" | "collection" | "library" | "format" | "fileSize" | "addedAt" | "startedAt" | "finishedAt" | "fileAvailability" | "rating" | "communityRating" | "communityRatingCount" | "readProgress" | "readStatus" | "description" | "isbn" | "metadataScore" | "cover" | "lockStatus" | "seriesStatus";
/**
 * A user-defined custom metadata field, referenced by its numeric id.
 *
 * Mirrors `CustomSortField`. Values live in `book_custom_metadata_values`, which stores one
 * typed column per value kind; the column a rule targets follows from its operator (and, for
 * the operators shared between types, the value's runtime type) rather than a database lookup,
 * because a field's type is fixed at creation. Ids that no longer resolve to an active field
 * simply match nothing, so a saved filter survives the field being archived or deleted.
 */
export type CustomRuleField = `custom:${number}`;
export type RuleField = StaticRuleField | CustomRuleField;
export type RuleOperator = "contains" | "notContains" | "startsWith" | "endsWith" | "eq" | "notEq" | "isEmpty" | "isNotEmpty" | "gt" | "gte" | "lt" | "lte" | "between" | "includesAny" | "includesAll" | "excludesAll" | "before" | "after" | "withinLast" | "isMissing" | "isPresent" | "isUnread" | "isInProgress" | "isFinished" | "isLocked" | "isUnlocked" | "isUpNext" | "isTrue" | "isFalse";
export declare const FIELD_OPERATORS: Record<StaticRuleField, RuleOperator[]>;
export declare const RULE_FIELDS: StaticRuleField[];
/**
 * Operators offered for a custom metadata field, keyed by the field's type.
 *
 * `url` shares the text operators because both kinds store their value in `value_text`.
 * Every list ends with the two presence operators, which are answered without reference
 * to the field's type.
 */
export declare const CUSTOM_FIELD_TYPE_OPERATORS: Record<CustomMetadataFieldType, RuleOperator[]>;
/**
 * Every operator any custom field type accepts. The server validates saved rules against this
 * union because narrowing to the field's own type would need a database lookup; a rule whose
 * operator does not suit its field matches nothing instead of being rejected.
 */
export declare const CUSTOM_FIELD_OPERATORS: RuleOperator[];
export declare const RULE_OPERATORS: RuleOperator[];
export type CommunityRatingProvider = CommunityRatingProviderKey | "any";
export type CommunityRatingRuleField = "communityRating" | "communityRatingCount";
export type RuleValue = string | number | string[] | number[];
export type StandardRule = {
    type: "rule";
    field: Exclude<StaticRuleField, CommunityRatingRuleField>;
    operator: RuleOperator;
    value?: RuleValue;
    valueTo?: string | number;
};
export type CommunityRatingRule = {
    type: "rule";
    field: CommunityRatingRuleField;
    operator: RuleOperator;
    provider?: CommunityRatingProvider;
    value?: RuleValue;
    valueTo?: string | number;
};
export type CustomFieldRule = {
    type: "rule";
    field: CustomRuleField;
    operator: RuleOperator;
    value?: RuleValue;
    valueTo?: string | number;
};
export type Rule = StandardRule | CommunityRatingRule | CustomFieldRule;
export type GroupRule = {
    type: "group";
    join: "AND" | "OR";
    rules: (Rule | GroupRule)[];
};
/**
 * Semantic sort field names used in sort specs.
 *
 * Most fields map directly to `book_metadata` columns. The exceptions:
 * - `author` - sorts by first author's `sort_name` via `book_authors` → `authors` join
 * - `fileSize` - fetched from `book_files.size_bytes` for the primary file (correlated subquery)
 * - `readProgress` - aggregated from `reading_progress.percentage` (per-user, correlated subquery)
 * - `readStatus` - from `user_book_status.status` (per-user, correlated subquery)
 * - `lastReadAt` - max `reading_progress.updated_at` across all files (per-user, correlated subquery)
 * - `startedAt` - from `user_book_status.started_at` (per-user, correlated subquery)
 * - `finishedAt` - from `user_book_status.finished_at` (per-user, correlated subquery)
 * - `rating` - from `user_book_ratings.rating` (per-user, correlated subquery)
 * - `format` - from `book_files.format` for the primary file (correlated subquery)
 * - `publishedDate` - uses full dates when available and falls back to published year
 * - `random` - pseudorandom, seeded by `BookQuery.randomSeed` so one browsing session
 *   keeps a stable order across pages while a new visit reshuffles
 *
 * Fields marked "per-user, correlated subquery" require an authenticated userId and
 * execute a subquery per result row; they are slower on large result sets.
 *
 * User-defined custom metadata fields are sortable too, as `CustomSortField`.
 */
export type StaticSortField = "relevance" | "author" | "title" | "series" | "seriesIndex" | "addedAt" | "updatedAt" | "publishedDate" | "publishedYear" | "pageCount" | "rating" | "publisher" | "fileSize" | "readProgress" | "readStatus" | "format" | "lastReadAt" | "startedAt" | "finishedAt" | "random" | "language" | "metadataScore" | "collectionOrder";
/**
 * A user-defined custom metadata field, referenced by its numeric id.
 *
 * Values live in `book_custom_metadata_values`, which stores one typed column
 * per value kind, so the server resolves the field's type at query time to pick
 * the column to order by. Ids that no longer resolve to an active field are
 * dropped from the sort rather than rejected, so a saved sort survives the
 * field being archived or deleted.
 */
export type CustomSortField = `custom:${number}`;
export type SortField = StaticSortField | CustomSortField;
/** Built-in sort fields only. Custom fields are resolved at runtime, not enumerable here. */
export declare const SORT_FIELDS: StaticSortField[];
/**
 * Sort fields that only resolve inside a collection query, where the server knows
 * whose membership order to read. Pickers offered outside a collection must exclude
 * them, and the server rejects them when no collection scope is supplied.
 */
export declare const COLLECTION_SCOPED_SORT_FIELDS: StaticSortField[];
export type SortSpec = {
    field: SortField;
    dir: "asc" | "desc";
};
export declare function customSortField(fieldId: number): CustomSortField;
export declare function isCustomSortField(field: string): field is CustomSortField;
/** Returns the custom metadata field id a sort field references, or null when it is not a custom sort. */
export declare function parseCustomSortFieldId(field: string): number | null;
export declare function isSortField(field: string): field is SortField;
export declare function isCollectionScopedSortField(field: string): boolean;
/** True when any tier of the sort can only be resolved inside a collection query. */
export declare function hasCollectionScopedSort(sort: SortSpec[]): boolean;
export declare function customRuleField(fieldId: number): CustomRuleField;
export declare function isCustomRuleField(field: string): field is CustomRuleField;
/** Returns the custom metadata field id a rule field references, or null when it is not a custom field rule. */
export declare function parseCustomRuleFieldId(field: string): number | null;
export declare function isRuleField(field: string): field is RuleField;
export declare function customSortFieldIds(sort: SortSpec[]): number[];
export type BookQuery = {
    filter?: GroupRule;
    sort: SortSpec[];
    pagination: {
        page: number;
        size: number;
    };
    collapseSeries?: boolean;
    q?: string;
    /**
     * Shuffle seed for the `random` sort field. Every page of one listing must send the same
     * value or paging would draw from a different shuffle and repeat or skip books; a new value
     * reshuffles. Ignored when no sort tier is `random`. Callers that omit it get a per-user
     * order that only changes daily.
     */
    randomSeed?: number;
};
/** Upper bound for `BookQuery.randomSeed`, chosen so the seed always fits a signed 32-bit int. */
export declare const MAX_RANDOM_SORT_SEED = 2147483647;
/** True when any sort tier shuffles, which is what makes `BookQuery.randomSeed` meaningful. */
export declare function hasRandomSort(sort: SortSpec[] | undefined): boolean;
/** A fresh shuffle seed. One per browsing session, reused for every page of that session. */
export declare function createRandomSortSeed(): number;
//# sourceMappingURL=query.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_RANDOM_SORT_SEED = exports.COLLECTION_SCOPED_SORT_FIELDS = exports.SORT_FIELDS = exports.RULE_OPERATORS = exports.CUSTOM_FIELD_OPERATORS = exports.CUSTOM_FIELD_TYPE_OPERATORS = exports.RULE_FIELDS = exports.FIELD_OPERATORS = void 0;
exports.customSortField = customSortField;
exports.isCustomSortField = isCustomSortField;
exports.parseCustomSortFieldId = parseCustomSortFieldId;
exports.isSortField = isSortField;
exports.isCollectionScopedSortField = isCollectionScopedSortField;
exports.hasCollectionScopedSort = hasCollectionScopedSort;
exports.customRuleField = customRuleField;
exports.isCustomRuleField = isCustomRuleField;
exports.parseCustomRuleFieldId = parseCustomRuleFieldId;
exports.isRuleField = isRuleField;
exports.customSortFieldIds = customSortFieldIds;
exports.hasRandomSort = hasRandomSort;
exports.createRandomSortSeed = createRandomSortSeed;
exports.FIELD_OPERATORS = {
    title: ["contains", "notContains", "startsWith", "endsWith", "eq", "notEq", "isEmpty", "isNotEmpty"],
    publisher: ["contains", "notContains", "eq", "notEq", "includesAny", "excludesAll", "isEmpty", "isNotEmpty"],
    language: ["eq", "notEq", "includesAny", "excludesAll", "isEmpty", "isNotEmpty"],
    series: ["contains", "notContains", "eq", "notEq", "includesAny", "excludesAll", "isEmpty", "isNotEmpty"],
    author: ["includesAny", "includesAll", "excludesAll", "isEmpty", "isNotEmpty"],
    genre: ["includesAny", "includesAll", "excludesAll", "isEmpty", "isNotEmpty"],
    tag: ["includesAny", "includesAll", "excludesAll", "isEmpty", "isNotEmpty"],
    collection: ["includesAny", "excludesAll", "isEmpty", "isNotEmpty"],
    library: ["includesAny", "excludesAll"],
    format: ["includesAny", "excludesAll"],
    fileSize: ["eq", "notEq", "gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
    publishedDate: ["before", "after", "between", "withinLast", "isEmpty", "isNotEmpty"],
    publishedYear: ["eq", "notEq", "gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
    seriesIndex: ["eq", "notEq", "gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
    pageCount: ["gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
    addedAt: ["before", "after", "between", "withinLast"],
    startedAt: ["before", "after", "between", "withinLast", "isEmpty", "isNotEmpty"],
    finishedAt: ["before", "after", "between", "withinLast", "isEmpty", "isNotEmpty"],
    fileAvailability: ["isMissing", "isPresent"],
    rating: ["eq", "gt", "gte", "lt", "lte", "isEmpty", "isNotEmpty"],
    communityRating: ["eq", "notEq", "gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
    communityRatingCount: ["eq", "notEq", "gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
    readProgress: ["isUnread", "isInProgress", "isFinished"],
    readStatus: ["includesAny", "excludesAll", "isEmpty", "isNotEmpty"],
    description: ["isEmpty", "isNotEmpty"],
    isbn: ["isEmpty", "isNotEmpty", "eq"],
    metadataScore: ["gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
    cover: ["isMissing", "isPresent"],
    lockStatus: ["isLocked", "isUnlocked"],
    seriesStatus: ["isUpNext"],
};
exports.RULE_FIELDS = Object.keys(exports.FIELD_OPERATORS);
/**
 * Operators offered for a custom metadata field, keyed by the field's type.
 *
 * `url` shares the text operators because both kinds store their value in `value_text`.
 * Every list ends with the two presence operators, which are answered without reference
 * to the field's type.
 */
exports.CUSTOM_FIELD_TYPE_OPERATORS = {
    text: ["contains", "notContains", "startsWith", "endsWith", "eq", "notEq", "isEmpty", "isNotEmpty"],
    url: ["contains", "notContains", "startsWith", "endsWith", "eq", "notEq", "isEmpty", "isNotEmpty"],
    number: ["eq", "notEq", "gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
    date: ["before", "after", "between", "withinLast", "isEmpty", "isNotEmpty"],
    boolean: ["isTrue", "isFalse", "isEmpty", "isNotEmpty"],
};
/**
 * Every operator any custom field type accepts. The server validates saved rules against this
 * union because narrowing to the field's own type would need a database lookup; a rule whose
 * operator does not suit its field matches nothing instead of being rejected.
 */
exports.CUSTOM_FIELD_OPERATORS = [...new Set(Object.values(exports.CUSTOM_FIELD_TYPE_OPERATORS).flat())];
exports.RULE_OPERATORS = [
    "contains",
    "notContains",
    "startsWith",
    "endsWith",
    "eq",
    "notEq",
    "isEmpty",
    "isNotEmpty",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "includesAny",
    "includesAll",
    "excludesAll",
    "before",
    "after",
    "withinLast",
    "isMissing",
    "isPresent",
    "isUnread",
    "isInProgress",
    "isFinished",
    "isLocked",
    "isUnlocked",
    "isUpNext",
    "isTrue",
    "isFalse",
];
/** Built-in sort fields only. Custom fields are resolved at runtime, not enumerable here. */
exports.SORT_FIELDS = [
    "relevance",
    "author",
    "title",
    "series",
    "seriesIndex",
    "addedAt",
    "updatedAt",
    "publishedDate",
    "publishedYear",
    "pageCount",
    "rating",
    "publisher",
    "fileSize",
    "readProgress",
    "readStatus",
    "format",
    "lastReadAt",
    "startedAt",
    "finishedAt",
    "random",
    "language",
    "metadataScore",
    "collectionOrder",
];
/**
 * Sort fields that only resolve inside a collection query, where the server knows
 * whose membership order to read. Pickers offered outside a collection must exclude
 * them, and the server rejects them when no collection scope is supplied.
 */
exports.COLLECTION_SCOPED_SORT_FIELDS = ["collectionOrder"];
// Bounded to 9 digits so a parsed id always fits the int4 field id column.
const CUSTOM_FIELD_PATTERN = /^custom:([1-9]\d{0,8})$/;
function parseCustomFieldId(field) {
    const match = CUSTOM_FIELD_PATTERN.exec(field);
    return match ? Number(match[1]) : null;
}
function customSortField(fieldId) {
    return `custom:${fieldId}`;
}
function isCustomSortField(field) {
    return CUSTOM_FIELD_PATTERN.test(field);
}
/** Returns the custom metadata field id a sort field references, or null when it is not a custom sort. */
function parseCustomSortFieldId(field) {
    return parseCustomFieldId(field);
}
function isSortField(field) {
    return exports.SORT_FIELDS.includes(field) || isCustomSortField(field);
}
function isCollectionScopedSortField(field) {
    return exports.COLLECTION_SCOPED_SORT_FIELDS.includes(field);
}
/** True when any tier of the sort can only be resolved inside a collection query. */
function hasCollectionScopedSort(sort) {
    return sort.some((spec) => isCollectionScopedSortField(spec.field));
}
function customRuleField(fieldId) {
    return `custom:${fieldId}`;
}
function isCustomRuleField(field) {
    return CUSTOM_FIELD_PATTERN.test(field);
}
/** Returns the custom metadata field id a rule field references, or null when it is not a custom field rule. */
function parseCustomRuleFieldId(field) {
    return parseCustomFieldId(field);
}
function isRuleField(field) {
    return exports.RULE_FIELDS.includes(field) || isCustomRuleField(field);
}
function customSortFieldIds(sort) {
    const ids = new Set();
    for (const { field } of sort) {
        const id = parseCustomSortFieldId(field);
        if (id !== null)
            ids.add(id);
    }
    return [...ids];
}
/** Upper bound for `BookQuery.randomSeed`, chosen so the seed always fits a signed 32-bit int. */
exports.MAX_RANDOM_SORT_SEED = 2_147_483_647;
/** True when any sort tier shuffles, which is what makes `BookQuery.randomSeed` meaningful. */
function hasRandomSort(sort) {
    return sort?.some((spec) => spec.field === "random") ?? false;
}
/** A fresh shuffle seed. One per browsing session, reused for every page of that session. */
function createRandomSortSeed() {
    return Math.floor(Math.random() * (exports.MAX_RANDOM_SORT_SEED + 1));
}

export declare const FIVE_FIELD_CRON_FIELD_COUNT = 5;
/**
 * Accepts only the grammar that both the server scheduler and the client's
 * human-readable preview understand, so a schedule can never look valid in the
 * UI and then be rejected by the API. Extensions such as `@daily`, `L`, `#` and
 * seconds fields are rejected on purpose: one of the two parsers chokes on each.
 */
export declare function isFiveFieldCronExpression(value: unknown): value is string;
//# sourceMappingURL=cron.d.ts.map
export declare const ACCOUNT_ACTIVITY_STATES: readonly ["recent", "dormant", "never", "disabled"];
export type AccountActivityState = (typeof ACCOUNT_ACTIVITY_STATES)[number];
export declare const ACCOUNT_ACTIVITY_SORT_FIELDS: readonly ["name", "createdAt", "lastLoginAt", "lastAuthenticatedAt"];
export type AccountActivitySortField = (typeof ACCOUNT_ACTIVITY_SORT_FIELDS)[number];
export type AccountActivitySortDirection = "asc" | "desc";
export interface AccountActivityListItem {
    id: number;
    username: string;
    name: string;
    active: boolean;
    isSuperuser: boolean;
    provisioningMethod: import("./auth").ProvisioningMethod;
    createdAt: string;
    lastLoginAt: string | null;
    lastAuthenticatedAt: string | null;
    state: AccountActivityState;
    readingInsightsSharingLevel: import("./shared-reading-insights").ReadingInsightsSharingLevel;
}
export interface AccountActivityListResponse {
    items: AccountActivityListItem[];
    total: number;
    page: number;
    pageSize: number;
}
export interface AccountActivitySummary {
    recent: number;
    dormant: number;
    never: number;
    disabled: number;
}
export interface AccountActivityDetail extends AccountActivityListItem {
    email: string | null;
}
//# sourceMappingURL=account-activity.d.ts.map
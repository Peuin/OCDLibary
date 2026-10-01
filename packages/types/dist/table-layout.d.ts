export type TableViewType = "library" | "smartScope" | "collection" | "series";
export type TableLayoutState = {
    columnOrder: string[];
    hiddenColumns: string[];
    columnWidths: Record<string, number>;
    pinnedColumns?: Record<string, "left" | "right" | null>;
};
export declare function validateTableLayout(raw: unknown, knownIds: string[]): TableLayoutState | null;
export declare function cloneTableLayout(layout: TableLayoutState): TableLayoutState;
//# sourceMappingURL=table-layout.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTableLayout = validateTableLayout;
exports.cloneTableLayout = cloneTableLayout;
function validateTableLayout(raw, knownIds) {
    if (!raw || typeof raw !== "object")
        return null;
    const r = raw;
    if (!Array.isArray(r.columnOrder) || !Array.isArray(r.hiddenColumns))
        return null;
    const known = new Set(knownIds);
    const order = r.columnOrder.filter((id) => typeof id === "string" && known.has(id));
    const missing = knownIds.filter((id) => !order.includes(id));
    const hidden = r.hiddenColumns.filter((id) => typeof id === "string" && known.has(id));
    const widths = {};
    if (r.columnWidths && typeof r.columnWidths === "object") {
        for (const [id, w] of Object.entries(r.columnWidths)) {
            if (known.has(id) && typeof w === "number" && w > 0)
                widths[id] = w;
        }
    }
    const pins = {};
    if (r.pinnedColumns && typeof r.pinnedColumns === "object") {
        for (const [id, dir] of Object.entries(r.pinnedColumns)) {
            if (known.has(id) && (dir === "left" || dir === "right" || dir === null))
                pins[id] = dir;
        }
    }
    return {
        columnOrder: [...order, ...missing],
        hiddenColumns: hidden,
        columnWidths: widths,
        pinnedColumns: pins,
    };
}
function cloneTableLayout(layout) {
    return {
        columnOrder: [...layout.columnOrder],
        hiddenColumns: [...layout.hiddenColumns],
        columnWidths: { ...layout.columnWidths },
        ...(layout.pinnedColumns ? { pinnedColumns: { ...layout.pinnedColumns } } : {}),
    };
}

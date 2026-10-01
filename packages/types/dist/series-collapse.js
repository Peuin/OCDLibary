"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCollapsePreference = resolveCollapsePreference;
function resolveCollapsePreference(prefs, ctx) {
    if (!prefs)
        return false;
    // Author pages resolve to their own flag and stop there - they deliberately do not inherit the
    // global default, and the library filter on an author page is a filter, not a scope to override.
    if (ctx.authorPages)
        return prefs.authorPages ?? false;
    if (ctx.smartScopeId !== undefined) {
        const override = prefs.smartScopes?.[String(ctx.smartScopeId)];
        if (override !== undefined)
            return override;
    }
    if (ctx.collectionId !== undefined) {
        const override = prefs.collections?.[String(ctx.collectionId)];
        if (override !== undefined)
            return override;
    }
    if (ctx.libraryId !== undefined) {
        const override = prefs.libraries?.[String(ctx.libraryId)];
        if (override !== undefined)
            return override;
    }
    return prefs.global ?? false;
}

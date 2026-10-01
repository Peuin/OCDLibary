"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBookDockSearchTitle = resolveBookDockSearchTitle;
function resolveBookDockSearchTitle(fileName, metadataTitle) {
    const normalizedMetadataTitle = metadataTitle?.trim();
    if (normalizedMetadataTitle)
        return normalizedMetadataTitle;
    const normalizedFileName = fileName.trim();
    if (!normalizedFileName)
        return undefined;
    const extensionIndex = normalizedFileName.lastIndexOf(".");
    const stem = extensionIndex > 0 ? normalizedFileName.slice(0, extensionIndex) : normalizedFileName;
    return stem.trim() || undefined;
}

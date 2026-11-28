"use strict";
/**
 * The contract between BookOrbit and an indexer plugin loaded from disk.
 *
 * This package exists so that a plugin maintained in another repository can typecheck against a
 * versioned surface instead of against BookOrbit's internals. Nothing here is tracker-specific,
 * and BookOrbit ships no plugin of its own: the loader is the extension point, the plugins are
 * somebody else's.
 *
 * Deliberately dependency-free and free of runtime classes. A plugin is imported at runtime and
 * therefore gets its own copy of anything it imports, so `instanceof` across the boundary cannot
 * be relied on; every failure travels through `host.fail` instead.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_API_VERSION = void 0;
/** Bumped when a change to this contract would break a plugin written against the old one. */
exports.PLUGIN_API_VERSION = 1;

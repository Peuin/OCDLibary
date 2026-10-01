"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ATTENTION_REASONS = exports.USER_LIST_SORT_FIELDS = exports.USER_LIST_STATES = void 0;
exports.USER_LIST_STATES = ["admins", "active", "inactive", "attention"];
exports.USER_LIST_SORT_FIELDS = ["username", "name", "email", "createdAt", "lastActive"];
/**
 * Why an account is surfaced in the roster's attention band. Ordered by how urgent
 * the repair is, which is also the order the band renders them in.
 */
exports.USER_ATTENTION_REASONS = ["locked", "defaultPassword", "neverSignedIn"];

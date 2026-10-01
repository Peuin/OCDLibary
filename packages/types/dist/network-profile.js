"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasNetworkProfile = hasNetworkProfile;
/** Nothing configured is the normal case, and must cost nothing at all. */
function hasNetworkProfile(profile) {
    return Boolean(profile && ((profile.resolvers && profile.resolvers.length > 0) || profile.proxyUrl));
}

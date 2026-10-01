"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANNOTATION_HUB_GROUP_MODES = exports.ANNOTATION_COLOR_FILTER_OPTIONS = exports.KOREADER_EXACT_HIGHLIGHT_COLORS = exports.ANNOTATION_HIGHLIGHT_COLORS = exports.KOREADER_HIGHLIGHT_COLORS = exports.KOBO_HIGHLIGHT_COLORS = void 0;
exports.KOBO_HIGHLIGHT_COLORS = [
    { name: "yellow", label: "Yellow", hex: "#F6F3B3" },
    { name: "green", label: "Green", hex: "#C6E09E" },
    { name: "blue", label: "Blue", hex: "#B2E1E8" },
    { name: "pink", label: "Pink", hex: "#E8AFCF" },
];
exports.KOREADER_HIGHLIGHT_COLORS = [
    { name: "red", label: "Red", hex: "#FF3300", appHex: "#F87171", koboFallback: "pink" },
    { name: "orange", label: "Orange", hex: "#FF8800", appHex: "#FB923C", koboFallback: "yellow" },
    { name: "yellow", label: "Yellow", hex: "#FFFF33", appHex: "#FACC15", koboFallback: "yellow" },
    { name: "green", label: "Green", hex: "#00AA66", appHex: "#4ADE80", koboFallback: "green" },
    { name: "olive", label: "Olive", hex: "#88FF77", appHex: "#84CC16", koboFallback: "green" },
    { name: "cyan", label: "Cyan", hex: "#00FFEE", appHex: "#22D3EE", koboFallback: "blue" },
    { name: "blue", label: "Blue", hex: "#0066FF", appHex: "#38BDF8", koboFallback: "blue" },
    { name: "purple", label: "Purple", hex: "#EE00FF", appHex: "#C084FC", koboFallback: "pink" },
    { name: "gray", label: "Gray", hex: "#808080", appHex: "#9CA3AF", koboFallback: "yellow" },
];
exports.ANNOTATION_HIGHLIGHT_COLORS = [
    { name: "yellow", label: "Yellow", hex: "#FACC15", koreaderFallback: "yellow", koboFallback: "yellow" },
    { name: "green", label: "Green", hex: "#4ADE80", koreaderFallback: "green", koboFallback: "green" },
    { name: "blue", label: "Blue", hex: "#38BDF8", koreaderFallback: "blue", koboFallback: "blue" },
    { name: "pink", label: "Pink", hex: "#F472B6", koreaderFallback: "purple", koboFallback: "pink" },
    { name: "orange", label: "Orange", hex: "#FB923C", koreaderFallback: "orange", koboFallback: "yellow" },
    { name: "red", label: "Red", hex: "#F87171", koreaderFallback: "red", koboFallback: "pink" },
    { name: "olive", label: "Olive", hex: "#84CC16", koreaderFallback: "olive", koboFallback: "green" },
    { name: "cyan", label: "Cyan", hex: "#22D3EE", koreaderFallback: "cyan", koboFallback: "blue" },
    { name: "purple", label: "Purple", hex: "#C084FC", koreaderFallback: "purple", koboFallback: "pink" },
    { name: "gray", label: "Gray", hex: "#9CA3AF", koreaderFallback: "gray", koboFallback: "yellow" },
];
exports.KOREADER_EXACT_HIGHLIGHT_COLORS = [
    { hex: "#FF3300", label: "KOReader Red" },
    { hex: "#FF8800", label: "KOReader Orange" },
    { hex: "#FFFF33", label: "KOReader Yellow" },
    { hex: "#00AA66", label: "KOReader Green" },
    { hex: "#88FF77", label: "KOReader Olive" },
    { hex: "#00FFEE", label: "KOReader Cyan" },
    { hex: "#0066FF", label: "KOReader Blue" },
    { hex: "#EE00FF", label: "KOReader Purple" },
    { hex: "#808080", label: "KOReader Gray" },
];
exports.ANNOTATION_COLOR_FILTER_OPTIONS = [...exports.ANNOTATION_HIGHLIGHT_COLORS, ...exports.KOREADER_EXACT_HIGHLIGHT_COLORS];
/**
 * How the hub stream is grouped. The mode drives the server sort as well as the
 * rules drawn between rows, because grouping a page of an infinite list only
 * lands on whole groups when the server already ordered by the same key.
 */
exports.ANNOTATION_HUB_GROUP_MODES = ["month", "book", "color", "source"];

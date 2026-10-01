"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOK_FILE_WRITE_FORMAT_FIELDS = exports.AUDIO_BOOK_FILE_WRITE_FIELDS = exports.MOBI_BOOK_FILE_WRITE_FIELDS = exports.CBX_BOOK_FILE_WRITE_FIELDS = exports.PDF_BOOK_FILE_WRITE_FIELDS = exports.FB2_BOOK_FILE_WRITE_FIELDS = exports.EPUB_BOOK_FILE_WRITE_FIELDS = exports.BOOK_FILE_WRITE_FIELD_LABELS = exports.BOOK_FILE_WRITE_FIELDS = exports.COMIC_BOOK_FILE_WRITE_FIELDS = exports.COMMON_PROVIDER_BOOK_FILE_WRITE_FIELDS = exports.CORE_BOOK_FILE_WRITE_FIELDS = void 0;
exports.getBookFileWriteFormatFields = getBookFileWriteFormatFields;
exports.CORE_BOOK_FILE_WRITE_FIELDS = [
    "title",
    "subtitle",
    "description",
    "publisher",
    "publishedDate",
    "publishedYear",
    "language",
    "pageCount",
    "seriesName",
    "seriesIndex",
    "isbn10",
    "isbn13",
    "rating",
    "authors",
    "genres",
    "tags",
];
exports.COMMON_PROVIDER_BOOK_FILE_WRITE_FIELDS = [
    "googleBooksId",
    "goodreadsId",
    "amazonId",
    "hardcoverId",
    "hardcoverEditionId",
    "openLibraryId",
    "ranobedbId",
    "koboId",
    "lubimyczytacId",
    "aladinId",
];
exports.COMIC_BOOK_FILE_WRITE_FIELDS = [
    "comicvineId",
    "comicIssueNumber",
    "comicVolumeName",
    "comicPencillers",
    "comicInkers",
    "comicColorists",
    "comicLetterers",
    "comicCoverArtists",
    "comicCharacters",
    "comicTeams",
    "comicLocations",
    "comicStoryArcs",
];
exports.BOOK_FILE_WRITE_FIELDS = [
    ...exports.CORE_BOOK_FILE_WRITE_FIELDS,
    ...exports.COMMON_PROVIDER_BOOK_FILE_WRITE_FIELDS,
    ...exports.COMIC_BOOK_FILE_WRITE_FIELDS,
    "itunesId",
    "audibleId",
    "librofmId",
    "narrators",
    "coverBytes",
];
exports.BOOK_FILE_WRITE_FIELD_LABELS = {
    title: "Title",
    subtitle: "Subtitle",
    description: "Description",
    publisher: "Publisher",
    publishedDate: "Published date",
    publishedYear: "Published year",
    language: "Language",
    pageCount: "Page count",
    seriesName: "Series",
    seriesIndex: "Series index",
    isbn10: "ISBN-10",
    isbn13: "ISBN-13",
    rating: "Rating",
    authors: "Authors",
    genres: "Genres",
    tags: "Tags",
    googleBooksId: "Google Books ID",
    goodreadsId: "Goodreads ID",
    amazonId: "Amazon ID",
    hardcoverId: "Hardcover ID",
    hardcoverEditionId: "Hardcover edition ID",
    openLibraryId: "Open Library ID",
    ranobedbId: "RanobeDB ID",
    koboId: "Kobo ID",
    lubimyczytacId: "LubimyCzytac ID",
    aladinId: "Aladin ID",
    comicvineId: "ComicVine ID",
    comicIssueNumber: "Issue number",
    comicVolumeName: "Volume",
    comicPencillers: "Pencillers",
    comicInkers: "Inkers",
    comicColorists: "Colorists",
    comicLetterers: "Letterers",
    comicCoverArtists: "Cover artists",
    comicCharacters: "Characters",
    comicTeams: "Teams",
    comicLocations: "Locations",
    comicStoryArcs: "Story arcs",
    itunesId: "iTunes ID",
    audibleId: "Audible ID",
    librofmId: "Libro.fm ISBN",
    narrators: "Narrators",
    coverBytes: "Cover",
};
exports.EPUB_BOOK_FILE_WRITE_FIELDS = [
    ...exports.CORE_BOOK_FILE_WRITE_FIELDS,
    ...exports.COMMON_PROVIDER_BOOK_FILE_WRITE_FIELDS,
    "itunesId",
    "coverBytes",
];
// FB2 keeps managed metadata in <description>: standard slots cover the core
// fields, and <custom-info info-type="bookorbit:*"> carries the rest.
exports.FB2_BOOK_FILE_WRITE_FIELDS = [
    ...exports.CORE_BOOK_FILE_WRITE_FIELDS,
    ...exports.COMMON_PROVIDER_BOOK_FILE_WRITE_FIELDS,
    "itunesId",
    "coverBytes",
];
exports.PDF_BOOK_FILE_WRITE_FIELDS = [
    ...exports.CORE_BOOK_FILE_WRITE_FIELDS,
    ...exports.COMMON_PROVIDER_BOOK_FILE_WRITE_FIELDS,
    "itunesId",
];
exports.CBX_BOOK_FILE_WRITE_FIELDS = [
    ...exports.CORE_BOOK_FILE_WRITE_FIELDS,
    ...exports.COMMON_PROVIDER_BOOK_FILE_WRITE_FIELDS,
    ...exports.COMIC_BOOK_FILE_WRITE_FIELDS,
];
// MOBI EXTH records are keyed by number and have no extensible string-keyed
// namespace, so fields without a standard EXTH slot (series, rating, page count,
// subtitle, provider IDs, comic fields, narrators) cannot be represented at all.
exports.MOBI_BOOK_FILE_WRITE_FIELDS = [
    "title",
    "description",
    "publisher",
    "publishedDate",
    "language",
    "isbn10",
    "isbn13",
    "authors",
    "genres",
    "tags",
    "coverBytes",
];
exports.AUDIO_BOOK_FILE_WRITE_FIELDS = [
    "title",
    "subtitle",
    "authors",
    "narrators",
    "publishedDate",
    "publishedYear",
    "publisher",
    "description",
    "genres",
    "language",
    "seriesName",
    "seriesIndex",
    "audibleId",
    "librofmId",
    "coverBytes",
];
exports.BOOK_FILE_WRITE_FORMAT_FIELDS = {
    epub: exports.EPUB_BOOK_FILE_WRITE_FIELDS,
    fb2: exports.FB2_BOOK_FILE_WRITE_FIELDS,
    pdf: exports.PDF_BOOK_FILE_WRITE_FIELDS,
    cbz: exports.CBX_BOOK_FILE_WRITE_FIELDS,
    cb7: exports.CBX_BOOK_FILE_WRITE_FIELDS,
    mobi: exports.MOBI_BOOK_FILE_WRITE_FIELDS,
    azw3: exports.MOBI_BOOK_FILE_WRITE_FIELDS,
    azw: exports.MOBI_BOOK_FILE_WRITE_FIELDS,
    m4b: exports.AUDIO_BOOK_FILE_WRITE_FIELDS,
    m4a: exports.AUDIO_BOOK_FILE_WRITE_FIELDS,
    mp3: exports.AUDIO_BOOK_FILE_WRITE_FIELDS,
    flac: exports.AUDIO_BOOK_FILE_WRITE_FIELDS,
};
function getBookFileWriteFormatFields(format) {
    const key = format?.toLowerCase() ?? "";
    return exports.BOOK_FILE_WRITE_FORMAT_FIELDS[key] ?? [];
}

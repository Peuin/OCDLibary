import {
  DASHBOARD_QUOTE_SOURCE_MAX,
  DASHBOARD_QUOTE_TEXT_MAX,
  type DashboardQuoteImportErrorCode,
  type DashboardQuoteImportLineError,
} from '@bookorbit/types';

export type DashboardQuoteImportFormat = 'csv' | 'txt';

export interface ParsedDashboardQuote {
  line: number;
  text: string;
  source: string;
  enabled: boolean;
}

export interface DashboardQuoteParseResult {
  quotes: ParsedDashboardQuote[];
  errors: DashboardQuoteImportLineError[];
  rowCount: number;
}

interface RawRecord {
  line: number;
  cells: string[];
  unclosedQuote: boolean;
}

const HEADER_TEXT_CELLS = new Set(['text', 'quote', 'cau trich', 'noi dung']);
const HEADER_SOURCE_CELLS = new Set(['source', 'nguon', 'nguon trich']);
const TRUE_VALUES = new Set(['', '1', 'true', 'yes', 'y', 'x', 'co', 'bat', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'n', 'khong', 'tat', 'off']);
// "Câu trích (Ga 1,1)": the citation is the last parenthesised group at the end of the line.
const TRAILING_SOURCE = /^(.*?)\s*\(([^()]*)\)\s*$/s;

export function resolveDashboardQuoteImportFormat(fileName: string | undefined): DashboardQuoteImportFormat | null {
  const extension = fileName?.toLowerCase().split('.').pop();
  if (extension === 'csv') return 'csv';
  if (extension === 'txt') return 'txt';
  return null;
}

export function parseDashboardQuoteFile(content: string, format: DashboardQuoteImportFormat): DashboardQuoteParseResult {
  const withoutBom = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const normalized = withoutBom.replace(/\r\n?/g, '\n');
  return format === 'csv' ? parseCsv(normalized) : parseTxt(normalized);
}

function parseTxt(content: string): DashboardQuoteParseResult {
  const quotes: ParsedDashboardQuote[] = [];
  const errors: DashboardQuoteImportLineError[] = [];
  let rowCount = 0;

  content.split('\n').forEach((rawLine, index) => {
    const line = index + 1;
    const trimmed = rawLine.trim();
    if (!trimmed) return;
    rowCount += 1;

    const [text, source] = splitTxtLine(trimmed);
    const code = validate(text, source);
    if (code) errors.push({ line, code });
    else quotes.push({ line, text, source, enabled: true });
  });

  return { quotes, errors, rowCount };
}

function splitTxtLine(line: string): [string, string] {
  const pipe = line.lastIndexOf('|');
  if (pipe >= 0) return [line.slice(0, pipe).trim(), line.slice(pipe + 1).trim()];
  const tab = line.lastIndexOf('\t');
  if (tab >= 0) return [line.slice(0, tab).trim(), line.slice(tab + 1).trim()];
  const match = TRAILING_SOURCE.exec(line);
  if (match) return [match[1]!.trim(), match[2]!.trim()];
  return [line, ''];
}

function parseCsv(content: string): DashboardQuoteParseResult {
  const records = readCsvRecords(content, detectDelimiter(content));
  const quotes: ParsedDashboardQuote[] = [];
  const errors: DashboardQuoteImportLineError[] = [];

  const first = records[0];
  if (first && isHeader(first.cells)) records.shift();

  for (const record of records) {
    const code = validateRecord(record);
    if (code) {
      errors.push({ line: record.line, code });
      continue;
    }
    const [text = '', source = '', enabled = ''] = record.cells.map((cell) => cell.trim());
    quotes.push({ line: record.line, text, source, enabled: TRUE_VALUES.has(normalizeWord(enabled)) });
  }

  return { quotes, errors, rowCount: records.length };
}

function validateRecord(record: RawRecord): DashboardQuoteImportErrorCode | null {
  if (record.unclosedQuote) return 'unclosed_quote';
  if (record.cells.length > 3) return 'too_many_columns';
  const [text = '', source = '', enabled = ''] = record.cells.map((cell) => cell.trim());
  const code = validate(text, source);
  if (code) return code;
  const flag = normalizeWord(enabled);
  if (!TRUE_VALUES.has(flag) && !FALSE_VALUES.has(flag)) return 'invalid_enabled';
  return null;
}

function validate(text: string, source: string): DashboardQuoteImportErrorCode | null {
  if (!text) return 'empty_text';
  if (!source) return 'missing_source';
  if (text.length > DASHBOARD_QUOTE_TEXT_MAX) return 'text_too_long';
  if (source.length > DASHBOARD_QUOTE_SOURCE_MAX) return 'source_too_long';
  return null;
}

function isHeader(cells: string[]): boolean {
  const [text = '', source = ''] = cells.map(normalizeWord);
  return HEADER_TEXT_CELLS.has(text) && HEADER_SOURCE_CELLS.has(source);
}

function normalizeWord(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

// Spreadsheets saved with a Vietnamese or European locale separate columns with ";" instead of ",".
function detectDelimiter(content: string): ',' | ';' {
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;
  for (const char of content) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === '\n' && !inQuotes) break;
    else if (!inQuotes && char === ',') commas += 1;
    else if (!inQuotes && char === ';') semicolons += 1;
  }
  return semicolons > commas ? ';' : ',';
}

/** RFC 4180 reader that keeps the line each record starts on, so errors can point at the file. */
function readCsvRecords(content: string, delimiter: string): RawRecord[] {
  const records: RawRecord[] = [];
  let cells: string[] = [];
  let cell = '';
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const endRecord = () => {
    cells.push(cell);
    if (cells.some((value) => value.trim() !== '')) records.push({ line: recordLine, cells, unclosedQuote: false });
    cells = [];
    cell = '';
  };

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]!;
    if (inQuotes) {
      if (char === '"' && content[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        if (char === '\n') line += 1;
        cell += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === delimiter) {
      cells.push(cell);
      cell = '';
    } else if (char === '\n') {
      endRecord();
      line += 1;
      recordLine = line;
    } else cell += char;
  }

  if (inQuotes) {
    cells.push(cell);
    records.push({ line: recordLine, cells, unclosedQuote: true });
  } else if (cell !== '' || cells.length > 0) {
    endRecord();
  }

  return records;
}

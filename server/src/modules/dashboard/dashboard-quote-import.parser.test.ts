import { DASHBOARD_QUOTE_TEXT_MAX } from '@bookorbit/types';
import { parseDashboardQuoteFile, resolveDashboardQuoteImportFormat } from './dashboard-quote-import.parser';

describe('resolveDashboardQuoteImportFormat', () => {
  it('accepts csv and txt by extension only', () => {
    expect(resolveDashboardQuoteImportFormat('quotes.CSV')).toBe('csv');
    expect(resolveDashboardQuoteImportFormat('quotes.txt')).toBe('txt');
    expect(resolveDashboardQuoteImportFormat('quotes.xlsx')).toBeNull();
    expect(resolveDashboardQuoteImportFormat(undefined)).toBeNull();
  });
});

describe('parseDashboardQuoteFile (txt)', () => {
  it('reads the trailing parenthesised source, pipes and tabs', () => {
    const result = parseDashboardQuoteFile(
      '﻿Lúc khởi đầu đã có Ngôi Lời (Ga 1,1)\r\n\r\nPhúc thay ai có tâm hồn nghèo khó | Mt 5,3\nChúa là mục tử\tTv 23,1\n',
      'txt',
    );
    expect(result.errors).toEqual([]);
    expect(result.rowCount).toBe(3);
    expect(result.quotes).toEqual([
      { line: 1, text: 'Lúc khởi đầu đã có Ngôi Lời', source: 'Ga 1,1', enabled: true },
      { line: 3, text: 'Phúc thay ai có tâm hồn nghèo khó', source: 'Mt 5,3', enabled: true },
      { line: 4, text: 'Chúa là mục tử', source: 'Tv 23,1', enabled: true },
    ]);
  });

  it('reports the line of each bad row', () => {
    const result = parseDashboardQuoteFile(`Câu không có nguồn\nOk (Ga 1,1)\n(Ga 1,2)\n${'a'.repeat(DASHBOARD_QUOTE_TEXT_MAX + 1)} (Ga 1,3)`, 'txt');
    expect(result.quotes).toHaveLength(1);
    expect(result.errors).toEqual([
      { line: 1, code: 'missing_source' },
      { line: 3, code: 'empty_text' },
      { line: 4, code: 'text_too_long' },
    ]);
  });
});

describe('parseDashboardQuoteFile (csv)', () => {
  it('skips a header, handles quoted commas, escaped quotes and newlines, and keeps start lines', () => {
    const csv = [
      'text,source,enabled',
      '"Lúc khởi đầu, đã có ""Ngôi Lời""","Ga 1,1",',
      '"Dòng một',
      'dòng hai","Mt 5,3"',
      'Câu tắt,Tv 23,không',
      'Quá,nhiều,cột,x',
    ].join('\n');
    const result = parseDashboardQuoteFile(csv, 'csv');
    expect(result.errors).toEqual([{ line: 6, code: 'too_many_columns' }]);
    expect(result.quotes).toEqual([
      { line: 2, text: 'Lúc khởi đầu, đã có "Ngôi Lời"', source: 'Ga 1,1', enabled: true },
      { line: 3, text: 'Dòng một\ndòng hai', source: 'Mt 5,3', enabled: true },
      { line: 5, text: 'Câu tắt', source: 'Tv 23', enabled: false },
    ]);
  });

  it('accepts Vietnamese headers, semicolon delimiters and disabled rows', () => {
    const result = parseDashboardQuoteFile('Câu trích;Nguồn;Bật\nPhúc thay;Mt 5,3;không\nChúa là mục tử;Tv 23,1;\n', 'csv');
    expect(result.errors).toEqual([]);
    expect(result.quotes).toEqual([
      { line: 2, text: 'Phúc thay', source: 'Mt 5,3', enabled: false },
      { line: 3, text: 'Chúa là mục tử', source: 'Tv 23,1', enabled: true },
    ]);
  });

  it('reports missing sources, bad flags and an unclosed quote by line', () => {
    const result = parseDashboardQuoteFile('Không nguồn,\nCâu,Ga 1,maybe\nOk,Ga 1\n"chưa đóng,Ga 2', 'csv');
    expect(result.errors).toEqual([
      { line: 1, code: 'missing_source' },
      { line: 2, code: 'invalid_enabled' },
      { line: 4, code: 'unclosed_quote' },
    ]);
    expect(result.quotes.map((quote) => quote.line)).toEqual([3]);
  });

  it('parses 100 rows', () => {
    const rows = Array.from({ length: 100 }, (_, index) => `"Câu trích số ${index + 1}","Ga 1,${index + 1}"`);
    const result = parseDashboardQuoteFile(['text,source', ...rows].join('\n'), 'csv');
    expect(result.errors).toEqual([]);
    expect(result.quotes).toHaveLength(100);
    expect(result.quotes[99]).toEqual({ line: 101, text: 'Câu trích số 100', source: 'Ga 1,100', enabled: true });
  });
});

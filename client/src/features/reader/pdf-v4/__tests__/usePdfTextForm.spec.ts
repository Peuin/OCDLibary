import { describe, expect, it, vi } from 'vitest'
import type { PdfDocumentObject, PdfEngine, PdfPageObject } from '@embedpdf/models'
import { detectUnicodeForm, inspectPdfTextForm, PDF_TEXT_PROBE_PAGE_LIMIT } from '../composables/usePdfTextForm'

function page(index: number): PdfPageObject {
  return { index, size: { width: 100, height: 100 }, rotation: 0, objectNumber: index + 1 } as PdfPageObject
}

function documentWith(pageCount: number): PdfDocumentObject {
  return {
    id: 'doc-1',
    pageCount,
    pages: Array.from({ length: pageCount }, (_, index) => page(index)),
    isEncrypted: false,
    isOwnerUnlocked: false,
    permissions: 0,
    normalizedRotation: true,
  } as PdfDocumentObject
}

function engineWithText(texts: string[]): PdfEngine {
  return {
    getPageTextRuns: vi.fn<(document: PdfDocumentObject, pdfPage: PdfPageObject) => unknown>(
      (_document: PdfDocumentObject, pdfPage: PdfPageObject) => ({
        toPromise: () => Promise.resolve({ runs: texts[pdfPage.index] ? [{ text: texts[pdfPage.index] }] : [] }),
      }),
    ),
  } as unknown as PdfEngine
}

describe('pdf text form detection', () => {
  it('detects NFD when page text contains combining marks', async () => {
    const probe = await inspectPdfTextForm(engineWithText(['con tàu']), documentWith(1))
    expect(probe).toEqual({ form: 'NFD', textStatus: 'text' })
    expect(detectUnicodeForm('con tàu')).toBe('NFD')
  })

  it('detects NFC text and scanned documents', async () => {
    await expect(inspectPdfTextForm(engineWithText(['con tàu']), documentWith(1))).resolves.toEqual({ form: 'NFC', textStatus: 'text' })
    await expect(inspectPdfTextForm(engineWithText([]), documentWith(2))).resolves.toEqual({ form: 'NFC', textStatus: 'none' })
  })

  it('stops after the first NFD text page', async () => {
    const engine = engineWithText(['plain', ' Giáo Hội ', 'unused'])
    await inspectPdfTextForm(engine, documentWith(3))
    expect(engine.getPageTextRuns).toHaveBeenCalledTimes(2)
  })

  it('caps sequential probing on large scanned documents and reports unknown rather than scanned', async () => {
    const engine = engineWithText([])
    const probe = await inspectPdfTextForm(engine, documentWith(100))

    expect(engine.getPageTextRuns).toHaveBeenCalledTimes(PDF_TEXT_PROBE_PAGE_LIMIT)
    expect(probe).toEqual({ form: 'NFC', textStatus: 'unknown' })
  })

  it('still detects text that appears inside the probe limit of a large document', async () => {
    const engine = engineWithText(Array.from({ length: 10 }, (_, index) => (index >= 5 ? 'Giáo Hội' : '')))
    const probe = await inspectPdfTextForm(engine, documentWith(100))

    expect(engine.getPageTextRuns).toHaveBeenCalledTimes(10)
    expect(probe).toEqual({ form: 'NFC', textStatus: 'text' })
  })

  it('can confirm a scanned document when the probe covers every page', async () => {
    const engine = engineWithText([])
    const probe = await inspectPdfTextForm(engine, documentWith(PDF_TEXT_PROBE_PAGE_LIMIT))

    expect(engine.getPageTextRuns).toHaveBeenCalledTimes(PDF_TEXT_PROBE_PAGE_LIMIT)
    expect(probe).toEqual({ form: 'NFC', textStatus: 'none' })
  })
})

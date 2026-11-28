import { ref, watch, type MaybeRefOrGetter } from 'vue'
import { useDocumentState, useRegistry } from '@embedpdf/core/vue'
import type { PdfDocumentObject, PdfEngine } from '@embedpdf/models'

export type PdfUnicodeForm = 'NFC' | 'NFD'

export type PdfTextLayerStatus = 'text' | 'none' | 'unknown'

export interface PdfTextFormProbe {
  form: PdfUnicodeForm
  textStatus: PdfTextLayerStatus
}

const COMBINING_MARK = /[\u0300-\u036f]/
const TEXT_PAGES_TO_INSPECT = 5
export const PDF_TEXT_PROBE_PAGE_LIMIT = 20

export function detectUnicodeForm(text: string): PdfUnicodeForm {
  return COMBINING_MARK.test(text) ? 'NFD' : 'NFC'
}

/** Reads only enough page text to identify NFC/NFD and whether the document has a text layer. */
export async function inspectPdfTextForm(engine: PdfEngine, document: PdfDocumentObject): Promise<PdfTextFormProbe> {
  let textPages = 0
  let inspectedPages = 0

  for (const page of document.pages) {
    if (inspectedPages >= PDF_TEXT_PROBE_PAGE_LIMIT) break
    inspectedPages += 1
    const runs = await engine.getPageTextRuns(document, page).toPromise()
    const text = runs.runs.map((run) => run.text).join('')
    if (!text) continue
    textPages += 1
    if (COMBINING_MARK.test(text)) return { form: 'NFD', textStatus: 'text' }
    if (textPages >= TEXT_PAGES_TO_INSPECT) break
  }

  if (textPages > 0) return { form: 'NFC', textStatus: 'text' }
  if (inspectedPages === document.pages.length) return { form: 'NFC', textStatus: 'none' }
  return { form: 'NFC', textStatus: 'unknown' }
}

export function usePdfTextForm(documentId: MaybeRefOrGetter<string>) {
  const { registry } = useRegistry()
  const documentState = useDocumentState(documentId)
  const form = ref<PdfUnicodeForm>('NFC')
  const hasText = ref(true)
  const textStatus = ref<PdfTextLayerStatus>('unknown')
  const loading = ref(false)
  let sequence = 0

  watch(
    () => documentState.value?.document,
    async (document) => {
      if (!document) return
      const engine = registry.value?.getEngine()
      if (!engine) return
      const current = ++sequence
      loading.value = true
      try {
        const probe = await inspectPdfTextForm(engine, document)
        if (current !== sequence) return
        form.value = probe.form
        textStatus.value = probe.textStatus
        hasText.value = probe.textStatus !== 'none'
      } catch {
        if (current === sequence) {
          form.value = 'NFC'
          textStatus.value = 'unknown'
          hasText.value = true
        }
      } finally {
        if (current === sequence) loading.value = false
      }
    },
    { immediate: true },
  )

  return { form, hasText, textStatus, loading }
}

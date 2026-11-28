import { computed, nextTick, readonly, ref } from 'vue'
import type { RouteLocationRaw, Router } from 'vue-router'
import { usePreferredReducedMotion } from '@vueuse/core'
import { useDisplaySettings } from '@/composables/useDisplaySettings'

/** Shared `view-transition-name` for the cover being opened and the veil it grows into. */
export const BOOK_OPEN_TRANSITION_NAME = 'book-cover-active'
/** The reader shell (ReaderView root); the veil lifts once it is in the DOM. */
export const READER_SHELL_SELECTOR = '.reader-shell'
// Longest the veil waits for the reader to mount before lifting anyway.
const READER_MOUNT_TIMEOUT_MS = 3000
// Leaving the reader waits for the destination route to render a matching cover. Normal back
// navigations find it after the short out-in route transition; the cap only bounds failure cases.
const READER_BACK_TARGET_TIMEOUT_MS = 520
const READER_BACK_FALLBACK_DURATION_MS = 450

type ViewTransitionLike = { finished: Promise<unknown>; updateCallbackDone: Promise<unknown> }
type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => ViewTransitionLike
}
type VeilFallbackStyle = { transform: string; opacity: string }

// The cover grows into a full-screen veil (BookOpenVeil, outside the router view) rather than
// into the reader itself: browsers pause rendering while the update callback runs, and the
// app's out-in route fade needs frames, so the reader cannot mount inside the callback.
// `veilVisible`: from the callback until the reader is in the DOM.
// `coverTransitionActive`: while the view transition itself runs.
const veilVisible = ref(false)
const coverTransitionActive = ref(false)
const backFallbackActive = ref(false)
const backFallbackStyle = ref<VeilFallbackStyle | null>(null)
const readerLeaveTransitionActive = ref(false)
let lastOpenedCover: HTMLElement | null = null
let lastOpenedBookId: string | null = null
let backTransitionTarget: HTMLElement | null = null
let backTransitionSource: HTMLElement | null = null
let backFallbackRun = 0

export function supportsViewTransitions(doc: Document | undefined = globalThis.document): boolean {
  return typeof (doc as DocumentWithViewTransition | undefined)?.startViewTransition === 'function'
}

async function waitForReaderShell(doc: Document, timeoutMs = READER_MOUNT_TIMEOUT_MS): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!doc.querySelector(READER_SHELL_SELECTOR) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 16))
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function prefersReducedMotionNow(): boolean {
  return typeof globalThis.matchMedia === 'function' && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Light effects: the user's "Light effects" setting or the OS reduced-motion preference. */
export function useLightReaderEffects() {
  const { lightReaderEffects } = useDisplaySettings()
  const reducedMotion = usePreferredReducedMotion()
  return computed(() => lightReaderEffects.value === true || reducedMotion.value === 'reduce')
}

function isLightNow(): boolean {
  return useDisplaySettings().lightReaderEffects.value === true || prefersReducedMotionNow()
}

function bookIdFromLocation(to: RouteLocationRaw): string | null {
  if (typeof to !== 'object' || to === null || !('params' in to)) return null
  const value = (to.params as Record<string, unknown> | undefined)?.bookId
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' || typeof first === 'number' ? String(first) : null
}

function rememberOpenedCover(to: RouteLocationRaw, source: HTMLElement | null | undefined) {
  lastOpenedBookId = bookIdFromLocation(to)
  lastOpenedCover = source ?? null
}

function coverIsVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function attributeEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function findBackTarget(doc: Document, bookId: string | number): HTMLElement | null {
  const wanted = String(bookId)
  if (lastOpenedCover && lastOpenedBookId === wanted && coverIsVisible(lastOpenedCover)) return lastOpenedCover
  for (const el of doc.querySelectorAll<HTMLElement>(`[data-book-cover-id="${attributeEscape(wanted)}"]`)) {
    if (coverIsVisible(el)) return el
  }
  return null
}

async function waitForBackTarget(doc: Document, bookId: string | number, timeoutMs: number): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const target = findBackTarget(doc, bookId)
    if (target) return target
    await sleep(16)
  }
  return findBackTarget(doc, bookId)
}

function clearBackTransitionTarget() {
  backTransitionTarget?.style.removeProperty('view-transition-name')
  backTransitionTarget = null
}

function clearBackTransitionSource() {
  backTransitionSource?.style.removeProperty('view-transition-name')
  backTransitionSource = null
}

function resetReaderLeaveTransition() {
  clearBackTransitionTarget()
  clearBackTransitionSource()
  coverTransitionActive.value = false
  veilVisible.value = false
  readerLeaveTransitionActive.value = false
}

function fallbackShrinkStyle(target: HTMLElement | null): VeilFallbackStyle {
  if (!target) return { transform: 'none', opacity: '0' }
  const rect = target.getBoundingClientRect()
  const width = globalThis.innerWidth || docClientWidth()
  const height = globalThis.innerHeight || docClientHeight()
  if (rect.width <= 0 || rect.height <= 0 || width <= 0 || height <= 0) return { transform: 'none', opacity: '0' }
  const scaleX = rect.width / width
  const scaleY = rect.height / height
  const translateX = rect.left + rect.width / 2 - width / 2
  const translateY = rect.top + rect.height / 2 - height / 2
  return {
    transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
    opacity: '0',
  }
}

function docClientWidth(): number {
  return globalThis.document?.documentElement.clientWidth ?? 0
}

function docClientHeight(): number {
  return globalThis.document?.documentElement.clientHeight ?? 0
}

async function finishBackFallback(doc: Document, bookId: string | number, timeoutMs: number, run: number) {
  const target = await waitForBackTarget(doc, bookId, timeoutMs)
  if (run !== backFallbackRun) return
  backFallbackStyle.value = fallbackShrinkStyle(target)
  await sleep(READER_BACK_FALLBACK_DURATION_MS)
  if (run !== backFallbackRun) return
  backFallbackStyle.value = null
  backFallbackActive.value = false
  veilVisible.value = false
  readerLeaveTransitionActive.value = false
}

async function leaveReaderWithCssFallback(doc: Document, bookId: string | number, timeoutMs: number): Promise<boolean> {
  readerLeaveTransitionActive.value = true
  backFallbackActive.value = true
  backFallbackStyle.value = null
  veilVisible.value = true
  await nextTick()
  const run = ++backFallbackRun
  void finishBackFallback(doc, bookId, timeoutMs, run)
  return true
}

async function leaveReaderWithViewTransition(doc: DocumentWithViewTransition, bookId: string | number, timeoutMs: number): Promise<boolean> {
  const source = doc.querySelector<HTMLElement>(READER_SHELL_SELECTOR)
  if (!source) return true

  readerLeaveTransitionActive.value = true
  backFallbackActive.value = false
  backFallbackStyle.value = null
  source.style.setProperty('view-transition-name', BOOK_OPEN_TRANSITION_NAME)
  backTransitionSource = source

  return new Promise((resolve) => {
    let transition: ViewTransitionLike
    try {
      transition = doc.startViewTransition!(async () => {
        // Resolving the leave guard inside the update callback lets Vue Router perform the
        // already requested back navigation while the browser holds the old reader snapshot.
        resolve(true)
        const target = await waitForBackTarget(doc, bookId, timeoutMs)
        if (target) {
          target.style.setProperty('view-transition-name', BOOK_OPEN_TRANSITION_NAME)
          backTransitionTarget = target
        }
      })
    } catch {
      resetReaderLeaveTransition()
      resolve(true)
      return
    }

    void transition.updateCallbackDone.catch(() => {})
    void transition.finished.then(resetReaderLeaveTransition, resetReaderLeaveTransition)
  })
}

/**
 * Leave the reader toward the library. ReaderView uses this as a route-leave guard, so the
 * same path covers the header Back buttons, format-specific Back buttons and browser back.
 */
export async function leaveReaderWithTransition(bookId: string | number, options: { targetTimeoutMs?: number } = {}): Promise<boolean> {
  if (readerLeaveTransitionActive.value || coverTransitionActive.value || veilVisible.value || isLightNow()) return true
  const doc = globalThis.document as DocumentWithViewTransition | undefined
  if (!doc) return true
  const timeoutMs = options.targetTimeoutMs ?? READER_BACK_TARGET_TIMEOUT_MS
  if (!doc.startViewTransition) return leaveReaderWithCssFallback(doc, bookId, timeoutMs)
  return leaveReaderWithViewTransition(doc, bookId, timeoutMs)
}

/**
 * Open the reader from a book cover. With View Transitions the clicked cover grows into a
 * full-screen veil that then lifts off the reader; without them (or with light effects) this
 * is a plain `router.push` and the reader runs its own CSS entrance instead.
 */
export async function openBookWithTransition(router: Router, to: RouteLocationRaw, source?: HTMLElement | null): Promise<void> {
  rememberOpenedCover(to, source)
  const doc = globalThis.document as DocumentWithViewTransition | undefined
  if (!source || !doc?.startViewTransition || isLightNow()) {
    await router.push(to)
    return
  }
  // Only the clicked cover carries the name, so grids with many covers never collide.
  source.style.setProperty('view-transition-name', BOOK_OPEN_TRANSITION_NAME)
  let navigation: Promise<unknown> = Promise.resolve()
  let transition: ViewTransitionLike
  try {
    transition = doc.startViewTransition(async () => {
      source.style.removeProperty('view-transition-name')
      coverTransitionActive.value = true
      veilVisible.value = true
      await nextTick()
      // Navigate underneath the veil; the new view is the veil, so no need to wait here.
      navigation = router.push(to)
    })
  } catch {
    source.style.removeProperty('view-transition-name')
    await router.push(to)
    return
  }
  const finish = async () => {
    coverTransitionActive.value = false
    source.style.removeProperty('view-transition-name')
    await navigation.catch(() => {})
    await waitForReaderShell(doc)
    veilVisible.value = false
  }
  void transition.finished.then(finish, finish)
  await transition.updateCallbackDone.catch(() => {})
  await navigation
}

export function useBookOpenTransition() {
  return {
    coverTransitionActive: readonly(coverTransitionActive),
    veilVisible: readonly(veilVisible),
    backFallbackActive: readonly(backFallbackActive),
    backFallbackStyle: readonly(backFallbackStyle),
    lightEffects: useLightReaderEffects(),
    openBook: openBookWithTransition,
    leaveReader: leaveReaderWithTransition,
  }
}

/** Test hook: reset module state between cases. */
export function resetBookOpenTransitionForTests() {
  clearBackTransitionTarget()
  clearBackTransitionSource()
  coverTransitionActive.value = false
  veilVisible.value = false
  backFallbackActive.value = false
  backFallbackStyle.value = null
  readerLeaveTransitionActive.value = false
  lastOpenedCover = null
  lastOpenedBookId = null
  backFallbackRun += 1
}

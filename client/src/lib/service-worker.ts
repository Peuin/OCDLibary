/**
 * Registers the PWA service worker and moves open pages onto a new build.
 *
 * The worker precaches index.html and every asset, so a page is always served the build it last
 * saw. The generated worker calls skipWaiting and clientsClaim, which makes a new build take
 * control as soon as it installs, but nothing reloads the page, so the old interface stays on
 * screen until some later visit. Reloading on the controller change shows the new build at once.
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  // A first install also changes the controller; only a replacement means a new build.
  const hadController = navigator.serviceWorker.controller !== null
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => registration.update())
      .catch(() => {
        // Offline support is a convenience; the app works without it.
      })
  })
}

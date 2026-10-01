;(function () {
  function readStoredValue(key, fallback) {
    var stored = localStorage.getItem(key)
    if (stored === null) return fallback
    try {
      return JSON.parse(stored)
    } catch {
      return stored
    }
  }

  var theme = readStoredValue('theme', 'system')
  var defaultAccent = 'carmel'
  var accent = readStoredValue('accent', defaultAccent)
  if (readStoredValue('accentDefault', '') !== defaultAccent && accent === 'blue') accent = defaultAccent
  var radius = readStoredValue('radius', 'default')
  var systemDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
  var isDark = theme === 'dark' || (theme !== 'light' && systemDark)
  if (isDark) document.documentElement.classList.add('dark')
  if (accent) document.documentElement.classList.add('accent-' + accent)
  if (radius !== 'default') document.documentElement.classList.add('radius-' + radius)
})()

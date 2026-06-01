// Runs in <head>, synchronously, before the React bundle and before first
// paint. Applies the cached colors + wallpaper from the previous session as CSS
// variables on <html>. The #bg-image / #bg-dim elements read these variables, so
// the very first painted frame shows the fully-blurred wallpaper — no flash, no
// unblurred-then-blurred pop, no JS render needed. Must be an EXTERNAL file:
// MV3 extension pages enforce `script-src 'self'` (no inline JS).
(function () {
  try {
    var b = JSON.parse(localStorage.getItem('calmtab-boot') || 'null')
    if (!b) return
    var root = document.documentElement
    var s = root.style
    if (b.useAuto && b.vars) {
      for (var k in b.vars) s.setProperty(k, b.vars[k])
    } else if (b.theme) {
      root.dataset.theme = b.theme
    }
    if (b.fade != null) s.setProperty('--fade', b.fade + 'ms')
    if (b.cardOpacity != null) s.setProperty('--card-opacity', b.cardOpacity + '%')
    if (b.onBg) s.setProperty('--on-bg', b.onBg)
    if (b.onBgShadow) s.setProperty('--on-bg-shadow', b.onBgShadow)
    if (b.dataUrl) {
      s.setProperty('--wp-image', 'url(' + b.dataUrl + ')')
      s.setProperty('--wp-blur', (b.blur || 0) + 'px')
      s.setProperty('--wp-dim', String((b.dim || 0) / 100))
      s.setProperty('--wp-on', '1')
    }
  } catch (e) {}
})()

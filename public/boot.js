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
    // The wallpaper reduced to a colour plus a gradient approximation of it.
    // Gradients paint with no decode, so this IS the first frame; the thumbnail
    // and then the real wallpaper land on top of something that already looks
    // like the wallpaper, instead of over the theme's background.
    if (b.bg) s.setProperty('--bg', b.bg)
    if (b.bgGrad) s.setProperty('--bg-grad', b.bgGrad)
    if (!b.bg && b.dataUrl) {
      // Older snapshot with no average colour in it. There is still a wallpaper,
      // so anything the theme would paint here is wrong; a neutral matching the
      // wallpaper's brightness (which `onBg` already tells us) is not.
      s.setProperty('--bg', b.onBg === '#f3f3f6' ? '#14151a' : '#e9eaee')
    }
    if (b.fade != null) s.setProperty('--fade', b.fade + 'ms')
    // Sizes are multipliers, not lengths, so they're safe to apply blind.
    if (b.uiScale != null) s.setProperty('--ui-scale', String(b.uiScale / 100))
    if (b.clockScale != null) s.setProperty('--clock-scale', String(b.clockScale / 100))
    if (b.cardOpacity != null) s.setProperty('--card-opacity', b.cardOpacity + '%')
    if (b.onBg) s.setProperty('--on-bg', b.onBg)
    if (b.onBgShadow) s.setProperty('--on-bg-shadow', b.onBgShadow)
    if (b.dataUrl) {
      s.setProperty('--wp-image', 'url(' + b.dataUrl + ')')
      // The cached image is a tiny thumbnail; extra blur hides the upscaling
      // until React swaps in the full wallpaper and restores the real blur.
      var blur = b.isThumb ? Math.max(b.blur || 0, 14) : b.blur || 0
      s.setProperty('--wp-blur', blur + 'px')
      // Must match App: full size when unblurred, quarter size otherwise.
      s.setProperty('--wp-shrink', blur > 0 ? '4' : '1')
      s.setProperty('--wp-dim', String((b.dim || 0) / 100))
      s.setProperty('--wp-on', '1')
    }
  } catch (e) {}
})()

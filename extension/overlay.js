// Injected on demand by background.js when the user presses Alt+K.
//
// The launcher itself is an extension page loaded in an iframe rather than UI
// built here, for three reasons: it reuses the React launcher verbatim, it can
// read chrome.storage directly (a content script's world cannot be trusted
// with the user's shortcuts), and the host page's CSS cannot reach into it.
// The iframe lives inside a shadow root so the page's stylesheets cannot
// restyle the backdrop either.

;(() => {
  const HOST_ID = 'calmtab-launcher-host'
  const api = globalThis.browser ?? globalThis.chrome

  // The script is re-injected on every press, so a second press closes.
  const existing = document.getElementById(HOST_ID)
  if (existing) {
    existing.remove()
    return
  }

  const host = document.createElement('div')
  host.id = HOST_ID
  // Max z-index, and `fixed` so it ignores whatever the page has scrolled to.
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;'
  const shadow = host.attachShadow({ mode: 'closed' })

  const style = document.createElement('style')
  style.textContent = `
    :host { all: initial; }
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(3px);
      display: grid;
      place-items: center;
      animation: fade 0.15s ease;
    }
    iframe {
      width: min(680px, 92vw);
      height: min(420px, 80vh);
      border: 0;
      border-radius: 18px;
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
      color-scheme: normal;
    }
    @keyframes fade { from { opacity: 0 } }
    @media (prefers-reduced-motion: reduce) { .backdrop { animation: none } }
  `

  const backdrop = document.createElement('div')
  backdrop.className = 'backdrop'

  const frame = document.createElement('iframe')
  frame.src = api.runtime.getURL('launcher.html')
  // The launcher only ever needs to run its own scripts and navigate the top
  // frame; nothing else is granted.
  frame.setAttribute('allow', '')
  backdrop.appendChild(frame)

  shadow.append(style, backdrop)
  document.documentElement.appendChild(host)

  const close = () => {
    window.removeEventListener('message', onMessage, true)
    host.remove()
  }

  function onMessage(event) {
    // Only the launcher frame may drive this — a page script posting the same
    // message shape must not be able to make us navigate.
    if (event.source !== frame.contentWindow) return
    const msg = event.data
    if (!msg || typeof msg !== 'object') return

    if (msg.type === 'calmtab:close') {
      close()
    } else if (msg.type === 'calmtab:open' && typeof msg.url === 'string') {
      // Anything but http(s) here would be a javascript:/data: injection.
      if (!/^https?:\/\//.test(msg.url)) return
      close()
      if (msg.newTab) window.open(msg.url, '_blank', 'noopener')
      else window.location.href = msg.url
    }
  }

  window.addEventListener('message', onMessage, true)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close()
  })

  frame.addEventListener('load', () => frame.contentWindow?.focus())
})()

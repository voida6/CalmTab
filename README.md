# CalmTab

A calm, customizable **Material You** new-tab dashboard for Firefox, Zen, Chrome & Edge. Local-first — no account, no tracking, everything stays in your browser.

## Features

- 🎨 **Dynamic Material You color** — pick a wallpaper and the whole UI recolors to match (or choose your own accent / a manual theme)
- 🌗 **Light & dark** with one-tap toggle; text auto-contrasts against your wallpaper
- 🕑 **Clock your way** — thirteen faces: digital, minimal, analog (flower or classic), word, flip, terminal, binary, Roman numerals, seven-segment, dot matrix, stacked, or a day/week/year progress bar
- 🌦️ **Weather** by city or device location, with hourly + 7-day forecast (Open-Meteo, no key)
- ✅ **Widgets** — daily focus, Pomodoro timer, habit tracker, countdown, crypto ticker, notes, calendar, world clocks, unit & currency converter
- ⌨️ **Keyboard launcher** — give every site a key and press it; folders chain keys (`g` `m`), search shortcuts take a term, and <kbd>Alt</kbd>+<kbd>K</kbd> opens the launcher on any page
- 🔗 **Shortcuts & apps** — themed icons or full-color favicons
- 🤖 **AI Tools** launcher (ChatGPT, Gemini, Claude, and more)
- ✨ Frosted glass, adjustable blur/dim, card shapes, no color flash on open

## Keyboard launcher

Every shortcut can own a key. With the new tab focused:

| | |
| --- | --- |
| `a`–`z`, `A`–`Z`, `0`–`9` | Open that shortcut, or step into that folder |
| <kbd>Alt</kbd> + key | Open it in a new tab |
| <kbd>/</kbd>, or any unassigned key | Start searching |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Enter</kbd> | Move through results and open one |
| <kbd>Tab</kbd> | Accept the highlighted row — a search shortcut locks in so you can type the term |
| <kbd>Esc</kbd> / <kbd>Backspace</kbd> | Clear the box, then walk back out of a search, then out of each folder |
| <kbd>Alt</kbd>+<kbd>K</kbd> | Open the launcher over whatever page you're on |
| <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd> | Save the current page (a results page is saved as a reusable search) |

The bar is never a dead end. It matches your shortcuts by name, URL and key path
(`gm` finds whatever lives at `g` → `m`), runs a search shortcut inline (`y lofi`), opens a
typed address (`claude.ai`, `localhost:3000`), and otherwise hands the text to your default
engine.

**Keyboard-only shortcuts** (the "Keys only" toggle on any shortcut) answer to their key and
turn up in search, but never take a tile on the page — so `w` can open Wikipedia without
Wikipedia sitting on your new tab.

**New-tab focus** (Settings → Keys) decides where the keyboard starts. The default puts the
caret in CalmTab's own search box, so typing goes there rather than the address bar; a bound
key still jumps while that box is empty. The other options leave the address bar alone, or
give the keys to the page. Firefox and Zen may keep the address bar focused regardless —
that's the browser's call, and <kbd>Esc</kbd> hands the keys over.

**Minimal mode** (Settings → Widgets) strips the page back to the clock and the launcher. The
settings gear fades back in when you move the mouse, and <kbd>Ctrl</kbd>+<kbd>,</kbd> always
opens the panel.

**Size** (Settings → Size) has two sliders: one scales the whole page, the other sizes the
clock on top of that — so a big clock with small everything else is a valid answer.

**How much to show** (Settings → Widgets) goes from everything, to minimal (clock and
launcher only), to nothing at all — a bare wallpaper where moving the mouse or typing brings
the launcher back, then lets it fade away again.

## If it feels slow

Two settings are worth knowing about:

- **Reduce effects** (Settings → Widgets) turns off the frosted-glass blur behind cards and
  panels. Backdrop blur is by far the most expensive thing on the page.
- **Wallpaper blur** at 0 skips the blur pass entirely. Any value above 0 renders the
  wallpaper layer at quarter size and scales it back up — a sixteenth of the pixels for the
  same look — which matters most for animated GIF and video wallpapers, where the browser
  otherwise repeats that work on every frame.

Keys are **case-sensitive**, so `m` and `M` are two different slots — 62 per folder. Assign
them in Settings → Links, along with folders and `%s` search templates. Rebind the two
<kbd>Alt</kbd> shortcuts at `about:addons` → gear → Manage Extension Shortcuts (Firefox &
Zen) or `chrome://extensions/shortcuts`.

## Install (no build needed)

Grab the zip for your browser from the [Releases](https://github.com/voida6/CalmTab/releases)
page and unzip it.

**Firefox / Zen** — `CalmTab-firefox-vX.Y.Z.zip`, loaded via `about:debugging` → This
Firefox → Load Temporary Add-on → pick the `manifest.json` inside. (Requires Firefox 140+;
Zen is well past that.)

**Chrome / Edge** — `CalmTab-chrome-vX.Y.Z.zip`, loaded at `chrome://extensions` (or
`edge://extensions`) → enable **Developer mode** → **Load unpacked** → select the unzipped
folder.

Then open a new tab ✨

## Build it yourself

- `npm install`
- `npm run build` — builds both targets, or `npm run build:firefox` / `npm run build:chrome`
- Load unpacked → **`release/firefox/`** or **`release/chrome/`**

The two targets share every byte of app code and differ only in the manifest, so the
Firefox/Zen and Chrome listings can be published and updated independently.

## Dev

- `npm run dev` — Vite dev server (uses `localStorage`; `chrome.*` falls back automatically)
- `npm test` — unit tests for the keyboard launcher

## Tech

- Vite + React + TypeScript, Manifest V3. No backend.
- Permissions: no host access is requested for the overlay — `activeTab` is granted by the
  browser only for the tab you press <kbd>Alt</kbd>+<kbd>K</kbd> on.
- Storage: `chrome.storage.sync` for preferences (roams with your browser profile), `chrome.storage.local` for tasks/habits/caches, IndexedDB for the wallpaper. All open tabs stay in sync live.

## Privacy

No accounts, no analytics, no tracking — see [PRIVACY.md](PRIVACY.md).

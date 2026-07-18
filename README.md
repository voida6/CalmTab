# CalmTab

A calm, customizable **Material You** new-tab dashboard for Chrome & Edge. Local-first — no account, no tracking, everything stays in your browser.

## Features

- 🎨 **Dynamic Material You color** — pick a wallpaper and the whole UI recolors to match (or choose your own accent / a manual theme)
- 🌗 **Light & dark** with one-tap toggle; text auto-contrasts against your wallpaper
- 🕑 **Clock your way** — digital, minimal, analog (flower or classic), word, or flip
- 🌦️ **Weather** by city or device location, with hourly + 7-day forecast (Open-Meteo, no key)
- ✅ **Widgets** — daily focus, Pomodoro timer, habit tracker, countdown, crypto ticker, notes
- 🔗 **Shortcuts & apps** — themed icons or full-color favicons
- 🤖 **AI Tools** launcher (ChatGPT, Gemini, Claude, and more)
- ✨ Frosted glass, adjustable blur/dim, card shapes, no color flash on open

## Install (no build needed)

- Download `CalmTab-vX.Y.Z.zip` from the [Releases](https://github.com/voida6/CalmTab/releases) page
- Unzip it
- Go to `chrome://extensions` (or `edge://extensions`) → enable **Developer mode**
- Click **Load unpacked** → select the unzipped **`CalmTab`** folder
- Open a new tab ✨

## Build it yourself

- `npm install`
- `npm run build`
- Load unpacked → the **`dist/`** folder

## Firefox

- Build, then replace `dist/manifest.json` with `public/manifest.firefox.json` (renamed to `manifest.json`)
- Load via `about:debugging` → This Firefox → Load Temporary Add-on

## Dev

- `npm run dev` — Vite dev server (uses `localStorage`; `chrome.*` falls back automatically)

## Tech

- Vite + React + TypeScript, Manifest V3. No backend.
- Storage: `chrome.storage.sync` for preferences (roams with your browser profile), `chrome.storage.local` for tasks/habits/caches, IndexedDB for the wallpaper. All open tabs stay in sync live.

## Privacy

No accounts, no analytics, no tracking — see [PRIVACY.md](PRIVACY.md).

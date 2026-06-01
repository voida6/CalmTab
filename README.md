# CalmTab

A calm, customizable **Material You** new-tab dashboard for Chrome & Edge. Local-first — no account, no tracking, everything stays in your browser.

## Features

- 🎨 **Dynamic Material You color** — pick a wallpaper and the whole UI recolors to match (or choose your own accent / a manual theme)
- 🌗 **Light & dark** with one-tap toggle; text auto-contrasts against your wallpaper
- 🕑 **Clock your way** — digital, minimal, analog (flower or classic), word, or flip
- 🌦️ **Weather** with a 3-day forecast (Open-Meteo, no key)
- ✅ **Widgets** — daily focus, Pomodoro timer, habit tracker, countdown, crypto ticker
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

## Dev

- `npm run dev` — Vite dev server (uses `localStorage`; `chrome.*` falls back automatically)

## Tech

- Vite + React + TypeScript, Manifest V3, `chrome.storage.local`. No backend.

# CalmTab

A calm, customizable **Material You** new-tab dashboard for Chrome & Edge. Local-first, no account, no tracking — everything lives in your browser.

Open a new tab and you get a clean dashboard: a live clock, a time-aware greeting, weather, search, a daily quote, and quick links — over a wallpaper of your choice, with the whole UI tinted to match it.

---

## Features

- **Dynamic Material You color** — pick a wallpaper and CalmTab extracts a color palette from it (via Google's [`material-color-utilities`](https://github.com/material-foundation/material-color-utilities)) and recolors the entire UI to match. Prefer to set it yourself? Switch to a manual theme (Dusk Purple, Midnight, Deep Teal).
- **Your wallpaper, your way** — upload any image; tune **background blur**, a **dim overlay**, and **frosted-glass cards**. Backgrounds are downscaled and stored locally.
- **Live clock & greeting** — ticking clock plus a greeting that changes with the time of day, an editable name, and a custom tagline.
- **Weather** — current conditions, temperature, humidity, and today's min/max for any city, via the free [Open-Meteo](https://open-meteo.com/) API (no key required). °C / °F toggle.
- **Search** — Google, Bing, or DuckDuckGo, with voice input where supported.
- **Quick-links dock** — shortcuts rendered as themed, monochrome Material You glyphs that tint with your palette (with a letter-monogram fallback).
- **Tasks** — a lightweight to-do panel.
- **Daily quote** — a rotating quote of the day.
- **Polished feel** — no color flash on open (a pre-paint boot script applies your colors before the first frame), and a tunable **fade-in speed** slider.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- Manifest V3 (`chrome_url_overrides.newtab`)
- `chrome.storage.local` for all persistence (with a `localStorage` fallback in dev)
- No backend, no accounts, no analytics

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) LTS (v18+)

### Build

```bash
npm install
npm run build
```

This outputs the unpacked extension to `dist/`.

### Load it in your browser

1. Go to `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` folder.
4. Open a new tab.

After making changes, run `npm run build` again and hit the reload icon on the CalmTab card.

## Development

```bash
npm run dev      # Vite dev server at http://localhost:5173 (uses localStorage)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

> In the dev server the `chrome.*` APIs aren't available, so storage transparently falls back to `localStorage`.

## Project structure

```
public/
  manifest.json        # MV3 manifest (newtab override)
  boot.js              # pre-paint script: applies cached colors/wallpaper before first frame
  icons/               # extension icons
src/
  App.tsx              # layout + state, theme/background application
  theme/material.css   # Material 3 tonal tokens (CSS variables)
  lib/
    storage.ts         # chrome.storage wrapper (+ localStorage fallback)
    types.ts           # settings/types + defaults
    weather.ts         # Open-Meteo client
    dynamicColor.ts    # wallpaper -> Material You palette (lazy-loaded)
    image.ts           # wallpaper downscaling
  data/
    quotes.ts          # quote-of-the-day
    brandIcons.ts      # themed shortcut glyphs
  components/          # Clock, Greeting, WeatherCard, SearchBar, QuoteCard,
                       # LinksDock, TodoPanel, SettingsPanel, ...
```

## Privacy

CalmTab is **local-first**. Your settings, tasks, links, and wallpaper never leave your browser. The only network requests are to Open-Meteo for weather (and only for the city you set).

## Roadmap

- [x] Phase 1 — fixed-layout Material dashboard
- [x] Wallpaper upload + dynamic Material You color
- [x] Frosted glass, blur/dim, themed icons, smooth entrance
- [ ] Curated & daily-random wallpapers
- [ ] Analog clock option
- [ ] AI assistant button (launch ChatGPT / Gemini / etc.)
- [ ] Phase 2 — drag-and-drop "build your own dashboard" widget canvas

---

Built with [Claude Code](https://claude.com/claude-code).
